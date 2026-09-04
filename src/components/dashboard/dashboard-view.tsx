import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarClock,
  ChevronRight,
  Contact,
  KanbanSquare,
  Users,
  UserMinus,
  UserCheck,
  AlertTriangle,
  Clock,
  Bell,
} from "lucide-react";
import { formatAED } from "@/lib/money";
import { formatDate, formatDateTime, timeAgo } from "@/lib/dates";
import { ReportsView } from "@/components/reports/reports-view";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentPerformanceRow, SourceFunnelRow } from "@/server/reports";

type Activity = {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  actor: { full_name: string } | null;
};

type FollowUp = {
  id: string;
  name: string;
  next_follow_up_at: string | null;
};

type TodayViewing = {
  id: string;
  scheduled_at: string;
  title: string;
  href: string;
  unit: string;
};

function MetricTile({
  label,
  value,
  hint,
  href,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  href: string;
  icon: LucideIcon;
  tone: {
    panel: string;
    icon: string;
    value: string;
    label: string;
  };
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[16px] border p-4 transition-all duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md",
        tone.panel
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid h-9 w-9 place-items-center rounded-[10px]", tone.icon)}>
          <Icon className="h-4 w-4" />
        </span>
        <ChevronRight className="h-4 w-4 opacity-40 transition-opacity group-hover:opacity-80" />
      </div>
      <p className={cn("mt-4 text-[0.68rem] font-bold uppercase tracking-[0.14em]", tone.label)}>{label}</p>
      <p
        className={cn("mt-1 font-heading text-[1.85rem] leading-none tabular-nums", tone.value)}
        style={{ fontFamily: "var(--font-display), serif" }}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-foreground/55">{hint}</p> : null}
    </Link>
  );
}

function LeadStat({
  label,
  value,
  href,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  href: string;
  tone: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-[14px] border bg-white/80 px-3.5 py-3 transition-colors hover:bg-white",
        tone
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/90 shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-foreground/55">{label}</p>
        <p
          className="font-heading text-[1.55rem] leading-none tabular-nums text-foreground"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          {value}
        </p>
      </div>
    </Link>
  );
}

export function DashboardView({
  fullName,
  pipelineValue,
  activeDealCount,
  newLeadsCount,
  leadsTotal,
  leadsAssigned,
  leadsUnassigned,
  leadsStale,
  customersCount,
  inventoryCount,
  overdueFollowUpsCount,
  firstResponseOverdueCount = 0,
  activities,
  followUps,
  todayViewings = [],
  sourceFunnel,
  agentPerformance,
}: {
  fullName: string;
  pipelineValue: number;
  activeDealCount: number;
  newLeadsCount: number;
  leadsTotal: number;
  leadsAssigned: number;
  leadsUnassigned: number;
  leadsStale: number;
  customersCount: number;
  inventoryCount: number;
  overdueFollowUpsCount: number;
  firstResponseOverdueCount?: number;
  activities: Activity[];
  followUps: FollowUp[];
  todayViewings?: TodayViewing[];
  sourceFunnel?: SourceFunnelRow[];
  agentPerformance?: AgentPerformanceRow[];
}) {
  const showReports = Boolean(sourceFunnel && agentPerformance);
  const firstName = fullName.split(/\s+/)[0] || fullName;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div className="overflow-hidden rounded-[18px] border border-[#0b1d3d]/10 bg-gradient-to-br from-[#0b1d3d] via-[#123055] to-[#1e7a4a] px-5 py-5 text-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/65">Dashboard</p>
            <h1
              className="mt-1 font-heading text-[1.85rem] leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              Welcome back, {firstName}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/75">
              Agency pulse — leads, pipeline, inventory, and today&apos;s schedule in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/leads"
              className={cn(buttonVariants({ size: "sm" }), "bg-white text-[#0b1d3d] hover:bg-white/90")}
            >
              Add lead
            </Link>
            <Link
              href="/leads/followups"
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "border-white/30 bg-white/10 text-white hover:bg-white/15 hover:text-white"
              )}
            >
              Schedule
            </Link>
            <Link
              href="/pipeline"
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "border-white/30 bg-white/10 text-white hover:bg-white/15 hover:text-white"
              )}
            >
              Deals
            </Link>
          </div>
        </div>
      </div>

      {/* Agency snapshot */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Agency snapshot</h2>
          <p className="text-xs text-muted-foreground">The whole picture at a glance</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="Pipeline value"
            value={formatAED(pipelineValue)}
            hint={`${activeDealCount} active deal${activeDealCount === 1 ? "" : "s"}`}
            href="/pipeline"
            icon={KanbanSquare}
            tone={{
              panel: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white",
              icon: "bg-emerald-600 text-white",
              value: "text-emerald-900",
              label: "text-emerald-700/80",
            }}
          />
          <MetricTile
            label="Customers"
            value={String(customersCount)}
            hint="People in CRM"
            href="/customers"
            icon={Contact}
            tone={{
              panel: "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white",
              icon: "bg-sky-600 text-white",
              value: "text-sky-950",
              label: "text-sky-700/80",
            }}
          />
          <MetricTile
            label="Inventory"
            value={String(inventoryCount)}
            hint="Properties listed"
            href="/inventory"
            icon={Building2}
            tone={{
              panel: "border-cyan-200/80 bg-gradient-to-br from-cyan-50 to-white",
              icon: "bg-cyan-700 text-white",
              value: "text-cyan-950",
              label: "text-cyan-800/80",
            }}
          />
          <MetricTile
            label="New leads (MTD)"
            value={String(newLeadsCount)}
            hint="Created this month"
            href="/leads"
            icon={Users}
            tone={{
              panel: "border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-white",
              icon: "bg-indigo-600 text-white",
              value: "text-indigo-950",
              label: "text-indigo-700/80",
            }}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* Leads cluster */}
        <section className="overflow-hidden rounded-[18px] border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/40 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-violet-600 text-white">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-violet-950">Leads</h2>
                <p className="text-xs text-violet-800/70">Open pipeline — ownership and SLA health</p>
              </div>
            </div>
            <Link href="/leads" className="text-xs font-semibold text-violet-700 hover:text-violet-900">
              Open board →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            <LeadStat
              label="Total"
              value={leadsTotal}
              href="/leads"
              tone="border-violet-200 text-violet-800"
              icon={Users}
            />
            <LeadStat
              label="Assigned"
              value={leadsAssigned}
              href="/leads"
              tone="border-emerald-200 text-emerald-800"
              icon={UserCheck}
            />
            <LeadStat
              label="Unassigned"
              value={leadsUnassigned}
              href="/leads"
              tone="border-amber-200 text-amber-900"
              icon={UserMinus}
            />
            <LeadStat
              label="Stale"
              value={leadsStale}
              href="/leads"
              tone="border-rose-200 text-rose-800"
              icon={AlertTriangle}
            />
          </div>
          <div className="grid grid-cols-1 gap-2 border-t border-violet-100 bg-white/50 px-4 py-3 sm:grid-cols-2">
            <Link
              href="/leads/followups"
              className={cn(
                "flex items-center justify-between rounded-[12px] border px-3.5 py-2.5 transition-colors",
                overdueFollowUpsCount > 0
                  ? "border-rose-200 bg-rose-50 hover:bg-rose-100/70"
                  : "border-border bg-white hover:bg-muted/40"
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Bell className={cn("h-4 w-4", overdueFollowUpsCount > 0 ? "text-rose-600" : "text-muted-foreground")} />
                Overdue follow-ups
              </span>
              <span
                className={cn(
                  "tabular-nums text-lg font-semibold",
                  overdueFollowUpsCount > 0 ? "text-rose-700" : "text-foreground"
                )}
              >
                {overdueFollowUpsCount}
              </span>
            </Link>
            <Link
              href="/leads?view=list&sla=first_response_overdue"
              className={cn(
                "flex items-center justify-between rounded-[12px] border px-3.5 py-2.5 transition-colors",
                firstResponseOverdueCount > 0
                  ? "border-orange-200 bg-orange-50 hover:bg-orange-100/70"
                  : "border-border bg-white hover:bg-muted/40"
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Clock
                  className={cn(
                    "h-4 w-4",
                    firstResponseOverdueCount > 0 ? "text-orange-600" : "text-muted-foreground"
                  )}
                />
                First-response overdue
              </span>
              <span
                className={cn(
                  "tabular-nums text-lg font-semibold",
                  firstResponseOverdueCount > 0 ? "text-orange-700" : "text-foreground"
                )}
              >
                {firstResponseOverdueCount}
              </span>
            </Link>
          </div>
        </section>

        {/* Today schedule */}
        <section className="overflow-hidden rounded-[18px] border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50/30 shadow-sm">
          <div className="flex items-center justify-between border-b border-amber-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-amber-500 text-white">
                <CalendarClock className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-amber-950">Today</h2>
                <p className="text-xs text-amber-900/70">Viewings and upcoming follow-ups</p>
              </div>
            </div>
            <Link href="/leads/followups" className="text-xs font-semibold text-amber-800 hover:text-amber-950">
              Full schedule →
            </Link>
          </div>
          <div className="grid gap-0 sm:grid-cols-2 xl:grid-cols-1">
            <div className="border-b border-amber-100 px-4 py-3 xl:border-b">
              <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-violet-700">
                Viewings · {todayViewings.length}
              </p>
              {todayViewings.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No viewings today.</p>
              ) : (
                <ul className="space-y-1.5">
                  {todayViewings.map((row) => (
                    <li key={row.id}>
                      <Link
                        href={row.href}
                        className="flex items-center justify-between rounded-[10px] border border-violet-100 bg-violet-50/60 px-2.5 py-2 hover:bg-violet-100/70"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-violet-950">{row.title}</p>
                          <p className="truncate text-[11px] text-violet-800/70">
                            {formatDateTime(row.scheduled_at)} · {row.unit}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-violet-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="px-4 py-3">
              <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-amber-800">
                Follow-ups · {followUps.length}
              </p>
              {followUps.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No upcoming follow-ups.</p>
              ) : (
                <ul className="space-y-1.5">
                  {followUps.map((lead) => (
                    <li key={lead.id}>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="flex items-center justify-between rounded-[10px] border border-amber-100 bg-amber-50/70 px-2.5 py-2 hover:bg-amber-100/80"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-amber-950">{lead.name}</p>
                          <p className="text-[11px] text-amber-800/70">{formatDate(lead.next_follow_up_at)}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-amber-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>

      {showReports ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Performance</h2>
            <p className="text-xs text-muted-foreground">Source funnel and agent scores</p>
          </div>
          <div className="overflow-hidden rounded-[18px] border border-[#0b1d3d]/10 bg-card shadow-sm">
            <div className="h-1 bg-gradient-to-r from-[#0b1d3d] via-[#1e7a4a] to-sky-500" />
            <div className="p-1 sm:p-2">
              <ReportsView sourceFunnel={sourceFunnel!} agentPerformance={agentPerformance!} />
            </div>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[18px] border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
          <span className="text-xs text-muted-foreground">{activities.length} latest</span>
        </div>
        {activities.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <ul className="divide-y divide-border">
            {activities.map((act) => (
              <li key={act.id} className="flex items-start gap-3 px-5 py-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0b1d3d]/8 text-xs font-semibold text-[#0b1d3d]">
                  {act.actor?.full_name ? act.actor.full_name.charAt(0).toUpperCase() : "S"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{act.actor?.full_name ?? "System"}</span>{" "}
                    <span className="text-muted-foreground">{act.action.replace(/_/g, " ")}</span>{" "}
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{act.entity_type}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{timeAgo(act.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
