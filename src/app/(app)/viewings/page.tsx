import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ViewingsCalendar, type CalendarViewing } from "@/components/crm/viewings-calendar";
import { Calendar } from "lucide-react";
import { addDays, parseISO, startOfWeek } from "date-fns";
import { canManageCrm } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function ViewingsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; agent?: string; status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const params = await searchParams;
  const parsedWeek = params.week ? parseISO(params.week) : new Date();
  const weekStart = startOfWeek(
    Number.isNaN(parsedWeek.getTime()) ? new Date() : parsedWeek,
    { weekStartsOn: 1 }
  );
  const weekEnd = addDays(weekStart, 7);
  const agentLocked = user.role === "agent";
  const agentFilter = agentLocked ? user.id : params.agent && params.agent !== "all" ? params.agent : null;
  const statusFilter = params.status && params.status !== "scheduled" ? params.status : "scheduled";

  const supabase = await createSupabaseServerClient();

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
  if (statusFilter !== "all") query = query.eq("status", statusFilter);

  const [{ data: viewingRows, error }, { data: agentRows }] = await Promise.all([
    query,
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "agent")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
  ]);

  if (error) console.error("[viewings] query error:", error.message);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div className="overflow-hidden rounded-[14px] border border-border bg-card px-5 py-4">
        <div className="-mx-5 -mt-4 mb-4 h-0.5 bg-primary" />
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Calendar className="h-5 w-5" />
          </span>
          <div>
            <h1
              className="font-heading text-[22px] font-normal tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              Viewings
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Week of booked appointments across leads and deals
            </p>
          </div>
        </div>
      </div>

      <ViewingsCalendar
        viewings={(viewingRows ?? []) as unknown as CalendarViewing[]}
        agents={agentRows ?? []}
        week={params.week}
        agent={agentLocked ? user.id : params.agent}
        status={params.status}
        canEdit={canManageCrm(user.role) || user.role === "agent"}
        agentLocked={agentLocked}
      />
    </div>
  );
}
