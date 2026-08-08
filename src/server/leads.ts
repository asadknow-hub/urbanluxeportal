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
  stage_id: z.string().uuid().optional().nullable(),
  language: z.string().optional().nullable(),
  financing: z.string().optional().nullable(),
  timeframe: z.string().optional().nullable(),
  purpose: z.string().optional().nullable(),
  bedrooms: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  custom: z.record(z.string(), z.unknown()).optional().default({}),
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

    const supabase = createSupabaseServiceClient();

    // Duplicate guard
    if (parsed.data.phone || parsed.data.email) {
      let dupQuery = supabase
        .from("leads")
        .select("id, name, phone, email")
        .is("deleted_at", null)
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

    // Get the 'New' stage as default — use service client to bypass RLS
    let stageId = parsed.data.stage_id;
    if (!stageId) {
      const serviceClient = createSupabaseServiceClient();
      const { data: newStage } = await serviceClient
        .from("lead_stages")
        .select("id")
        .eq("name", "New")
        .eq("kind", "open")
        .single();
      stageId = newStage?.id ?? null;
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
        stage_id: stageId,
        language: parsed.data.language || null,
        financing: parsed.data.financing || null,
        timeframe: parsed.data.timeframe || null,
        purpose: parsed.data.purpose || null,
        bedrooms: parsed.data.bedrooms || null,
        category: parsed.data.category || null,
        tags: parsed.data.tags ?? [],
        custom: parsed.data.custom ?? {},
        last_activity_at: new Date().toISOString(),
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

    // Log lead event
    if (data) {
      await supabase.from("lead_events").insert({
        lead_id: data.id,
        kind: "created",
        actor_id: user.id,
        payload: { source: parsed.data.source, stage: "New" },
      });
    }

    revalidatePath("/leads");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateLeadStage(
  leadId: string,
  stageId: string,
  extra?: { lost_reason?: string; junk_reason?: string }
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = createSupabaseServiceClient();

    // Fetch stage + current lead in parallel (reduces 2 round-trips to 1)
    const [
      { data: stage, error: stageError },
      { data: lead },
    ] = await Promise.all([
      supabase.from("lead_stages").select("*").eq("id", stageId).single(),
      supabase.from("leads").select("*").eq("id", leadId).single(),
    ]);
    if (stageError || !stage) return { ok: false, error: "Stage not found" };
    if (!lead) return { ok: false, error: "Lead not found" };

    // Check required fields (use the already-fetched full lead)
    const requiredFields = (stage.required_fields as string[]) ?? [];
    if (requiredFields.length > 0) {
      const missing: string[] = [];
      for (const field of requiredFields) {
        if (field === "viewing_scheduled") {
 // skip for now — L2
        } else if (field === "activity_logged") {
          // skip for now — L2
        } else if (field === "lost_reason") {
          if (!extra?.lost_reason) missing.push("Lost reason");
        } else if (field === "junk_reason") {
          if (!extra?.junk_reason) missing.push("Junk reason");
        } else {
          const val = (lead as Record<string, unknown>)?.[field];
          if (val === null || val === undefined || val === "") {
            missing.push(field.replace(/_/g, " "));
          }
        }
      }
      if (missing.length > 0) {
        return { ok: false, error: `Missing required fields: ${missing.join(", ")}` };
      }
    }

    // Update lead stage
    const updateData: Record<string, unknown> = {
      stage_id: stageId,
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    };

    // Map stage kind to legacy status for backward compat
    // Only use stage.kind (dynamic, DB-driven) — never match on stage names
    if (stage.kind === "won") updateData.status = "converted";
    else if (stage.kind === "lost" || stage.kind === "junk") updateData.status = "unqualified";
    else if (stage.kind === "active") updateData.status = stage.sort <= 1 ? "new" : "qualified";

    if (extra?.lost_reason) updateData.lost_reason = extra.lost_reason;
    if (extra?.junk_reason) updateData.junk_reason = extra.junk_reason;

    const { error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", leadId);

    if (error) return { ok: false, error: error.message };

    // Log events in parallel (fire-and-forget, don't block the response)
    Promise.all([
      supabase.from("lead_events").insert({
        lead_id: leadId,
        kind: "stage_changed",
        actor_id: user.id,
        payload: { from_stage_id: lead.stage_id, to_stage_id: stageId, stage_name: stage.name },
      }),
      supabase.from("lead_activities").insert({
        lead_id: leadId,
        type: "stage_change",
        summary: `Moved to ${stage.name}`,
        created_by: user.id,
      }),
    ]).catch(() => {}); // ignore logging errors

    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function claimLead(
  leadId: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = createSupabaseServiceClient();

    // Conditional update: only claim if still unassigned
    const { data, error } = await supabase
      .from("leads")
      .update({
        assigned_to: user.id,
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", leadId)
      .is("assigned_to", null)
      .select("id, assigned_to")
      .single();

    if (error || !data) {
      return { ok: false, error: "Lead already claimed by someone else" };
    }

    // Log assignment + event + activity in parallel (fire-and-forget)
    Promise.all([
      supabase.from("lead_assignments").insert({
        lead_id: leadId,
        from_user: null,
        to_user: user.id,
        reason: "claim",
      }),
      supabase.from("lead_events").insert({
        lead_id: leadId,
        kind: "claimed",
        actor_id: user.id,
        payload: {},
      }),
      supabase.from("lead_activities").insert({
        lead_id: leadId,
        type: "assignment",
        summary: "Lead claimed from pool",
        created_by: user.id,
      }),
    ]).catch(() => {}); // ignore logging errors

    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
    return { ok: true };
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

    const supabase = createSupabaseServiceClient();

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

    const supabase = createSupabaseServiceClient();

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

    const supabase = createSupabaseServiceClient();

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

    const supabase = createSupabaseServiceClient();

    const { error } = await supabase
      .from("leads")
      .update({
        assigned_to: agentId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (error) return { ok: false, error: error.message };

    // Log activity + audit in parallel (fire-and-forget, don't block response)
    const logPromises: Promise<unknown>[] = [];
    if (agentId) {
      logPromises.push(
        Promise.resolve(supabase.from("lead_activities").insert({
          lead_id: leadId,
          type: "assignment",
          summary: `Lead assigned to agent`,
          created_by: user.id,
        }))
      );
    }
    logPromises.push(logActivity({
      actorId: user.id,
      entityType: "lead",
      entityId: leadId,
      action: agentId ? "assigned" : "unassigned",
      diff: { assigned_to: agentId },
    }));
    Promise.all(logPromises).catch(() => {}); // ignore logging errors

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

    const supabase = createSupabaseServiceClient();

    const { data, error } = await supabase
      .from("leads")
      .update({
        assigned_to: agentId,
        updated_at: new Date().toISOString(),
      })
      .in("id", leadIds)
      .is("deleted_at", null)
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

    const supabase = createSupabaseServiceClient();

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

    const supabase = createSupabaseServiceClient();

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

export async function deleteLead(leadId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!["admin", "manager"].includes(user.role)) {
      return { ok: false, error: "Only admins and managers can delete leads" };
    }

    const supabase = createSupabaseServiceClient();

    const { error } = await supabase
      .from("leads")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "lead",
      entityId: leadId,
      action: "deleted",
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

const sourceSchema = z.object({
  kind: z.enum(["web_form", "instagram", "facebook", "google_ads", "property_finder", "bayut", "dubizzle", "referral", "walk_in", "api", "import", "other"]),
  name: z.string().min(1, "Name is required"),
  token: z.string().optional().nullable(),
  secret: z.string().optional().nullable(),
  config: z.record(z.string(), z.unknown()).optional().default({}),
  is_active: z.boolean().optional().default(true),
});

export async function createLeadSource(
  input: z.infer<typeof sourceSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (user.role !== "admin" && user.role !== "manager") {
      return { ok: false, error: "Only admins and managers can configure lead sources" };
    }

    const parsed = sourceSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = createSupabaseServiceClient();

    const { data, error } = await supabase
      .from("lead_sources")
      .insert({
        kind: parsed.data.kind,
        name: parsed.data.name,
        token: parsed.data.token || null,
        secret: parsed.data.secret || null,
        config: parsed.data.config ?? {},
        is_active: parsed.data.is_active,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads/inflow");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateLeadSource(
  id: string,
  input: Partial<z.infer<typeof sourceSchema>>
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (user.role !== "admin" && user.role !== "manager") {
      return { ok: false, error: "Only admins and managers can configure lead sources" };
    }

    const supabase = createSupabaseServiceClient();

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.kind !== undefined) updateData.kind = input.kind;
    if (input.token !== undefined) updateData.token = input.token || null;
    if (input.secret !== undefined) updateData.secret = input.secret || null;
    if (input.config !== undefined) updateData.config = input.config;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    const { error } = await supabase
      .from("lead_sources")
      .update(updateData)
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads/inflow");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function toggleLeadSource(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (user.role !== "admin" && user.role !== "manager") {
      return { ok: false, error: "Only admins and managers can configure lead sources" };
    }

    const supabase = createSupabaseServiceClient();

    const { error } = await supabase
      .from("lead_sources")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads/inflow");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteLeadSource(
  id: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (user.role !== "admin" && user.role !== "manager") {
      return { ok: false, error: "Only admins and managers can delete lead sources" };
    }

    const supabase = createSupabaseServiceClient();

    const { error } = await supabase
      .from("lead_sources")
      .delete()
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads/inflow");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ============================================================
// CUSTOM FIELD DEFINITIONS — CRUD
// ============================================================
//
// ARCHITECTURE:
//   Custom fields are defined in `custom_field_defs` (metadata) and
//   stored as key-value pairs in `leads.custom` JSONB column.
//
//   When a field definition is "deleted", we set is_active = false
//   (soft delete). The data in leads.custom[key] is PRESERVED.
//   If the field is re-created with the same key, old data reappears.
//
//   Hard deletion is intentionally NOT exposed as a server action.
//   To purge data, an admin can call the DB function
//   `deactivate_custom_field(id, purge_data := true)`.
//
// FIELD TYPES:
//   text, textarea, number, money, select, multiselect, date, checkbox, phone, url
//
// OPTIONS:
//   For select/multiselect types, `options` is a JSON array:
//   [{ "value": "tourist", "label": "Tourist" }, ...]

const fieldDefSchema = z.object({
  entity: z.string().optional().default("lead"),
  key: z.string().min(1, "Field key is required").regex(/^[a-z0-9_]+$/, "Key must be lowercase snake_case"),
  label: z.string().min(1, "Label is required"),
  type: z.enum(["text", "textarea", "number", "money", "select", "multiselect", "date", "checkbox", "phone", "url"]),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional().nullable(),
  required: z.boolean().optional().default(false),
  show_on_card: z.boolean().optional().default(false),
  show_in_list: z.boolean().optional().default(false),
  group_name: z.string().optional().nullable(),
  sort: z.number().optional().default(0),
});

export async function createCustomFieldDef(
  input: z.infer<typeof fieldDefSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (user.role !== "admin" && user.role !== "manager") {
      return { ok: false, error: "Only admins and managers can configure custom fields" };
    }

    const parsed = fieldDefSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = createSupabaseServiceClient();

    const { data, error } = await supabase
      .from("custom_field_defs")
      .insert({
        entity: parsed.data.entity,
        key: parsed.data.key,
        label: parsed.data.label,
        type: parsed.data.type,
        options: parsed.data.options ?? null,
        required: parsed.data.required,
        show_on_card: parsed.data.show_on_card,
        show_in_list: parsed.data.show_in_list,
        group_name: parsed.data.group_name ?? null,
        sort: parsed.data.sort,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) {
      // Handle duplicate key gracefully
      if (error.code === "23505") {
        return { ok: false, error: `A field with key "${parsed.data.key}" already exists. Use a different key or re-activate the deactivated field.` };
      }
      return { ok: false, error: error.message };
    }

    revalidatePath("/leads/inflow");
    revalidatePath("/leads");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateCustomFieldDef(
  id: string,
  input: Partial<z.infer<typeof fieldDefSchema>>
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (user.role !== "admin" && user.role !== "manager") {
      return { ok: false, error: "Only admins and managers can configure custom fields" };
    }

    const supabase = createSupabaseServiceClient();

    // Build update object from provided fields only
    const updateData: Record<string, unknown> = {};
    if (input.label !== undefined) updateData.label = input.label;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.options !== undefined) updateData.options = input.options ?? null;
    if (input.required !== undefined) updateData.required = input.required;
    if (input.show_on_card !== undefined) updateData.show_on_card = input.show_on_card;
    if (input.show_in_list !== undefined) updateData.show_in_list = input.show_in_list;
    if (input.group_name !== undefined) updateData.group_name = input.group_name;
    if (input.sort !== undefined) updateData.sort = input.sort;
    // Key changes are NOT allowed after creation to prevent data orphaning
    // (changing the key would disconnect the definition from existing leads.custom data)

    if (Object.keys(updateData).length === 0) {
      return { ok: false, error: "No fields to update" };
    }

    const { error } = await supabase
      .from("custom_field_defs")
      .update(updateData)
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads/inflow");
    revalidatePath("/leads");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// Soft-delete: sets is_active = false, preserves data in leads.custom
export async function deleteCustomFieldDef(
  id: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (user.role !== "admin" && user.role !== "manager") {
      return { ok: false, error: "Only admins and managers can delete custom fields" };
    }

    const supabase = createSupabaseServiceClient();

    // Soft delete: set is_active = false, record deleted_at
    // Data in leads.custom[key] is PRESERVED — not removed.
    // If the field is re-activated later, old data becomes visible again.
    const { error } = await supabase
      .from("custom_field_defs")
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads/inflow");
    revalidatePath("/leads");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// Re-activate a previously deactivated field definition
export async function reactivateCustomFieldDef(
  id: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (user.role !== "admin" && user.role !== "manager") {
      return { ok: false, error: "Only admins and managers can configure custom fields" };
    }

    const supabase = createSupabaseServiceClient();

    const { error } = await supabase
      .from("custom_field_defs")
      .update({ is_active: true, deleted_at: null })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads/inflow");
    revalidatePath("/leads");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ============================================================
// LEAD SOURCE FIELD MAPPING — update mapping config
// ============================================================
//
// The field_mapping column on lead_sources defines how incoming
// raw data from a source (web form, API, etc.) maps to lead fields.
//
// Format: { "raw_field_name": "lead_field_key", ... }
// For custom fields, prefix with "custom.": "custom.visa_status"
//
// Example: {
//   "full_name": "name",
//   "phone_number": "phone",
//   "email_address": "email",
//   "visa_type": "custom.visa_status"
// }
//
// If field_mapping is empty {}, the system assumes raw field names
// already match lead field keys (identity mapping).

export async function updateLeadSourceMapping(
  sourceId: string,
  mapping: Record<string, string>
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (user.role !== "admin" && user.role !== "manager") {
      return { ok: false, error: "Only admins and managers can configure field mappings" };
    }

    const supabase = createSupabaseServiceClient();

    const { error } = await supabase
      .from("lead_sources")
      .update({ field_mapping: mapping })
      .eq("id", sourceId);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads/inflow");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
