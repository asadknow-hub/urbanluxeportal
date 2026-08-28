import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LeadDetail } from "@/components/leads/lead-detail";
import { groupLeadFieldOptions, type LeadFieldOption } from "@/lib/lead-field-options";
import { matchesForRequirement, INVENTORY_MATCH_SELECT } from "@/lib/match-inventory";
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

  // Agents can only see their own + unassigned
  if (user.role === "agent" && lead.assigned_to !== user.id && lead.assigned_to !== null) {
    return (
      <div className="p-4">
        <p className="text-sm text-slate-500">You don't have access to this lead.</p>
      </div>
    );
  }

  // ─── Parallel data fetching ───────────────────────────────
  // All these queries are independent, so we run them in parallel
  // with Promise.all instead of sequential awaits.
  // This cuts page load time from 6× round-trip to 1× round-trip.
  const [
    { data: stages },
    { data: activities },
    { data: agents },
    { data: documents },
    { data: areaRows },
    { data: nationalityRows },
    { data: fieldOptionRows },
    { data: followUpRows },
    customerResult,
    dealResult,
    { data: viewingRows },
    { data: inventoryRows },
    { data: assignmentRows },
    { data: eventRows },
  ] = await Promise.all([
    supabase
      .from("lead_stages")
      .select("*")
      .eq("is_active", true)
      .order("sort"),
    supabase
      .from("lead_activities")
      .select(`*, author:profiles!lead_activities_created_by_fkey(id, full_name)`)
      .eq("lead_id", id)
      .order("occurred_at", { ascending: false })
      .limit(50),
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
    (lead as { customer_id?: string | null }).customer_id || lead.converted_customer_id
      ? supabase
          .from("customers")
          .select("id, name, phone, email, status")
          .eq("id", ((lead as { customer_id?: string | null }).customer_id || lead.converted_customer_id) as string)
          .single()
      : Promise.resolve({ data: null, error: null }),
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
    supabase
      .from("lead_events")
      .select(`id, kind, actor_id, payload, created_at, actor:profiles!lead_events_actor_id_fkey(full_name)`)
      .eq("lead_id", id)
      .order("id", { ascending: false })
      .limit(40),
  ]);

  const customer = customerResult?.data ?? null;
  const deal = dealResult?.data ?? null;
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
      activities={activities ?? []}
      agents={agents ?? []}
      stages={stages ?? []}
      areas={(areaRows ?? []).map((row) => row.name)}
      nationalities={(nationalityRows ?? []).map((row) => row.name)}
      fieldOptions={groupLeadFieldOptions((fieldOptionRows ?? []) as LeadFieldOption[])}
      followUps={followUpRows ?? []}
      customer={customer}
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
      events={(eventRows ?? []).map((row) => ({
        ...row,
        payload: (row.payload ?? {}) as Record<string, unknown>,
        actor: firstRel(row.actor as { full_name: string } | { full_name: string }[] | null),
      }))}
      userRole={user.role}
      userId={user.id}
    />
  );
}
