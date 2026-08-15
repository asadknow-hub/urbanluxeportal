import Link from "next/link";
import { AlertCircle, ChevronRight } from "lucide-react";
import { formatAED, formatAEDCompact } from "@/lib/money";
import { formatDate, timeAgo } from "@/lib/dates";
import { PageHeader } from "@/components/primitives/page-header";
import { StatCard } from "@/components/primitives/stat-card";
import { SectionCard } from "@/components/primitives/section-card";
import { EmptyState } from "@/components/primitives/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export function DashboardView({
  fullName,
  pipelineValue,
  activeDealCount,
  revenueThisMonth,
  expensesThisMonth,
  overdueCount,
  overdueAmount,
  newLeadsCount,
  activeCampaignsCount,
  totalProperties,
  chequesDue30Count,
  chequesOverdueCount,
  chequesDue30Amount,
  chequesOverdueAmount,
  activities,
  followUps,
}: {
  fullName: string;
  pipelineValue: number;
  activeDealCount: number;
  revenueThisMonth: number;
  expensesThisMonth: number;
  overdueCount: number;
  overdueAmount: number;
  newLeadsCount: number;
  activeCampaignsCount: number;
  totalProperties: number;
  chequesDue30Count: number;
  chequesOverdueCount: number;
  chequesDue30Amount: number;
  chequesOverdueAmount: number;
  activities: Activity[];
  followUps: FollowUp[];
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${fullName}. Pipeline, cash, and follow-ups for today.`}
        actions={
          <>
            <Link href="/leads" className={cn(buttonVariants({ size: "sm" }))}>
              Add lead
            </Link>
            <Link href="/properties" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
              Add property
            </Link>
            <Link href="/quotations" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
              New quotation
            </Link>
          </>
        }
      />

      {(chequesDue30Count > 0 || chequesOverdueCount > 0) && (
        <Link
          href="/payments?tab=cheques"
          className="flex items-center justify-between gap-4 rounded-xl border border-destructive/25 bg-card p-4 transition-colors hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Cheques need attention</p>
              <p className="text-xs text-muted-foreground">
                {chequesDue30Count} due in 30 days · {chequesOverdueCount} overdue ({formatAEDCompact(chequesDue30Amount)} due · {formatAEDCompact(chequesOverdueAmount)} overdue)
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="sm:col-span-2">
          <StatCard
            featured
            label="Pipeline value"
            value={formatAED(pipelineValue)}
            hint={`${activeDealCount} active deals`}
            href="/pipeline"
          />
        </div>
        <StatCard label="Revenue this month" value={formatAED(revenueThisMonth)} href="/invoices" />
        <StatCard
          label="Overdue invoices"
          value={String(overdueCount)}
          hint={formatAED(overdueAmount)}
          tone="danger"
          href="/invoices"
        />
        <StatCard label="New leads (MTD)" value={String(newLeadsCount)} href="/leads" />
        <StatCard label="Active campaigns" value={String(activeCampaignsCount)} href="/leads/campaigns" />
        <StatCard label="Properties" value={String(totalProperties)} href="/properties" />
        <StatCard label="Expenses this month" value={formatAED(expensesThisMonth)} href="/expenses" />
      </div>

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
  );
}
