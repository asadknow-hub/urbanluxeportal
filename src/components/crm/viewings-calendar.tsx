"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addDays, format, isSameDay, parseISO, startOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { propertyLabel, VIEWING_OUTCOMES, VIEWING_STATUSES } from "@/lib/inventory";
import { updateViewingOutcome } from "@/server/viewings";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarViewing = {
  id: string;
  scheduled_at: string;
  status: string;
  outcome: string | null;
  note: string | null;
  agent_id: string | null;
  lead_id: string | null;
  deal_id: string | null;
  property?: {
    id: string;
    property_code: string;
    community: string | null;
    building_name: string | null;
    unit_number: string | null;
    property_type: string;
    bedrooms: number | null;
  } | {
    id: string;
    property_code: string;
    community: string | null;
    building_name: string | null;
    unit_number: string | null;
    property_type: string;
    bedrooms: number | null;
  }[] | null;
  agent?: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
  lead?: { id: string; name: string } | { id: string; name: string }[] | null;
  deal?: { id: string; title: string } | { id: string; title: string }[] | null;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function subjectLabel(row: CalendarViewing) {
  const lead = first(row.lead);
  if (lead?.name) return lead.name;
  const deal = first(row.deal);
  if (deal?.title) return deal.title;
  return "Viewing";
}

function weekStartFromParam(week: string | undefined) {
  if (week) {
    const parsed = parseISO(week);
    if (!Number.isNaN(parsed.getTime())) return startOfWeek(parsed, { weekStartsOn: 1 });
  }
  return startOfWeek(new Date(), { weekStartsOn: 1 });
}

export function ViewingsCalendar({
  viewings,
  agents,
  week,
  agent,
  status,
  canEdit,
  agentLocked,
}: {
  viewings: CalendarViewing[];
  agents: { id: string; full_name: string }[];
  week?: string;
  agent?: string;
  status?: string;
  canEdit: boolean;
  agentLocked?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const start = weekStartFromParam(week);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [start]);

  function push(next: { week?: Date; agent?: string; status?: string }) {
    const params = new URLSearchParams();
    const weekDate = next.week ?? start;
    params.set("week", format(weekDate, "yyyy-MM-dd"));
    const agentValue = next.agent ?? agent;
    const statusValue = next.status ?? status;
    if (!agentLocked && agentValue && agentValue !== "all") params.set("agent", agentValue);
    if (statusValue && statusValue !== "scheduled") params.set("status", statusValue);
    router.push(`/viewings?${params.toString()}`);
  }

  function handleOutcome(id: string, nextStatus: "completed" | "no_show" | "cancelled", outcome?: string) {
    startTransition(async () => {
      const result = await updateViewingOutcome({
        id,
        status: nextStatus,
        outcome: outcome || null,
      });
      if (result.ok) {
        toast.success("Viewing updated");
        router.refresh();
      } else toast.error(result.error ?? "Failed");
    });
  }

  const byDay = days.map((day) => ({
    day,
    rows: viewings.filter((row) => isSameDay(new Date(row.scheduled_at), day)),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => push({ week: addDays(start, -7) })}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="min-w-[180px] text-center text-sm font-semibold">
            {format(start, "d MMM")} – {format(addDays(start, 6), "d MMM yyyy")}
          </p>
          <Button size="sm" variant="outline" onClick={() => push({ week: addDays(start, 7) })}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => push({ week: startOfWeek(new Date(), { weekStartsOn: 1 }) })}>
            Today
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {!agentLocked ? (
            <Select value={agent ?? "all"} onValueChange={(v) => push({ agent: v ?? "all" })}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agents</SelectItem>
                {agents.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Select value={status ?? "scheduled"} onValueChange={(v) => push({ status: v ?? "scheduled" })}>
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="all">All statuses</SelectItem>
              {VIEWING_STATUSES.filter((row) => row.value !== "scheduled").map((row) => (
                <SelectItem key={row.value} value={row.value}>
                  {row.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
        {byDay.map(({ day, rows }) => {
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[160px] rounded-[14px] border bg-card p-3",
                isToday ? "border-primary/50" : "border-border"
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {format(day, "EEE")}
              </p>
              <p className={cn("mb-2 text-lg font-semibold", isToday && "text-primary")}>{format(day, "d")}</p>
              <div className="space-y-2">
                {rows.length === 0 ? (
                  <p className="text-xs text-muted-foreground">—</p>
                ) : (
                  rows.map((row) => {
                    const unit = first(row.property);
                    const href = row.lead_id ? `/leads/${row.lead_id}` : row.deal_id ? `/pipeline/${row.deal_id}` : "/viewings";
                    return (
                      <div key={row.id} className="rounded-[10px] border border-border/70 bg-muted/30 p-2 text-xs">
                        <Link href={href} className="font-semibold hover:text-primary">
                          {format(new Date(row.scheduled_at), "HH:mm")} · {subjectLabel(row)}
                        </Link>
                        <p className="mt-0.5 text-muted-foreground">
                          {unit ? propertyLabel(unit) : "No unit"}
                          {first(row.agent)?.full_name ? ` · ${first(row.agent)?.full_name}` : ""}
                        </p>
                        {canEdit && row.status === "scheduled" ? (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {VIEWING_OUTCOMES.slice(0, 2).map((outcome) => (
                              <button
                                key={outcome.value}
                                type="button"
                                disabled={pending}
                                className="rounded border border-border px-1.5 py-0.5 hover:border-foreground"
                                onClick={() => handleOutcome(row.id, "completed", outcome.value)}
                              >
                                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : outcome.label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 uppercase tracking-wider text-muted-foreground">{row.status.replace(/_/g, " ")}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Times are shown in your browser timezone. {viewings.length} viewing{viewings.length === 1 ? "" : "s"} this week.
      </p>
    </div>
  );
}
