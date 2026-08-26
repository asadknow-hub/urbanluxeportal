import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { addDays, startOfDay } from "date-fns";
import { propertyLabel } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not found");
  const supabase = await createSupabaseServerClient();
  const isAgent = user.role === "agent";
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  let dealsQuery = supabase
    .from("deals")
    .select("value")
    .is("deleted_at", null)
    .in("stage", ["new", "negotiations", "contract", "inquiry", "viewing", "offer", "negotiation"]);

  let openLeadsQuery = supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  let newLeadsQuery = supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .gte("created_at", monthStart);

  let followupsQuery = supabase
    .from("leads")
    .select("id, name, next_follow_up_at")
    .not("next_follow_up_at", "is", null)
    .is("deleted_at", null)
    .gte("next_follow_up_at", now.toISOString())
    .order("next_follow_up_at", { ascending: true })
    .limit(10);

  let overdueFollowupsQuery = supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .not("next_follow_up_at", "is", null)
    .lt("next_follow_up_at", now.toISOString())
    .is("deleted_at", null);

  let customersQuery = supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  if (isAgent) {
    dealsQuery = dealsQuery.eq("assigned_to", user.id);
    openLeadsQuery = openLeadsQuery.eq("assigned_to", user.id);
    newLeadsQuery = newLeadsQuery.eq("assigned_to", user.id);
    followupsQuery = followupsQuery.eq("assigned_to", user.id);
    overdueFollowupsQuery = overdueFollowupsQuery.eq("assigned_to", user.id);
    customersQuery = customersQuery.eq("assigned_to", user.id);
  }

  const [
    dealsResult,
    activityResult,
    followupsResult,
    newLeadsResult,
    openLeadsResult,
    customersResult,
    overdueFollowupsResult,
  ] = await Promise.all([
    dealsQuery,
    supabase
      .from("activity_log")
      .select("*, actor:profiles!activity_log_actor_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(15),
    followupsQuery,
    newLeadsQuery,
    openLeadsQuery,
    customersQuery,
    overdueFollowupsQuery,
  ]);

  const svc = createSupabaseServiceClient();
  const dayStart = startOfDay(new Date());
  const dayEnd = addDays(dayStart, 1);
  let todayViewingsQuery = svc
    .from("lead_viewings")
    .select(
      `id, scheduled_at, lead_id, deal_id,
      lead:leads(name),
      deal:deals(title),
      property:properties(property_code, community, building_name, unit_number, property_type, bedrooms)`
    )
    .eq("status", "scheduled")
    .gte("scheduled_at", dayStart.toISOString())
    .lt("scheduled_at", dayEnd.toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(8);
  if (isAgent) todayViewingsQuery = todayViewingsQuery.eq("agent_id", user.id);
  const todayViewingsResult = await todayViewingsQuery;

  function firstRel<T>(value: T | T[] | null | undefined): T | null {
    if (!value) return null;
    return Array.isArray(value) ? value[0] ?? null : value;
  }

  const todayViewings = (todayViewingsResult.data ?? []).map((row) => {
    const lead = firstRel(row.lead as { name: string } | { name: string }[] | null);
    const deal = firstRel(row.deal as { title: string } | { title: string }[] | null);
    const unit = firstRel(
      row.property as
        | {
            property_code: string;
            community: string | null;
            building_name: string | null;
            unit_number: string | null;
            property_type: string;
            bedrooms: number | null;
          }
        | {
            property_code: string;
            community: string | null;
            building_name: string | null;
            unit_number: string | null;
            property_type: string;
            bedrooms: number | null;
          }[]
        | null
    );
    return {
      id: row.id,
      scheduled_at: row.scheduled_at,
      title: lead?.name ?? deal?.title ?? "Viewing",
      href: row.lead_id ? `/leads/${row.lead_id}` : row.deal_id ? `/pipeline/${row.deal_id}` : "/viewings",
      unit: unit ? propertyLabel(unit) : "No unit",
    };
  });

  const activeDeals = dealsResult.data ?? [];
  const pipelineValue = activeDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);

  return (
    <DashboardView
      fullName={user.full_name}
      pipelineValue={pipelineValue}
      activeDealCount={activeDeals.length}
      newLeadsCount={newLeadsResult.count ?? 0}
      openLeadsCount={openLeadsResult.count ?? 0}
      customersCount={customersResult.count ?? 0}
      overdueFollowUpsCount={overdueFollowupsResult.count ?? 0}
      activities={(activityResult.data ?? []) as never}
      followUps={followupsResult.data ?? []}
      todayViewings={todayViewings}
    />
  );
}
