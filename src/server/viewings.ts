"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { addDealProperty } from "@/server/inventory";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const viewingSchema = z.object({
  lead_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  property_id: z.string().uuid().optional().nullable(),
  listing_id: z.string().uuid().optional().nullable(),
  scheduled_at: z.string().min(1, "Date and time required"),
  agent_id: z.string().uuid().optional().nullable(),
  note: z.string().optional().nullable(),
});

function revalidateViewing(leadId?: string | null, dealId?: string | null) {
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/inventory");
  revalidatePath("/viewings");
  revalidatePath("/dashboard");
  if (leadId) revalidatePath(`/leads/${leadId}`);
  if (dealId) revalidatePath(`/pipeline/${dealId}`);
}

export async function scheduleViewing(
  input: z.infer<typeof viewingSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    const parsed = viewingSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const data = parsed.data;
    if (!data.lead_id && !data.deal_id) {
      return { ok: false, error: "Viewing must belong to a lead or a deal" };
    }

    const supabase = await createSupabaseServerClient();
    const { data: row, error } = await supabase
      .from("lead_viewings")
      .insert({
        lead_id: data.lead_id || null,
        deal_id: data.deal_id || null,
        property_id: data.property_id || null,
        listing_id: data.listing_id || null,
        scheduled_at: new Date(data.scheduled_at).toISOString(),
        agent_id: data.agent_id || user.id,
        note: data.note || null,
        status: "scheduled",
      })
      .select("id")
      .single();

    if (error || !row) return { ok: false, error: error?.message ?? "Could not schedule viewing" };

    if (data.deal_id && data.property_id) {
      await addDealProperty({
        dealId: data.deal_id,
        propertyId: data.property_id,
        listingId: data.listing_id,
        role: "viewed",
      });
    }

    const when = new Date(data.scheduled_at).toLocaleString("en-AE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (data.lead_id) {
      await supabase.from("lead_activities").insert({
        lead_id: data.lead_id,
        type: "viewing",
        summary: `Viewing scheduled for ${when}`,
        created_by: user.id,
      });
      await supabase
        .from("leads")
        .update({ last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", data.lead_id);
    }
    if (data.deal_id) {
      await supabase.from("deal_activities").insert({
        deal_id: data.deal_id,
        type: "viewing",
        summary: `Viewing scheduled for ${when}`,
        created_by: user.id,
      });
    }

    revalidateViewing(data.lead_id, data.deal_id);
    return { ok: true, data: { id: row.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateViewingOutcome(input: {
  id: string;
  status: "scheduled" | "completed" | "no_show" | "cancelled";
  outcome?: string | null;
  outcome_note?: string | null;
}): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    const supabase = await createSupabaseServerClient();
    const { data: viewing, error: fetchError } = await supabase
      .from("lead_viewings")
      .select("id, lead_id, deal_id")
      .eq("id", input.id)
      .maybeSingle();
    if (fetchError || !viewing) return { ok: false, error: "Viewing not found" };

    const { error } = await supabase
      .from("lead_viewings")
      .update({
        status: input.status,
        outcome: input.outcome || null,
        outcome_note: input.outcome_note || null,
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };

    const label =
      input.status === "completed"
        ? `Viewing completed${input.outcome ? ` · ${input.outcome.replace(/_/g, " ")}` : ""}`
        : `Viewing ${input.status.replace(/_/g, " ")}`;

    if (viewing.lead_id) {
      await supabase.from("lead_activities").insert({
        lead_id: viewing.lead_id,
        type: "viewing",
        summary: label,
        created_by: user.id,
      });
    }
    if (viewing.deal_id) {
      await supabase.from("deal_activities").insert({
        deal_id: viewing.deal_id,
        type: "viewing",
        summary: label,
        created_by: user.id,
      });
    }

    revalidateViewing(viewing.lead_id, viewing.deal_id);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
