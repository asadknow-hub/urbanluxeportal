import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { sweepFirstResponseSla } from "@/server/first-response";
import { fetchAgentPerformanceReport, fetchSourceFunnelReport } from "@/server/reports";
import { can } from "@/lib/permissions";
import { agentLeadScopeOr } from "@/lib/postgrest-filter";
import { addDays, startOfDay } from "date-fns";
import { propertyLabel } from "@/lib/inventory";

export const dynamic = "force-dynamic";

type StageJoin = {
  kind: string;
  stale_after_days: number | null;
} | null;

function firstRel<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function isOpenStage(stage: StageJoin) {
  if (!stage) return true;
  return stage.kind !== "won" && stage.kind !== "lost" && stage.kind !== "junk";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not found");
  const supabase = await createSupabaseServerClient();
  const isAgent = user.role === "agent";
  const showReports = can(user.role, "dashboard_full");
  await sweepFirstResponseSla(supabase);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  let dealsQuery = supabase
    .from("deals")
    .select("value")
    .is("deleted_at", null)
    .in("stage", ["new", "negotiations", "contract", "inquiry", "viewing", "offer", "negotiation"]);

  let leadStatsQuery = supabase
    .from("leads")
    .select("assigned_to, stage_entered_at, stage:lead_stages(kind, stale_after_days)")
    .is("deleted_at", null)
    .limit(5000);

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
    .limit(8);

  let overdueFollowupsQuery = supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .not("next_follow_up_at", "is", null)
    .lt("next_follow_up_at", now.toISOString())
    .is("deleted_at", null);

  let firstResponseOverdueQuery = supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .is("first_responded_at", null)
    .not("first_response_due_at", "is", null)
    .lt("first_response_due_at", now.toISOString());

  let customersQuery = supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  let inventoryQuery = supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  if (isAgent) {
    dealsQuery = dealsQuery.eq("assigned_to", user.id);
    const scope = agentLeadScopeOr(user.id, user.team_id);
    leadStatsQuery = leadStatsQuery.or(scope);
    newLeadsQuery = newLeadsQuery.or(scope);
    followupsQuery = followupsQuery.or(scope);
    overdueFollowupsQuery = overdueFollowupsQuery.or(scope);
    firstResponseOverdueQuery = firstResponseOverdueQuery.or(scope);
    customersQuery = customersQuery.or(`assigned_to.eq.${user.id},assigned_to.is.null`);
  }

  const [
    dealsResult,
    leadStatsResult,
    activityResult,
    followupsResult,
    newLeadsResult,
    customersResult,
    inventoryResult,
    overdueFollowupsResult,
    firstResponseOverdueResult,
    sourceFunnel,
    agentPerformance,
  ] = await Promise.all([
    dealsQuery,
    leadStatsQuery,
    supabase
      .from("activity_log")
      .select("*, actor:profiles!activity_log_actor_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(10),
    followupsQuery,
    newLeadsQuery,
    customersQuery,
    inventoryQuery,
    overdueFollowupsQuery,
    firstResponseOverdueQuery,
    showReports ? fetchSourceFunnelReport() : Promise.resolve([]),
    showReports ? fetchAgentPerformanceReport() : Promise.resolve([]),
  ]);

  const openLeadRows = (leadStatsResult.data ?? []).filter((row) => {
    const stage = firstRel(row.stage as StageJoin | StageJoin[]);
    return isOpenStage(stage);
  });

  let leadsTotal = 0;
  let leadsAssigned = 0;
  let leadsUnassigned = 0;
  let leadsStale = 0;
  for (const row of openLeadRows) {
    leadsTotal += 1;
    if (row.assigned_to) leadsAssigned += 1;
    else leadsUnassigned += 1;
    const stage = firstRel(row.stage as StageJoin | StageJoin[]);
    if (!stage?.stale_after_days || !row.stage_entered_at) continue;
    const elapsedMs = now.getTime() - new Date(row.stage_entered_at).getTime();
    if (elapsedMs > stage.stale_after_days * 24 * 60 * 60 * 1000) leadsStale += 1;
  }

  const dayStart = startOfDay(new Date());
  const dayEnd = addDays(dayStart, 1);
  let todayViewingsQuery = supabase
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
      href: row.lead_id ? `/leads/${row.lead_id}` : row.deal_id ? `/pipeline/${row.deal_id}` : "/leads/followups",
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
      leadsTotal={leadsTotal}
      leadsAssigned={leadsAssigned}
      leadsUnassigned={leadsUnassigned}
      leadsStale={leadsStale}
      customersCount={customersResult.count ?? 0}
      inventoryCount={inventoryResult.count ?? 0}
      overdueFollowUpsCount={overdueFollowupsResult.count ?? 0}
      firstResponseOverdueCount={firstResponseOverdueResult.count ?? 0}
      activities={(activityResult.data ?? []) as never}
      followUps={followupsResult.data ?? []}
      todayViewings={todayViewings}
      sourceFunnel={showReports ? sourceFunnel : undefined}
      agentPerformance={showReports ? agentPerformance : undefined}
    />
  );
}
