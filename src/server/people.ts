"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isWorkingCustomerStatus } from "@/lib/customer-status";
import type { CrmDb } from "@/server/routing";

type LeadRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  notes: string | null;
  tags: string[] | null;
  assigned_to: string | null;
  customer_id: string | null;
  converted_customer_id: string | null;
  created_by: string | null;
  status: string;
};

async function loadLead(supabase: CrmDb, leadId: string) {
  const { data } = await supabase
    .from("leads")
    .select(
      "id, name, phone, email, nationality, notes, tags, assigned_to, customer_id, converted_customer_id, created_by, status"
    )
    .eq("id", leadId)
    .maybeSingle();
  return data as LeadRow | null;
}

/**
 * Every live lead has a customer row from first contact.
 * Matches existing people by phone/email before inserting.
 */
export async function ensurePersonForLead(
  leadId: string,
  actorId?: string | null,
  client?: CrmDb
): Promise<string | null> {
  const supabase = client ?? (await createSupabaseServerClient());
  const lead = await loadLead(supabase, leadId);
  if (!lead) return null;

  if (lead.customer_id) {
    await syncWorkingPerson(supabase, lead);
    return lead.customer_id;
  }

  if (lead.converted_customer_id) {
    await supabase
      .from("leads")
      .update({ customer_id: lead.converted_customer_id, updated_at: new Date().toISOString() })
      .eq("id", leadId);
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

  if (!personId && lead.phone) {
    const { data } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", lead.phone)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    personId = data?.id ?? null;
  }

  if (!personId && lead.email) {
    const { data } = await supabase
      .from("customers")
      .select("id")
      .eq("email", lead.email)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    personId = data?.id ?? null;
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

async function syncWorkingPerson(supabase: CrmDb, lead: LeadRow) {
  if (!lead.customer_id) return;
  const { data: person } = await supabase
    .from("customers")
    .select("id, status")
    .eq("id", lead.customer_id)
    .maybeSingle();
  if (!person || !isWorkingCustomerStatus(person.status)) return;

  await supabase
    .from("customers")
    .update({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      nationality: lead.nationality,
      notes: lead.notes,
      tags: lead.tags ?? [],
      assigned_to: lead.assigned_to,
      lead_id: lead.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", lead.customer_id);
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
