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

const leadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")),
  source: z.enum([
    "website",
    "bayut",
    "property_finder",
    "dubizzle",
    "referral",
    "walk_in",
    "social",
    "other",
  ]),
  interest: z.enum(["buy", "rent", "sell", "off_plan", "commercial"]),
  budget_min: z.number().optional().nullable(),
  budget_max: z.number().optional().nullable(),
  preferred_areas: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  next_follow_up_at: z.string().optional().nullable(),
});

export async function createLead(
  input: z.infer<typeof leadSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const parsed = leadSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = await createSupabaseServerClient();

    // Duplicate guard
    if (parsed.data.phone || parsed.data.email) {
      let dupQuery = supabase
        .from("leads")
        .select("id, name, phone, email")
        .eq("deleted_at", null)
        .limit(1);
      if (parsed.data.phone) {
        dupQuery = dupQuery.eq("phone", parsed.data.phone);
      }
      if (parsed.data.email) {
        dupQuery = dupQuery.eq("email", parsed.data.email);
      }
      const { data: dup } = await dupQuery.maybeSingle();
      if (dup) {
        return {
          ok: false,
          error: `Duplicate lead found: ${dup.name} (${parsed.data.phone ?? parsed.data.email})`,
        };
      }
    }

    const { data, error } = await supabase
      .from("leads")
      .insert({
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        source: parsed.data.source,
        interest: parsed.data.interest,
        budget_min: parsed.data.budget_min ?? null,
        budget_max: parsed.data.budget_max ?? null,
        preferred_areas: parsed.data.preferred_areas,
        notes: parsed.data.notes || null,
        assigned_to: parsed.data.assigned_to || null,
        next_follow_up_at: parsed.data.next_follow_up_at || null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "lead",
      entityId: data.id,
      action: "created",
    });

    revalidatePath("/leads");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateLead(
  id: string,
  input: Partial<z.infer<typeof leadSchema>>
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("leads")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "lead",
      entityId: id,
      action: "updated",
      diff: input as Record<string, unknown>,
    });

    revalidatePath("/leads");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function convertLead(
  leadId: string,
  options: { dealTitle?: string; dealValue?: number; propertyId?: string }
): Promise<ActionResult<{ customerId: string; dealId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();

    // Fetch the lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();
    if (leadError || !lead) return { ok: false, error: "Lead not found" };
    if (lead.status === "converted") return { ok: false, error: "Lead already converted" };

    // Create customer as "prospect" — becomes "active" when deal is won
    const { data: customer, error: custError } = await supabase
      .from("customers")
      .insert({
        type: "individual",
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        notes: lead.notes,
        assigned_to: lead.assigned_to,
        created_by: user.id,
        lead_id: leadId,
        status: "prospect",
      })
      .select("id")
      .single();
    if (custError) return { ok: false, error: custError.message };

    // Always create a deal — this is the unified flow
    const title = options.dealTitle || `${lead.interest} — ${lead.name}`;
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .insert({
        title,
        customer_id: customer.id,
        property_id: options.propertyId || null,
        deal_type: lead.interest === "rent" ? "rental" : lead.interest === "off_plan" ? "off_plan" : "sale",
        stage: "inquiry",
        value: options.dealValue ? Math.round(options.dealValue * 100) : 0,
        assigned_to: lead.assigned_to,
        created_by: user.id,
        lead_id: leadId,
      })
      .select("id")
      .single();
    if (dealError) return { ok: false, error: dealError.message };

    // Update lead status
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        status: "converted",
        converted_customer_id: customer.id,
        converted_deal_id: deal.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);
    if (updateError) return { ok: false, error: updateError.message };

    // Log activities on both lead and deal
    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      type: "converted",
      summary: `Lead converted to pipeline deal: ${title}`,
      created_by: user.id,
    });

    await supabase.from("deal_activities").insert({
      deal_id: deal.id,
      type: "created",
      summary: `Deal created from lead: ${lead.name}`,
      created_by: user.id,
    });

    await logActivity({
      actorId: user.id,
      entityType: "lead",
      entityId: leadId,
      action: "converted",
      diff: { customerId: customer.id, dealId: deal.id },
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/customers");
    revalidatePath("/pipeline");
    return { ok: true, data: { customerId: customer.id, dealId: deal.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function addLeadActivity(
  leadId: string,
  type: string,
  summary: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("lead_activities").insert({
      lead_id: leadId,
      type,
      summary,
      created_by: user.id,
    });

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function assignLead(
  leadId: string,
  agentId: string | null
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!["admin", "manager"].includes(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("leads")
      .update({
        assigned_to: agentId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (error) return { ok: false, error: error.message };

    if (agentId) {
      await supabase.from("lead_activities").insert({
        lead_id: leadId,
        type: "assignment",
        summary: `Lead assigned to agent`,
        created_by: user.id,
      });
    }

    await logActivity({
      actorId: user.id,
      entityType: "lead",
      entityId: leadId,
      action: agentId ? "assigned" : "unassigned",
      diff: { assigned_to: agentId },
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function bulkAssignLeads(
  leadIds: string[],
  agentId: string | null
): Promise<ActionResult<{ assigned: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!["admin", "manager"].includes(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("leads")
      .update({
        assigned_to: agentId,
        updated_at: new Date().toISOString(),
      })
      .in("id", leadIds)
      .eq("deleted_at", null)
      .select("id");

    if (error) return { ok: false, error: error.message };

    const assignedCount = data?.length ?? 0;

    if (agentId && assignedCount > 0) {
      const activities = (data ?? []).map((lead) => ({
        lead_id: lead.id,
        type: "assignment",
        summary: `Bulk assigned to agent`,
        created_by: user.id,
      }));
      await supabase.from("lead_activities").insert(activities);
    }

    await logActivity({
      actorId: user.id,
      entityType: "lead",
      entityId: leadIds[0] ?? "",
      action: "bulk_assigned",
      diff: { count: assignedCount, assigned_to: agentId },
    });

    revalidatePath("/leads");
    return { ok: true, data: { assigned: assignedCount } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function scheduleFollowUp(
  leadId: string,
  followUpAt: string,
  notes?: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();

    const { error: leadError } = await supabase
      .from("leads")
      .update({
        next_follow_up_at: followUpAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (leadError) return { ok: false, error: leadError.message };

    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      type: "follow_up_scheduled",
      summary: notes || `Follow-up scheduled for ${followUpAt}`,
      created_by: user.id,
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateLeadStatus(
  leadId: string,
  status: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const validStatuses = ["new", "contacted", "qualified", "unqualified", "converted"];
    if (!validStatuses.includes(status)) {
      return { ok: false, error: "Invalid status" };
    }

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("leads")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (error) return { ok: false, error: error.message };

    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      type: "status_change",
      summary: `Status changed to ${status}`,
      created_by: user.id,
    });

    await logActivity({
      actorId: user.id,
      entityType: "lead",
      entityId: leadId,
      action: "status_changed",
      diff: { status },
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
