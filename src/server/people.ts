"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isWorkingCustomerStatus } from "@/lib/customer-status";
import { isExistingOwnerPerson } from "@/lib/lead-owner";
import { normalizePhoneDigits, phonesLikelyMatch } from "@/lib/phone";
import type { CrmDb } from "@/server/routing";

type LeadRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  call_numbers: string[] | null;
  nationality: string | null;
  notes: string | null;
  tags: string[] | null;
  assigned_to: string | null;
  customer_id: string | null;
  converted_customer_id: string | null;
  created_by: string | null;
  created_at: string;
  status: string;
};

export type CustomerContactMatchField = "whatsapp" | "call_number" | "email";

export type CustomerContactMatchReason = {
  field: CustomerContactMatchField;
  leadValue: string;
  ownerValue: string;
};

type CustomerContactRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  nationality: string | null;
};

const CUSTOMER_CONTACT_SELECT = "id, name, phone, email, status, nationality";

/** Exact + normalized phone / case-insensitive email match against customers. */
export async function findCustomerByContact(
  supabase: CrmDb,
  input: {
    phone?: string | null;
    email?: string | null;
    callNumbers?: string[] | null;
  }
): Promise<{ customer: CustomerContactRow; reasons: CustomerContactMatchReason[] } | null> {
  const whatsapp = input.phone?.trim() || null;
  const email = input.email?.trim() || null;
  const callNumbers = (input.callNumbers ?? []).map((n) => n.trim()).filter(Boolean);
  const phoneInputs = [whatsapp, ...callNumbers].filter(Boolean) as string[];

  const byId = new Map<string, CustomerContactRow>();

  for (const p of phoneInputs) {
    const { data: exact } = await supabase
      .from("customers")
      .select(CUSTOMER_CONTACT_SELECT)
      .eq("phone", p)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    if (exact) byId.set(exact.id, exact as CustomerContactRow);

    const digits = normalizePhoneDigits(p);
    const suffix = digits.length >= 9 ? digits.slice(-9) : "";
    if (suffix) {
      const { data: fuzzy } = await supabase
        .from("customers")
        .select(CUSTOMER_CONTACT_SELECT)
        .ilike("phone", `%${suffix}`)
        .is("deleted_at", null)
        .limit(15);
      for (const row of fuzzy ?? []) {
        if (phonesLikelyMatch(p, row.phone)) {
          byId.set(row.id, row as CustomerContactRow);
        }
      }
    }
  }

  if (email) {
    const { data: byEmail } = await supabase
      .from("customers")
      .select(CUSTOMER_CONTACT_SELECT)
      .ilike("email", email)
      .is("deleted_at", null)
      .limit(5);
    for (const row of byEmail ?? []) {
      byId.set(row.id, row as CustomerContactRow);
    }
  }

  if (byId.size === 0) return null;

  let best: { customer: CustomerContactRow; reasons: CustomerContactMatchReason[] } | null = null;

  for (const customer of byId.values()) {
    const reasons: CustomerContactMatchReason[] = [];
    if (whatsapp && phonesLikelyMatch(whatsapp, customer.phone)) {
      reasons.push({
        field: "whatsapp",
        leadValue: whatsapp,
        ownerValue: customer.phone ?? whatsapp,
      });
    }
    for (const call of callNumbers) {
      if (phonesLikelyMatch(call, customer.phone)) {
        reasons.push({
          field: "call_number",
          leadValue: call,
          ownerValue: customer.phone ?? call,
        });
      }
    }
    if (email && customer.email && email.toLowerCase() === customer.email.toLowerCase()) {
      reasons.push({
        field: "email",
        leadValue: email,
        ownerValue: customer.email,
      });
    }
    if (reasons.length === 0) continue;
    if (!best || reasons.length > best.reasons.length) {
      best = { customer, reasons };
    }
  }

  return best;
}

async function loadLead(supabase: CrmDb, leadId: string) {
  const { data } = await supabase
    .from("leads")
    .select(
      "id, name, phone, email, call_numbers, nationality, notes, tags, assigned_to, customer_id, converted_customer_id, created_by, created_at, status"
    )
    .eq("id", leadId)
    .maybeSingle();
  return data as LeadRow | null;
}

/** Prefer fill-only identity sync when this lead sits under an already existing customer. */
async function resolvePersonSyncMode(
  supabase: CrmDb,
  lead: LeadRow,
  requested: "overwrite" | "fill"
): Promise<"overwrite" | "fill"> {
  if (requested === "fill" || !lead.customer_id) return requested === "fill" ? "fill" : "overwrite";

  const [{ count: siblingCount }, { data: person }] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", lead.customer_id)
      .neq("id", lead.id)
      .is("deleted_at", null),
    supabase.from("customers").select("created_at").eq("id", lead.customer_id).maybeSingle(),
  ]);

  if (
    isExistingOwnerPerson({
      leadCreatedAt: lead.created_at,
      personCreatedAt: person?.created_at,
      siblingLeadCount: siblingCount ?? 0,
    })
  ) {
    return "fill";
  }
  return "overwrite";
}

/**
 * Keep lead contact snapshots aligned with the person SoT
 * (name / WhatsApp / email / nationality). Call numbers stay lead-only.
 */
export async function mirrorPersonIdentityToLeads(
  supabase: CrmDb,
  customerId: string,
  patch: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    nationality?: string | null;
  }
) {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined && patch.name?.trim()) update.name = patch.name.trim();
  if (patch.phone !== undefined) update.phone = patch.phone;
  if (patch.email !== undefined) update.email = patch.email;
  if (patch.nationality !== undefined) update.nationality = patch.nationality;

  if (Object.keys(update).length <= 1) return;

  await supabase.from("leads").update(update).eq("customer_id", customerId).is("deleted_at", null);
}

/**
 * Every live lead has a customer row from first contact.
 * Matches existing people by phone/email before inserting.
 * @param linkMode - when attaching to an existing owner, only fill blank owner fields
 */
export async function ensurePersonForLead(
  leadId: string,
  actorId?: string | null,
  client?: CrmDb,
  linkMode: "overwrite" | "fill" = "overwrite"
): Promise<string | null> {
  const supabase = client ?? (await createSupabaseServerClient());
  const lead = await loadLead(supabase, leadId);
  if (!lead) return null;

  if (lead.customer_id) {
    const mode = await resolvePersonSyncMode(supabase, lead, linkMode);
    await syncWorkingPerson(supabase, lead, mode);
    return lead.customer_id;
  }

  if (lead.converted_customer_id) {
    await supabase
      .from("leads")
      .update({ customer_id: lead.converted_customer_id, updated_at: new Date().toISOString() })
      .eq("id", leadId);
    await syncWorkingPerson(
      supabase,
      { ...lead, customer_id: lead.converted_customer_id },
      "fill"
    );
    return lead.converted_customer_id;
  }

  const { data: byLead } = await supabase
    .from("customers")
    .select("id")
    .eq("lead_id", leadId)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  let personId = byLead?.id ?? null;

  if (!personId) {
    const matched = await findCustomerByContact(supabase, {
      phone: lead.phone,
      email: lead.email,
      callNumbers: lead.call_numbers,
    });
    personId = matched?.customer.id ?? null;
  }

  if (!personId) {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        type: "individual",
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        nationality: lead.nationality,
        notes: lead.notes,
        tags: lead.tags ?? [],
        assigned_to: lead.assigned_to,
        lead_id: leadId,
        status: "lead",
        created_by: actorId ?? lead.created_by,
      })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[people] create person:", error?.message);
      return null;
    }
    personId = data.id;
  } else {
    await supabase
      .from("customers")
      .update({
        lead_id: leadId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", personId)
      .is("lead_id", null);
  }

  await supabase
    .from("leads")
    .update({ customer_id: personId, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  return personId;
}

async function syncWorkingPerson(
  supabase: CrmDb,
  lead: LeadRow,
  mode: "overwrite" | "fill" = "overwrite"
) {
  if (!lead.customer_id) return;
  const { data: person } = await supabase
    .from("customers")
    .select("id, status, name, phone, email, nationality, notes, tags, assigned_to")
    .eq("id", lead.customer_id)
    .maybeSingle();
  if (!person || !isWorkingCustomerStatus(person.status)) return;

  const update: Record<string, unknown> = {
    lead_id: lead.id,
    updated_at: new Date().toISOString(),
  };

  if (mode === "fill") {
    // Linking a new lead under an existing owner — never wipe established KYC/contact.
    if (!person.phone?.trim() && lead.phone?.trim()) update.phone = lead.phone.trim();
    if (!person.email?.trim() && lead.email?.trim()) update.email = lead.email.trim();
    if (!person.nationality?.trim() && lead.nationality?.trim()) update.nationality = lead.nationality.trim();
    if (!person.notes?.trim() && lead.notes?.trim()) update.notes = lead.notes.trim();
    if ((!person.tags || person.tags.length === 0) && lead.tags?.length) update.tags = lead.tags;
    if (!person.assigned_to && lead.assigned_to) update.assigned_to = lead.assigned_to;
  } else {
    // Primary working lead still drives contact name/assignment, but never null-wipe
    // or clobber established owner nationality (KYC lives on the customer).
    if (lead.name?.trim()) update.name = lead.name.trim();
    if (lead.phone?.trim()) update.phone = lead.phone.trim();
    if (lead.email?.trim()) update.email = lead.email.trim();
    if (!person.nationality?.trim() && lead.nationality?.trim()) {
      update.nationality = lead.nationality.trim();
    }
    if (lead.notes !== null && lead.notes !== undefined) update.notes = lead.notes;
    if (lead.tags) update.tags = lead.tags;
    if (lead.assigned_to !== undefined) update.assigned_to = lead.assigned_to;
  }

  if (Object.keys(update).length <= 2) {
    await supabase
      .from("customers")
      .update({ lead_id: lead.id, updated_at: new Date().toISOString() })
      .eq("id", lead.customer_id);
    return;
  }

  await supabase.from("customers").update(update).eq("id", lead.customer_id);
}

export async function markPersonQualified(customerId: string | null, client?: CrmDb) {
  if (!customerId) return;
  const supabase = client ?? (await createSupabaseServerClient());
  const { data } = await supabase.from("customers").select("status").eq("id", customerId).maybeSingle();
  if (!data || data.status === "active" || data.status === "inactive") return;
  await supabase
    .from("customers")
    .update({ status: "qualified", updated_at: new Date().toISOString() })
    .eq("id", customerId);
}

export async function markPersonLost(customerId: string | null, client?: CrmDb) {
  if (!customerId) return;
  const supabase = client ?? (await createSupabaseServerClient());
  const { data } = await supabase.from("customers").select("status").eq("id", customerId).maybeSingle();
  if (!data || !isWorkingCustomerStatus(data.status)) return;
  await supabase
    .from("customers")
    .update({ status: "lost", updated_at: new Date().toISOString() })
    .eq("id", customerId);
}

export async function syncPersonKycFromDeal(
  customerId: string | null,
  patch: {
    kyc_nationality?: string | null;
    kyc_emirates_id?: string | null;
    kyc_passport_no?: string | null;
    kyc_trn?: string | null;
    buyer_name?: string | null;
    buyer_phone?: string | null;
    buyer_email?: string | null;
  },
  client?: CrmDb
) {
  if (!customerId) return;
  const supabase = client ?? (await createSupabaseServerClient());
  const { data: person } = await supabase
    .from("customers")
    .select("id, status")
    .eq("id", customerId)
    .maybeSingle();
  if (!person || !isWorkingCustomerStatus(person.status)) return;

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.kyc_nationality !== undefined) update.nationality = patch.kyc_nationality;
  if (patch.kyc_emirates_id !== undefined) update.emirates_id = patch.kyc_emirates_id;
  if (patch.kyc_passport_no !== undefined) update.passport_no = patch.kyc_passport_no;
  if (patch.kyc_trn !== undefined) update.trn = patch.kyc_trn;
  if (patch.buyer_name !== undefined && patch.buyer_name?.trim()) update.name = patch.buyer_name.trim();
  if (patch.buyer_phone !== undefined) update.phone = patch.buyer_phone;
  if (patch.buyer_email !== undefined) update.email = patch.buyer_email;

  if (Object.keys(update).length <= 1) return;
  await supabase.from("customers").update(update).eq("id", customerId);
}

export async function syncPersonAssignment(
  leadId: string,
  assignedTo: string | null,
  client?: CrmDb
) {
  const supabase = client ?? (await createSupabaseServerClient());
  const { data: lead } = await supabase
    .from("leads")
    .select("customer_id")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead?.customer_id) return;
  const { data: person } = await supabase
    .from("customers")
    .select("status")
    .eq("id", lead.customer_id)
    .maybeSingle();
  if (!person || !isWorkingCustomerStatus(person.status)) return;
  await supabase
    .from("customers")
    .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
    .eq("id", lead.customer_id);
}
