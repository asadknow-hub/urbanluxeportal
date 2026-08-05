"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const dealStageSchema = z.object({
  id: z.string().uuid(),
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

    const supabase = await createSupabaseServerClient();

    // Fetch the deal to check ownership
    const { data: deal, error: fetchError } = await supabase
      .from("deals")
      .select("id, assigned_to, stage, value")
      .eq("id", parsed.data.id)
      .eq("deleted_at", null)
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

    await logActivity({
      actorId: user.id,
      entityType: "deal",
      entityId: parsed.data.id,
      action: `stage_changed:${deal.stage}->${parsed.data.stage}`,
    });

    revalidatePath("/pipeline");
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

    const supabase = await createSupabaseServerClient();

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
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
