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
      <div className="p-6">
        <p className="text-sm text-slate-500">Lead not found.</p>
      </div>
    );
  }

  // Agents can only see their own + unassigned
  if (user.role === "agent" && lead.assigned_to !== user.id && lead.assigned_to !== null) {
    return (
      <div className="p-6">
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
    { data: fieldDefs },
    customerResult,
    dealResult,
  ] = await Promise.all([
    // Stages for the stage dropdown + workflow bar
    supabase
      .from("lead_stages")
      .select("*")
      .eq("is_active", true)
      .order("sort"),

    // Activities with author profile (fixes agent names showing as UUIDs)
    supabase
      .from("lead_activities")
      .select(`*, author:profiles!lead_activities_created_by_fkey(id, full_name)`)
      .eq("lead_id", id)
      .order("occurred_at", { ascending: false })
      .limit(50),

    // Agents for assignment dropdown
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["admin", "manager", "agent"])
      .eq("is_active", true)
      .order("full_name"),

    // Documents
    supabase
      .from("documents")
      .select("*")
      .eq("entity_type", "lead")
      .eq("entity_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),

    // Custom field definitions (active, for lead entity)
    supabase
      .from("custom_field_defs")
      .select("*")
      .eq("entity", "lead")
      .eq("is_active", true)
      .order("sort"),

    // Linked customer (only if converted)
    lead.converted_customer_id
      ? supabase.from("customers").select("id, name, phone, email").eq("id", lead.converted_customer_id).single()
      : Promise.resolve({ data: null, error: null }),

    // Linked deal (only if converted)
    lead.converted_deal_id
      ? supabase.from("deals").select("id, title, stage, value, deal_type").eq("id", lead.converted_deal_id).single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const customer = customerResult?.data ?? null;
  const deal = dealResult?.data ?? null;

  return (
    <LeadDetail
      lead={lead}
      activities={activities ?? []}
      agents={agents ?? []}
      stages={stages ?? []}
      fieldDefs={fieldDefs ?? []}
      customer={customer}
      deal={deal}
      documents={documents ?? []}
      userRole={user.role}
      userId={user.id}
    />
  );
}
