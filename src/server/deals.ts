"use server";

import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const dealStageSchema = z.object({
  id: z.string().min(1),
  stage: z.enum([
    "inquiry",
    "viewing",
    "negotiation",
    "offer",
    "contract",
    "won",
    "lost",
  ]),
  value: z.number().optional(),
  commission_amount: z.number().optional(),
  lost_reason: z.string().optional(),
});

export async function updateDealStage(
  input: z.infer<typeof dealStageSchema>
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const parsed = dealStageSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = createSupabaseServiceClient();

    // Fetch the deal to check ownership
    const { data: deal, error: fetchError } = await supabase
      .from("deals")
      .select("id, assigned_to, stage, value")
      .eq("id", parsed.data.id)
      .is("deleted_at", null)
      .single();

    if (fetchError || !deal) return { ok: false, error: "Deal not found" };

    // Agents can only move their own deals
    if (user.role === "agent" && deal.assigned_to !== user.id) {
      return { ok: false, error: "You can only move your own deals" };
    }

    // Moving to lost requires a reason
    if (parsed.data.stage === "lost" && !parsed.data.lost_reason) {
      return { ok: false, error: "Lost reason is required" };
    }

    const updateData: Record<string, unknown> = {
      stage: parsed.data.stage,
      stage_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.value !== undefined) {
      updateData.value = Math.round(parsed.data.value * 100);
    }
    if (parsed.data.commission_amount !== undefined) {
      updateData.commission_amount = Math.round(parsed.data.commission_amount * 100);
    }
    if (parsed.data.lost_reason) {
      updateData.lost_reason = parsed.data.lost_reason;
    }

    const { error } = await supabase
      .from("deals")
      .update(updateData)
      .eq("id", parsed.data.id);

    if (error) return { ok: false, error: error.message };

    // If moving to "won", activate the linked customer (created at convert)
    if (parsed.data.stage === "won" && deal) {
      const { data: fullDeal } = await supabase
        .from("deals")
        .select("lead_id, customer_id")
        .eq("id", parsed.data.id)
        .single();

      if (fullDeal?.customer_id) {
        await supabase
          .from("customers")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("id", fullDeal.customer_id);
      } else if (fullDeal?.lead_id) {
        await supabase.rpc("create_customer_from_lead", {
          p_lead_id: fullDeal.lead_id,
          p_deal_id: parsed.data.id,
        });
      }

      // Log deal activity
      await supabase.from("deal_activities").insert({
        deal_id: parsed.data.id,
        type: "won",
        summary: `Deal won${parsed.data.value ? ` — Value: ${parsed.data.value} AED` : ""}`,
        created_by: user.id,
      });

      revalidatePath("/customers");
      revalidatePath(`/customers/${fullDeal?.customer_id ?? ""}`);
    } else {
      // Log stage change as deal activity
      await supabase.from("deal_activities").insert({
        deal_id: parsed.data.id,
        type: "stage_change",
        summary: `Stage changed: ${deal.stage} → ${parsed.data.stage}`,
        created_by: user.id,
      });
    }

    await logActivity({
      actorId: user.id,
      entityType: "deal",
      entityId: parsed.data.id,
      action: `stage_changed:${deal.stage}->${parsed.data.stage}`,
    });

    revalidatePath("/pipeline");
    revalidatePath(`/pipeline/${parsed.data.id}`);
    revalidatePath("/deals");
    revalidatePath("/leads");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function createDeal(input: {
  title: string;
  customer_id: string;
  deal_type?: string;
  value?: number;
  assigned_to?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = createSupabaseServiceClient();

    const { data, error } = await supabase
      .from("deals")
      .insert({
        title: input.title,
        customer_id: input.customer_id,
        deal_type: (input.deal_type as "sale" | "rental" | "off_plan") ?? "sale",
        stage: "inquiry",
        value: input.value ? Math.round(input.value * 100) : 0,
        assigned_to: input.assigned_to ?? user.id,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "deal",
      entityId: data.id,
      action: "created",
    });

    revalidatePath("/pipeline");
    revalidatePath("/deals");
    revalidatePath("/customers");
    revalidatePath(`/customers/${input.customer_id}`);
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function addDealActivity(
  dealId: string,
  type: string,
  summary: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = createSupabaseServiceClient();

    const { error } = await supabase.from("deal_activities").insert({
      deal_id: dealId,
      type,
      summary,
      created_by: user.id,
    });

    if (error) return { ok: false, error: error.message };

    revalidatePath("/pipeline");
    revalidatePath(`/pipeline/${dealId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function assignDeal(
  dealId: string,
  agentId: string | null
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!["admin", "manager"].includes(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const supabase = createSupabaseServiceClient();

    const { error } = await supabase
      .from("deals")
      .update({
        assigned_to: agentId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dealId);

    if (error) return { ok: false, error: error.message };

    await supabase.from("deal_activities").insert({
      deal_id: dealId,
      type: "assignment",
      summary: agentId ? "Deal assigned to agent" : "Deal unassigned",
      created_by: user.id,
    });

    revalidatePath("/pipeline");
    revalidatePath(`/pipeline/${dealId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateDeal(
  dealId: string,
  input: {
    title?: string;
    value?: number;
    expected_close_date?: string | null;
    commission_rate?: number | null;
  }
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = createSupabaseServiceClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.title !== undefined) updateData.title = input.title;
    if (input.value !== undefined) updateData.value = Math.round(input.value * 100);
    if (input.expected_close_date !== undefined) updateData.expected_close_date = input.expected_close_date;
    if (input.commission_rate !== undefined) updateData.commission_rate = input.commission_rate;

    const { error } = await supabase
      .from("deals")
      .update(updateData)
      .eq("id", dealId);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/pipeline");
    revalidatePath(`/pipeline/${dealId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
