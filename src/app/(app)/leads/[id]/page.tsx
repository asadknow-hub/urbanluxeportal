import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LeadDetail } from "@/components/leads/lead-detail";
import { groupLeadFieldOptions, type LeadFieldOption } from "@/lib/lead-field-options";
import { matchesForRequirement, INVENTORY_MATCH_SELECT } from "@/lib/match-inventory";
import { getLeadTimelinePage } from "@/server/lead-timeline";
import { ensurePersonForLead } from "@/server/people";
import { KYC_DOC_CATEGORIES } from "@/lib/kyc";
import { normalizeDocCategory } from "@/lib/document-storage";
import { docCategoryChoices } from "@/lib/lead-field-options";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function firstRel<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Fetch lead with assigned agent profile + activity author profiles in a single query
  // The activities join fetches profiles for each activity's created_by field
  // so we can display agent names instead of UUIDs in the timeline
  const { data: lead, error } = await supabase
    .from("leads")
    .select(
      `*,
      assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name, avatar_url, role),
      created_by_profile:profiles!leads_created_by_fkey(id, full_name)
      `
    )
    .eq("id", id)
    .single();

  if (error || !lead) {
    return (
      <div className="p-4">
        <p className="text-sm text-slate-500">Lead not found.</p>
      </div>
    );
  }

  const duplicateClauses: string[] = [];
  if (lead.phone) duplicateClauses.push(`phone.eq.${lead.phone}`);
  if (lead.email) duplicateClauses.push(`email.eq.${lead.email}`);

  const duplicateMatches = duplicateClauses.length > 0
    ? await supabase
        .from("leads")
        .select("id, name, phone, email, stage_id, updated_at, assigned_to")
        .is("deleted_at", null)
        .neq("id", lead.id)
        .or(duplicateClauses.join(","))
        .order("updated_at", { ascending: false })
        .limit(6)
    : { data: [], error: null };

  if (user.role === "agent" && lead.assigned_to !== user.id && lead.assigned_to !== null) {
    return (
      <div className="p-4">
        <p className="text-sm text-slate-500">You don't have access to this lead.</p>
      </div>
    );
  }

  const personId =
    lead.customer_id ||
    lead.converted_customer_id ||
    (await ensurePersonForLead(id, user.id, supabase));

  // ─── Parallel data fetching ───────────────────────────────
  // All these queries are independent, so we run them in parallel
  // with Promise.all instead of sequential awaits.
  // This cuts page load time from 6× round-trip to 1× round-trip.
  const [
    { data: stages },
    { data: agents },
    { data: documents },
    { data: areaRows },
    { data: nationalityRows },
    { data: fieldOptionRows },
    { data: followUpRows },
    personResult,
    customerDocsResult,
    dealResult,
    { data: viewingRows },
    { data: inventoryRows },
    { data: assignmentRows },
    timelineResult,
  ] = await Promise.all([
    supabase
      .from("lead_stages")
      .select("*")
      .eq("is_active", true)
      .order("sort"),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["admin", "manager", "reception", "agent"])
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("documents")
      .select("*")
      .eq("entity_type", "lead")
      .eq("entity_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("lead_areas").select("name").order("name"),
    supabase.from("lead_nationalities").select("name").order("name"),
    supabase.from("lead_field_options").select("id, field_key, value, label, sort, extra").order("sort").order("label"),
    supabase
      .from("lead_follow_ups")
      .select("id, scheduled_at, completed_at, status, notes, created_at")
      .eq("lead_id", id)
      .order("scheduled_at", { ascending: false }),
    personId
      ? supabase
          .from("customers")
          .select("id, name, phone, email, status, nationality, emirates_id, passport_no, trn")
          .eq("id", personId)
          .single()
      : Promise.resolve({ data: null, error: null }),
    personId
      ? supabase
          .from("documents")
          .select("*")
          .eq("entity_type", "customer")
          .eq("entity_id", personId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    lead.converted_deal_id
      ? supabase.from("deals").select("id, title, stage, value, deal_type").eq("id", lead.converted_deal_id).single()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("lead_viewings")
      .select(
        `id, scheduled_at, status, outcome, note, outcome_note, agent_id, property_id,
        property:properties(id, property_code, community, building_name, unit_number, property_type, bedrooms),
        agent:profiles!lead_viewings_agent_id_fkey(id, full_name)`
      )
      .eq("lead_id", id)
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("properties")
      .select(INVENTORY_MATCH_SELECT)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("lead_assignments")
      .select(
        `id, from_user, to_user, reason, created_at,
        from_profile:profiles!lead_assignments_from_user_fkey(full_name),
        to_profile:profiles!lead_assignments_to_user_fkey(full_name)`
      )
      .eq("lead_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
    getLeadTimelinePage(id, null, "all"),
  ]);

  if (!timelineResult.ok) {
    return (
      <div className="p-4">
        <p className="text-sm text-slate-500">Could not load timeline.</p>
      </div>
    );
  }

  const person = personResult?.data ?? null;
  const deal = dealResult?.data ?? null;
  const docCategories = docCategoryChoices((fieldOptionRows ?? []) as LeadFieldOption[]);
  const kycDocuments = (customerDocsResult.data ?? []).filter((doc) =>
    KYC_DOC_CATEGORIES.has(normalizeDocCategory(doc.category))
  );
  const matches = matchesForRequirement(
    {
      preferred_areas: lead.preferred_areas,
      bedrooms: lead.bedrooms,
      category: lead.category,
      interest: lead.interest,
      budget_min: lead.budget_min,
      budget_max: lead.budget_max,
    },
    inventoryRows ?? []
  );

  return (
    <LeadDetail
      lead={lead}
      initialTimeline={timelineResult.items}
      initialTimelineCursor={timelineResult.nextCursor}
      activityCount={timelineResult.activityCount}
      agents={agents ?? []}
      stages={stages ?? []}
      areas={(areaRows ?? []).map((row) => row.name)}
      nationalities={(nationalityRows ?? []).map((row) => row.name)}
      fieldOptions={groupLeadFieldOptions((fieldOptionRows ?? []) as LeadFieldOption[])}
      followUps={followUpRows ?? []}
      customer={person}
      personKyc={
        person
          ? {
              nationality: person.nationality,
              emirates_id: person.emirates_id,
              passport_no: person.passport_no,
              trn: person.trn,
            }
          : null
      }
      kycDocuments={kycDocuments.map((doc) => ({
        id: doc.id,
        name: doc.name,
        storage_path: doc.storage_path,
        mime_type: doc.mime_type,
        category: doc.category,
        expiry_date: doc.expiry_date,
        notes: doc.notes,
        created_at: doc.created_at,
      }))}
      kycDocCategories={docCategories}
      deal={deal}
      documents={documents ?? []}
      viewings={viewingRows ?? []}
      inventory={inventoryRows ?? []}
      matches={matches}
      duplicateMatches={duplicateMatches.data ?? []}
      assignments={(assignmentRows ?? []).map((row) => ({
        ...row,
        from_profile: firstRel(row.from_profile as { full_name: string } | { full_name: string }[] | null),
        to_profile: firstRel(row.to_profile as { full_name: string } | { full_name: string }[] | null),
      }))}
      userRole={user.role}
      userId={user.id}
    />
  );
}
