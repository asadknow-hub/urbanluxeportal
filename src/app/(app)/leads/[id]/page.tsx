import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LeadDetail } from "@/components/leads/lead-detail";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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
      assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name, avatar_url, role, email, phone),
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
    { data: lostReasons },
    customerResult,
    dealResult,
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
      .in("role", ["admin", "manager", "agent"])
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
    supabase
      .from("lost_reasons")
      .select("kind, label")
      .eq("is_active", true)
      .order("sort"),
    lead.converted_customer_id
      ? supabase.from("customers").select("id, name, phone, email").eq("id", lead.converted_customer_id).single()
      : Promise.resolve({ data: null, error: null }),
    lead.converted_deal_id
      ? supabase.from("deals").select("id, title, stage, value, deal_type").eq("id", lead.converted_deal_id).single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const lostReasonsByKind = (lostReasons ?? []).reduce<Record<string, string[]>>((acc, r) => {
    (acc[r.kind] ??= []).push(r.label);
    return acc;
  }, {});

  const customer = customerResult?.data ?? null;
  const deal = dealResult?.data ?? null;

  return (
    <LeadDetail
      lead={lead}
      activities={activities ?? []}
      agents={agents ?? []}
      stages={stages ?? []}
      areas={(areaRows ?? []).map((row) => row.name)}
      customer={customer}
      deal={deal}
      documents={documents ?? []}
      lostReasons={lostReasonsByKind}
      duplicateMatches={duplicateMatches.data ?? []}
      userRole={user.role}
      userId={user.id}
    />
  );
}
