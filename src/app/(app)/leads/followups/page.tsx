import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ScheduleBoard } from "@/components/crm/schedule-board";
import type { CalendarViewing } from "@/components/crm/viewings-calendar";
import type { FollowUpLead } from "@/components/leads/follow-ups-view";
import { agentLeadScopeOr } from "@/lib/postgrest-filter";
import { canManageCrm } from "@/lib/permissions";
import { CalendarClock } from "lucide-react";
import { addDays, parseISO, startOfWeek, subDays } from "date-fns";

export const dynamic = "force-dynamic";

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; agent?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  const parsedWeek = params.week ? parseISO(params.week) : new Date();
  const weekStart = startOfWeek(
    Number.isNaN(parsedWeek.getTime()) ? new Date() : parsedWeek,
    { weekStartsOn: 1 }
  );
  const weekEnd = addDays(weekStart, 7);
  // Include overdue follow-ups from the prior 60 days in the agenda.
  const followUpFrom = subDays(weekStart, 60).toISOString();
  const agentLocked = user.role === "agent";
  const agentFilter = agentLocked ? user.id : params.agent && params.agent !== "all" ? params.agent : null;

  const [leadsResult, viewingsResult, agentsResult] = await Promise.all([
    (async () => {
      let query = supabase
        .from("leads")
        .select(
          `id, name, phone, email, interest, next_follow_up_at, last_activity_at,
           updated_at, stage_id, assigned_to,
           assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name, avatar_url),
           stage:lead_stages(id, name, color, kind)`
        )
        .is("deleted_at", null)
        .neq("status", "converted")
        .not("next_follow_up_at", "is", null)
        .gte("next_follow_up_at", followUpFrom)
        .lt("next_follow_up_at", weekEnd.toISOString())
        .order("next_follow_up_at", { ascending: true })
        .limit(500);

      if (user.role === "agent") {
        query = query.or(agentLeadScopeOr(user.id, user.team_id));
      } else if (agentFilter) {
        query = query.eq("assigned_to", agentFilter);
      }

      return await query;
    })(),
    (async () => {
      let query = supabase
        .from("lead_viewings")
        .select(
          `id, scheduled_at, status, outcome, note, agent_id, lead_id, deal_id,
          property:properties(id, property_code, community, building_name, unit_number, property_type, bedrooms),
          agent:profiles!lead_viewings_agent_id_fkey(id, full_name),
          lead:leads(id, name),
          deal:deals(id, title)`
        )
        .gte("scheduled_at", weekStart.toISOString())
        .lt("scheduled_at", weekEnd.toISOString())
        .order("scheduled_at", { ascending: true });

      if (agentFilter) query = query.eq("agent_id", agentFilter);
      // Show scheduled + recent outcomes for the week so calendar isn't empty after completion.
      query = query.in("status", ["scheduled", "completed", "no_show", "cancelled"]);

      return await query;
    })(),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .in("role", ["admin", "manager", "reception", "agent"])
      .order("full_name", { ascending: true }),
  ]);

  if (leadsResult.error) console.error("[followups] leads query error:", leadsResult.error.message);
  if (viewingsResult.error) console.error("[followups] viewings query error:", viewingsResult.error.message);
  if (agentsResult.error) console.error("[followups] agents query error:", agentsResult.error.message);

  const followUps = (leadsResult.data ?? []) as unknown as FollowUpLead[];
  const viewings = (viewingsResult.data ?? []) as unknown as CalendarViewing[];
  const followUpCount = followUps.length;
  const viewingCount = viewings.filter((v) => v.status === "scheduled").length;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div className="overflow-hidden rounded-[14px] border border-border bg-card px-5 py-4">
        <div className="-mx-5 -mt-4 mb-4 h-0.5 bg-primary" />
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div>
            <h1
              className="font-heading text-[22px] font-normal tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              Follow-ups
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {followUpCount} follow-up{followUpCount === 1 ? "" : "s"} · {viewingCount} viewing
              {viewingCount === 1 ? "" : "s"} this week
            </p>
          </div>
        </div>
      </div>

      <ScheduleBoard
        followUps={followUps}
        viewings={viewings}
        agents={agentsResult.data ?? []}
        week={params.week}
        agent={agentLocked ? user.id : params.agent}
        canEdit={canManageCrm(user.role) || user.role === "agent"}
        agentLocked={agentLocked}
      />
    </div>
  );
}
