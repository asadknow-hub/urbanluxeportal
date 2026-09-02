"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { applyLeadRouting, teamIdForUser } from "@/server/routing";
import { revalidatePath } from "next/cache";
import {
  LEAD_IMPORT_FIELDS,
  matchNamedValue,
  matchOptionValue,
  splitImportList,
  type LeadImportMappedRow,
} from "@/lib/lead-import";
import { groupLeadFieldOptions, scoreFromBand, type LeadFieldOption } from "@/lib/lead-field-options";
import {
  buildLeadContext,
  dealTypeFromInterest,
  suggestedPropertyTitle,
} from "@/lib/lead-flow";
import type { DealTransactionInput } from "@/lib/deal-transaction";
import { canManageCrm } from "@/lib/permissions";
import { leadStatusForStageKind, resolveDefaultLeadStageId } from "@/lib/lead-stages";
import { HUMAN_LEAD_ACTIVITY_TYPES } from "@/lib/lead-sla";
import { ensurePersonForLead, markPersonLost, markPersonQualified, syncPersonAssignment } from "@/server/people";

export type ConvertLeadInput = DealTransactionInput & {
  dealTitle?: string;
};

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const leadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  source: z.string().min(1, "Source is required"),
  interest: z.string().min(1, "Interest is required"),
  budget_min: z.number().optional().nullable(),
  budget_max: z.number().optional().nullable(),
  preferred_areas: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
  assigned_to: z.string().min(1).optional().nullable(),
  next_follow_up_at: z.string().optional().nullable(),
  stage_id: z.string().min(1).optional().nullable(),
  nationality: z.string().optional().nullable(),
  financing: z.string().optional().nullable(),
  timeframe: z.string().optional().nullable(),
  purpose: z.string().optional().nullable(),
  bedrooms: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  score: z.number().min(0).max(100).optional().nullable(),
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

    let stageId = parsed.data.stage_id;
    if (!stageId) {
      stageId = await resolveDefaultLeadStageId(supabase);
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
        team_id: user.team_id,
        stage_id: stageId,
        status: "new",
        nationality: parsed.data.nationality || null,
        financing: parsed.data.financing || null,
        timeframe: parsed.data.timeframe || null,
        purpose: parsed.data.purpose || null,
        bedrooms: parsed.data.bedrooms || null,
        category: parsed.data.category || null,
        tags: parsed.data.tags ?? [],
        score: parsed.data.score ?? null,
        last_activity_at: new Date().toISOString(),
        stage_entered_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    await applyLeadRouting(supabase, data.id, parsed.data.assigned_to, "created", user.team_id, parsed.data.source);
    await ensurePersonForLead(data.id, user.id, supabase);

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

    const supabase = await createSupabaseServerClient();

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
      let viewingCount = 0;
      const needsViewing = requiredFields.includes("viewing_scheduled") || requiredFields.includes("activity_logged");
      if (needsViewing) {
        const { count } = await supabase
          .from("lead_viewings")
          .select("id", { count: "exact", head: true })
          .eq("lead_id", leadId)
          .in("status", ["scheduled", "completed"]);
        viewingCount = count ?? 0;
      }
      let activityCount = 0;
      if (requiredFields.includes("activity_logged")) {
        const { count } = await supabase
          .from("lead_activities")
          .select("id", { count: "exact", head: true })
          .eq("lead_id", leadId)
          .in("type", [...HUMAN_LEAD_ACTIVITY_TYPES]);
        activityCount = count ?? 0;
      }
      for (const field of requiredFields) {
        if (field === "viewing_scheduled") {
          if (viewingCount < 1) missing.push("Viewing scheduled");
        } else if (field === "activity_logged") {
          if (activityCount < 1 && viewingCount < 1) missing.push("Activity logged");
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

    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      stage_id: stageId,
      updated_at: now,
      last_activity_at: now,
    };
    if (lead.stage_id !== stageId) {
      updateData.stage_entered_at = now;
    }

    // Map stage kind to legacy status for backward compat
    // Only use stage.kind (dynamic, DB-driven) — never match on stage names
    if (stage.kind === "won") updateData.status = "converted";
    else if (stage.kind === "lost" || stage.kind === "junk") updateData.status = "unqualified";
    else if (stage.kind === "open") {
      updateData.status = leadStatusForStageKind(stage.kind, stage.sort);
    }

    if (extra?.lost_reason) updateData.lost_reason = extra.lost_reason;
    if (extra?.junk_reason) updateData.junk_reason = extra.junk_reason;

    const { error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", leadId);

    if (error) return { ok: false, error: error.message };

    if (stage.kind === "lost" || stage.kind === "junk") {
      const personId = lead.customer_id ?? (await ensurePersonForLead(leadId, user.id, supabase));
      await markPersonLost(personId, supabase);
    }

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

    const supabase = await createSupabaseServerClient();

    // Conditional update: only claim if still unassigned
    const { data, error } = await supabase
      .from("leads")
      .update({
        assigned_to: user.id,
        team_id: user.team_id,
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

    await ensurePersonForLead(leadId, user.id, supabase);
    await syncPersonAssignment(leadId, user.id, supabase);

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

const leadUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  source: z.string().min(1).optional(),
  interest: z.string().min(1).optional(),
  budget_min: z.number().nullable().optional(),
  budget_max: z.number().nullable().optional(),
  preferred_areas: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  assigned_to: z.string().nullable().optional(),
  next_follow_up_at: z.string().nullable().optional(),
  stage_id: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  financing: z.string().nullable().optional(),
  timeframe: z.string().nullable().optional(),
  purpose: z.string().nullable().optional(),
  bedrooms: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  score: z.number().int().min(0).max(100).nullable().optional(),
});

function fieldLabel(key: string) {
  return key.replace(/_/g, " ");
}

export async function updateLead(
  id: string,
  input: z.infer<typeof leadUpdateSchema>
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const parsed = leadUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value === undefined) continue;
      if (key === "email" && value === "") {
        patch.email = null;
        continue;
      }
      patch[key] = value;
    }
    if (Object.keys(patch).length === 0) return { ok: true };

    const now = new Date().toISOString();
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("leads")
      .update({
        ...patch,
        updated_at: now,
        last_activity_at: now,
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await ensurePersonForLead(id, user.id, supabase);

    const changed = Object.keys(patch).join(", ");
    await supabase.from("lead_activities").insert({
      lead_id: id,
      type: "field_update",
      summary: `Updated ${fieldLabel(changed)}`,
      created_by: user.id,
    });

    await logActivity({
      actorId: user.id,
      entityType: "lead",
      entityId: id,
      action: "updated",
      diff: patch,
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function convertLead(
  leadId: string,
  options: ConvertLeadInput = {}
): Promise<ActionResult<{ customerId: string | null; dealId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();
    if (leadError || !lead) return { ok: false, error: "Lead not found" };

    const personId = await ensurePersonForLead(leadId, user.id, supabase);

    let personKyc: {
      nationality: string | null;
      emirates_id: string | null;
      passport_no: string | null;
      trn: string | null;
    } | null = null;
    if (personId) {
      const { data: person } = await supabase
        .from("customers")
        .select("nationality, emirates_id, passport_no, trn")
        .eq("id", personId)
        .maybeSingle();
      personKyc = person;
    }

    if (lead.converted_deal_id) {
      const { data: existingDeal } = await supabase
        .from("deals")
        .select("id, customer_id")
        .eq("id", lead.converted_deal_id)
        .maybeSingle();
      return {
        ok: true,
        data: {
          customerId: existingDeal?.customer_id ?? lead.converted_customer_id,
          dealId: lead.converted_deal_id,
        },
      };
    }
    if (lead.status === "converted") return { ok: false, error: "Lead already converted" };

    const leadContext = buildLeadContext(lead);
    const propertyTitle =
      options.property_title?.trim() ||
      suggestedPropertyTitle(lead) ||
      null;
    const title = options.dealTitle?.trim() || propertyTitle || lead.name;
    const valueFils = lead.budget_max ?? lead.budget_min ?? 0;
    const propertyCommunity =
      options.property_community?.trim() || lead.preferred_areas?.[0] || null;

    const propertySnapshot = {
      bedrooms: lead.bedrooms ?? null,
      category: lead.category ?? null,
      purpose: lead.purpose ?? null,
      timeframe: lead.timeframe ?? null,
      preferred_areas: lead.preferred_areas ?? null,
      notes: lead.notes ?? null,
    };

    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .insert({
        title,
        customer_id: personId,
        deal_type: dealTypeFromInterest(lead.interest),
        stage: "new",
        value: valueFils,
        assigned_to: lead.assigned_to,
        created_by: user.id,
        lead_id: leadId,
        lead_context: leadContext,
        buyer_name: options.buyer_name?.trim() || lead.name,
        buyer_phone: options.buyer_phone?.trim() || lead.phone,
        buyer_email: options.buyer_email?.trim() || lead.email,
        kyc_nationality: options.kyc_nationality?.trim() || personKyc?.nationality || lead.nationality,
        kyc_emirates_id: options.kyc_emirates_id?.trim() || personKyc?.emirates_id || null,
        kyc_passport_no: options.kyc_passport_no?.trim() || personKyc?.passport_no || null,
        kyc_trn: options.kyc_trn?.trim() || personKyc?.trn || null,
        property_title: propertyTitle,
        property_community: propertyCommunity,
        property_building: options.property_building?.trim() || null,
        property_unit: options.property_unit?.trim() || null,
        property_ref: options.property_ref?.trim() || null,
        property_snapshot: propertySnapshot,
      })
      .select("id")
      .single();
    if (dealError) return { ok: false, error: dealError.message };

    const { data: convertedStage } = await supabase
      .from("lead_stages")
      .select("id")
      .eq("kind", "won")
      .eq("is_active", true)
      .order("sort", { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        status: "converted",
        converted_deal_id: deal.id,
        stage_id: convertedStage?.id ?? lead.stage_id,
        stage_entered_at: convertedStage?.id ? now : lead.stage_entered_at,
        updated_at: now,
        last_activity_at: now,
      })
      .eq("id", leadId);
    if (updateError) return { ok: false, error: updateError.message };

    await markPersonQualified(personId, supabase);

    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      type: "converted",
      summary: `Lead converted to pipeline deal: ${title}. Person record already exists and is now qualified.`,
      created_by: user.id,
    });

    await supabase.from("deal_activities").insert({
      deal_id: deal.id,
      type: "created",
      summary: `Deal opened from lead: ${lead.name}.`,
      created_by: user.id,
    });

    await logActivity({
      actorId: user.id,
      entityType: "lead",
      entityId: leadId,
      action: "converted",
      diff: { dealId: deal.id },
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/customers");
    revalidatePath("/pipeline");
    revalidatePath("/deals");
    revalidatePath(`/pipeline/${deal.id}`);
    return { ok: true, data: { customerId: personId, dealId: deal.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

function parseAedToFils(raw: string) {
  const cleaned = raw.replace(/,/g, "").replace(/aed/gi, "").trim();
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

function budgetFromCell(raw: string, options: LeadFieldOption[] | undefined) {
  const matched = options?.find((option) => {
    const needle = raw.trim().toLowerCase();
    return option.value.toLowerCase() === needle || option.label.toLowerCase() === needle;
  });
  if (matched) {
    const extra = matched.extra ?? {};
    const min = Number(extra.min_fils);
    const max = Number(extra.max_fils);
    return {
      min: Number.isFinite(min) ? min : null,
      max: Number.isFinite(max) ? max : null,
    };
  }
  const fils = parseAedToFils(raw);
  return { min: fils, max: fils };
}

function scoreFromCell(raw: string, options: LeadFieldOption[] | undefined) {
  const asNumber = Number(raw.replace(/,/g, "").trim());
  if (Number.isFinite(asNumber) && asNumber >= 0 && asNumber <= 100) {
    return Math.round(asNumber);
  }
  const needle = raw.trim().toLowerCase();
  const band = options?.find(
    (option) => option.value.toLowerCase() === needle || option.label.toLowerCase() === needle
  );
  return band ? scoreFromBand(band) : null;
}

export async function importLeads(
  rows: LeadImportMappedRow[]
): Promise<ActionResult<{ created: number; skipped: number; failed: number; errors: string[] }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManageCrm(user.role)) return { ok: false, error: "Not authorized" };
    if (!Array.isArray(rows) || rows.length === 0) {
      return { ok: false, error: "No rows to import" };
    }

    const incoming = rows.slice(0, 500);
    const supabase = await createSupabaseServerClient();
    const [{ data: optionRows }, { data: areaRows }, { data: nationalityRows }, defaultStageId] = await Promise.all([
      supabase.from("lead_field_options").select("id, field_key, value, label, sort, extra"),
      supabase.from("lead_areas").select("name"),
      supabase.from("lead_nationalities").select("name"),
      resolveDefaultLeadStageId(supabase),
    ]);

    const fieldOptions = groupLeadFieldOptions((optionRows ?? []) as LeadFieldOption[]);
    const areaNames = (areaRows ?? []).map((row) => row.name);
    const nationalityNames = (nationalityRows ?? []).map((row) => row.name);
    const allowedKeys = new Set(LEAD_IMPORT_FIELDS.map((field) => field.key));

    let created = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const [index, raw] of incoming.entries()) {
      const row: LeadImportMappedRow = {};
      for (const [key, value] of Object.entries(raw)) {
        if (!allowedKeys.has(key) || typeof value !== "string") continue;
        const trimmed = value.trim();
        if (trimmed) row[key as keyof LeadImportMappedRow] = trimmed;
      }

      const name = row.name?.trim();
      if (!name) {
        skipped += 1;
        continue;
      }

      const phone = row.phone || null;
      const emailRaw = row.email || "";
      const email = emailRaw || null;
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        failed += 1;
        if (errors.length < 8) errors.push(`Row ${index + 2}: invalid email for ${name}`);
        continue;
      }

      if (phone || email) {
        let dupQuery = supabase.from("leads").select("id").is("deleted_at", null).limit(1);
        if (phone) dupQuery = dupQuery.eq("phone", phone);
        else if (email) dupQuery = dupQuery.eq("email", email);
        const { data: dup } = await dupQuery.maybeSingle();
        if (dup) {
          skipped += 1;
          continue;
        }
      }

      const budget = row.budget ? budgetFromCell(row.budget, fieldOptions.budget) : { min: null, max: null };
      const tags = row.tags ? splitImportList(row.tags).map((tag) => matchOptionValue(fieldOptions.tags, tag)) : [];
      const preferredAreas = row.preferred_areas
        ? splitImportList(row.preferred_areas).map((area) => matchNamedValue(areaNames, area))
        : [];

      const source = row.source ? matchOptionValue(fieldOptions.source, row.source) : "import";

      const { data, error } = await supabase
        .from("leads")
        .insert({
          name,
          phone,
          email,
          nationality: row.nationality ? matchNamedValue(nationalityNames, row.nationality) : null,
          source,
          interest: row.interest ? matchOptionValue(fieldOptions.interest, row.interest) : "buy",
          category: row.category ? matchOptionValue(fieldOptions.category, row.category) : null,
          bedrooms: row.bedrooms ? matchOptionValue(fieldOptions.bedrooms, row.bedrooms) : null,
          purpose: row.purpose ? matchOptionValue(fieldOptions.purpose, row.purpose) : null,
          financing: row.financing ? matchOptionValue(fieldOptions.financing, row.financing) : null,
          timeframe: row.timeframe ? matchOptionValue(fieldOptions.timeframe, row.timeframe) : null,
          budget_min: budget.min,
          budget_max: budget.max,
          preferred_areas: preferredAreas,
          tags,
          notes: row.notes || null,
          score: row.score ? scoreFromCell(row.score, fieldOptions.score) : null,
          lost_reason: row.lost_reason ? matchOptionValue(fieldOptions.lost_reason, row.lost_reason) : null,
          junk_reason: row.junk_reason ? matchOptionValue(fieldOptions.junk_reason, row.junk_reason) : null,
          created_by: user.id,
          team_id: user.team_id,
          stage_id: defaultStageId,
          status: "new",
          last_activity_at: new Date().toISOString(),
          stage_entered_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error || !data) {
        failed += 1;
        if (errors.length < 8) errors.push(`${name}: ${error?.message ?? "insert failed"}`);
        continue;
      }

      await applyLeadRouting(supabase, data.id, null, "import", user.team_id, source);
      await ensurePersonForLead(data.id, user.id, supabase);
      created += 1;
    }

    await logActivity({
      actorId: user.id,
      entityType: "lead",
      entityId: user.id,
      action: "imported",
      diff: { created, skipped, failed },
    });

    revalidatePath("/leads");
    revalidatePath("/settings/leads");
    return { ok: true, data: { created, skipped, failed, errors } };
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

    const now = new Date().toISOString();
    const { error: leadError } = await supabase
      .from("leads")
      .update({
        last_activity_at: now,
        updated_at: now,
      })
      .eq("id", leadId);

    if (leadError) return { ok: false, error: leadError.message };

    const { error } = await supabase.from("lead_activities").insert({
      lead_id: leadId,
      type,
      summary,
      created_by: user.id,
    });

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
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
    if (!canManageCrm(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const supabase = await createSupabaseServerClient();

    const { data: before } = await supabase
      .from("leads")
      .select("assigned_to")
      .eq("id", leadId)
      .maybeSingle();

    const patch: { assigned_to: string | null; updated_at: string; team_id?: string | null } = {
      assigned_to: agentId,
      updated_at: new Date().toISOString(),
    };
    if (agentId) patch.team_id = await teamIdForUser(supabase, agentId);

    const { error } = await supabase
      .from("leads")
      .update(patch)
      .eq("id", leadId);

    if (error) return { ok: false, error: error.message };

    await ensurePersonForLead(leadId, user.id, supabase);
    await syncPersonAssignment(leadId, agentId, supabase);

    await supabase.from("lead_assignments").insert({
      lead_id: leadId,
      from_user: before?.assigned_to ?? null,
      to_user: agentId,
      reason: "manual",
    });

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
    if (!canManageCrm(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const supabase = await createSupabaseServerClient();

    const { data: beforeRows } = await supabase
      .from("leads")
      .select("id, assigned_to")
      .in("id", leadIds)
      .is("deleted_at", null);

    const patch: { assigned_to: string | null; updated_at: string; team_id?: string | null } = {
      assigned_to: agentId,
      updated_at: new Date().toISOString(),
    };
    if (agentId) patch.team_id = await teamIdForUser(supabase, agentId);

    const { data, error } = await supabase
      .from("leads")
      .update(patch)
      .in("id", leadIds)
      .is("deleted_at", null)
      .select("id");

    if (error) return { ok: false, error: error.message };

    for (const row of data ?? []) {
      await ensurePersonForLead(row.id, user.id, supabase);
      await syncPersonAssignment(row.id, agentId, supabase);
    }

    if (beforeRows?.length) {
      await supabase.from("lead_assignments").insert(
        beforeRows.map((row) => ({
          lead_id: row.id,
          from_user: row.assigned_to,
          to_user: agentId,
          reason: "bulk",
        }))
      );
    }

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
    const now = new Date().toISOString();

    await supabase
      .from("lead_follow_ups")
      .update({ status: "snoozed", updated_at: now })
      .eq("lead_id", leadId)
      .eq("status", "scheduled");

    const { error: historyError } = await supabase.from("lead_follow_ups").insert({
      lead_id: leadId,
      scheduled_at: followUpAt,
      status: "scheduled",
      notes: notes || null,
      created_by: user.id,
    });
    if (historyError) return { ok: false, error: historyError.message };

    const { error: leadError } = await supabase
      .from("leads")
      .update({
        next_follow_up_at: followUpAt,
        updated_at: now,
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
    revalidatePath("/leads/followups");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function completeFollowUp(
  leadId: string,
  note?: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();
    const now = new Date().toISOString();

    const doneUpdate: Record<string, unknown> = {
      status: "done",
      completed_at: now,
      updated_at: now,
    };
    if (note?.trim()) doneUpdate.notes = note.trim();

    await supabase
      .from("lead_follow_ups")
      .update(doneUpdate)
      .eq("lead_id", leadId)
      .eq("status", "scheduled");

    const { error: leadError } = await supabase
      .from("leads")
      .update({
        next_follow_up_at: null,
        updated_at: now,
        last_activity_at: now,
      })
      .eq("id", leadId);

    if (leadError) return { ok: false, error: leadError.message };

    const summary = note?.trim() || "Follow-up completed";
    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      type: "follow_up_done",
      summary,
      created_by: user.id,
    });

    await logActivity({
      actorId: user.id,
      entityType: "lead",
      entityId: leadId,
      action: "follow_up_completed",
      diff: note ? { note } : undefined,
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/leads/followups");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function snoozeFollowUp(
  leadId: string,
  followUpAt: string,
  note?: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();
    const now = new Date().toISOString();

    await supabase
      .from("lead_follow_ups")
      .update({ status: "snoozed", notes: note?.trim() || undefined, updated_at: now })
      .eq("lead_id", leadId)
      .eq("status", "scheduled");

    const { error: historyError } = await supabase.from("lead_follow_ups").insert({
      lead_id: leadId,
      scheduled_at: followUpAt,
      status: "scheduled",
      notes: note?.trim() || "Snoozed",
      created_by: user.id,
    });
    if (historyError) return { ok: false, error: historyError.message };

    const { error: leadError } = await supabase
      .from("leads")
      .update({
        next_follow_up_at: followUpAt,
        updated_at: now,
      })
      .eq("id", leadId);

    if (leadError) return { ok: false, error: leadError.message };

    const summary = note?.trim() || `Follow-up snoozed to ${followUpAt}`;
    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      type: "follow_up_snoozed",
      summary,
      created_by: user.id,
    });

    await logActivity({
      actorId: user.id,
      entityType: "lead",
      entityId: leadId,
      action: "follow_up_snoozed",
      diff: { next_follow_up_at: followUpAt, note },
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/leads/followups");
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

    if (!status.trim()) {
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

export async function deleteLead(leadId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManageCrm(user.role)) {
      return { ok: false, error: "Only admins and managers can delete leads" };
    }

    const supabase = await createSupabaseServerClient();

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

// ─── STAGE MANAGEMENT ─────────────────────────────────────────────

export async function createLeadStage(
  name: string,
  color: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManageCrm(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const supabase = await createSupabaseServerClient();

    // Get max sort for open stages to append
    const { data: maxSortData } = await supabase
      .from("lead_stages")
      .select("sort")
      .eq("kind", "open")
      .order("sort", { ascending: false })
      .limit(1)
      .single();

    const newSort = (maxSortData?.sort ?? 0) + 1;

    const { error } = await supabase.from("lead_stages").insert({
      name,
      color,
      kind: "open",
      sort: newSort,
      is_active: true,
      required_fields: [],
      stale_after_days: 3,
    });

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateLeadStageName(
  id: string,
  name: string,
  color?: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManageCrm(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const supabase = await createSupabaseServerClient();
    
    const { data: stage } = await supabase.from("lead_stages").select("kind").eq("id", id).single();
    const isSystem = !!stage && ["won", "lost", "junk"].includes(stage.kind);

    const patch: { name?: string; color?: string } = {};
    if (!isSystem && name.trim()) patch.name = name.trim();
    if (color) patch.color = color;
    if (Object.keys(patch).length === 0) {
      return { ok: false, error: isSystem ? "System stages can only change color" : "Nothing to update" };
    }

    const { error } = await supabase
      .from("lead_stages")
      .update(patch)
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    revalidatePath("/settings/leads");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateLeadStageSla(
  id: string,
  staleAfterDays: number | null
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManageCrm(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("lead_stages")
      .update({ stale_after_days: staleAfterDays, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    revalidatePath("/settings/leads");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteLeadStage(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManageCrm(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const supabase = await createSupabaseServerClient();
    
    // Check if it's a system stage
    const { data: stage } = await supabase.from("lead_stages").select("kind").eq("id", id).single();
    if (stage && ["won", "lost", "junk"].includes(stage.kind)) {
       return { ok: false, error: "Cannot delete system stages" };
    }

    // Check if any leads are in this stage
    const { count } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("stage_id", id)
      .is("deleted_at", null);

    if (count && count > 0) {
      return { ok: false, error: "Cannot delete stage because it contains leads." };
    }

    const { error } = await supabase
      .from("lead_stages")
      .update({ is_active: false })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
