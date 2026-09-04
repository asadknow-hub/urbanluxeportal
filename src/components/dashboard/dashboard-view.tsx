import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatAED } from "@/lib/money";
import { formatDate, formatDateTime, timeAgo } from "@/lib/dates";
import { PageHeader } from "@/components/primitives/page-header";
import { StatCard } from "@/components/primitives/stat-card";
import { SectionCard } from "@/components/primitives/section-card";
import { EmptyState } from "@/components/primitives/empty-state";
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

export function DashboardView({
  fullName,
  pipelineValue,
  activeDealCount,
  newLeadsCount,
  openLeadsCount,
  customersCount,
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
  openLeadsCount: number;
  customersCount: number;
  overdueFollowUpsCount: number;
  firstResponseOverdueCount?: number;
  activities: Activity[];
  followUps: FollowUp[];
  todayViewings?: TodayViewing[];
  sourceFunnel?: SourceFunnelRow[];
  agentPerformance?: AgentPerformanceRow[];
}) {
  const showReports = Boolean(sourceFunnel && agentPerformance);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${fullName}. Pipeline health, schedule, and agency performance.`}
        actions={
          <>
            <Link href="/leads" className={cn(buttonVariants({ size: "sm" }))}>
              Add lead
            </Link>
            <Link href="/leads/followups" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
              Follow-ups
            </Link>
            <Link href="/deals" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
              Deals
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="sm:col-span-2">
          <StatCard
            featured
            label="Pipeline value"
            value={formatAED(pipelineValue)}
            hint={`${activeDealCount} active deals`}
            href="/deals"
          />
        </div>
        <StatCard label="Open leads" value={String(openLeadsCount)} href="/leads" />
        <StatCard
          label="Overdue follow-ups"
          value={String(overdueFollowUpsCount)}
          tone={overdueFollowUpsCount > 0 ? "danger" : undefined}
          href="/leads/followups"
        />
        <StatCard
          label="First response overdue"
          value={String(firstResponseOverdueCount)}
          tone={firstResponseOverdueCount > 0 ? "danger" : undefined}
          href="/leads?view=list&sla=first_response_overdue"
        />
        <StatCard label="New leads (MTD)" value={String(newLeadsCount)} href="/leads" />
        <StatCard label="Customers" value={String(customersCount)} href="/customers" />
      </div>

      {showReports ? (
        <ReportsView sourceFunnel={sourceFunnel!} agentPerformance={agentPerformance!} />
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard title="Recent activity" className="lg:col-span-2">
          {activities.length === 0 ? (
            <EmptyState title="No recent activity" className="border-0" />
          ) : (
            <ul className="divide-y divide-border">
              {activities.map((act) => (
                <li key={act.id} className="flex items-start gap-3 px-5 py-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
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
        </SectionCard>

        <div className="space-y-4">
          <SectionCard
            title="Today's viewings"
            action={
              <Link href="/leads/followups" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                Schedule
              </Link>
            }
          >
            {todayViewings.length === 0 ? (
              <EmptyState title="No viewings today" className="border-0" />
            ) : (
              <ul className="space-y-2 p-3">
                {todayViewings.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={row.href}
                      className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted/60"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{row.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDateTime(row.scheduled_at)} · {row.unit}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Upcoming follow-ups"
            action={
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                {followUps.length}
              </span>
            }
          >
            {followUps.length === 0 ? (
              <EmptyState title="No scheduled follow-ups" className="border-0" />
            ) : (
              <ul className="space-y-2 p-3">
                {followUps.map((lead) => (
                  <li key={lead.id}>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted/60"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{lead.name}</p>
                        <p className="text-[11px] text-muted-foreground">{formatDate(lead.next_follow_up_at)}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
