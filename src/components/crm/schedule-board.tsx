"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  addDays,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
} from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { propertyLabel, VIEWING_OUTCOMES } from "@/lib/inventory";
import { formatDateTime, shortTimeAgo } from "@/lib/dates";
import { completeFollowUp, snoozeFollowUp } from "@/server/leads";
import { updateViewingOutcome } from "@/server/viewings";
import { toast } from "sonner";
import {
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { telLink } from "@/lib/phone";
import type { CalendarViewing } from "@/components/crm/viewings-calendar";
import type { FollowUpLead } from "@/components/leads/follow-ups-view";

const FOLLOW_UP_COLOR = {
  bg: "bg-amber-50",
  border: "border-amber-200",
  text: "text-amber-900",
  dot: "bg-amber-500",
  chip: "bg-amber-500",
  soft: "bg-amber-100 text-amber-800",
};

const VIEWING_COLOR = {
  bg: "bg-violet-50",
  border: "border-violet-200",
  text: "text-violet-900",
  dot: "bg-violet-500",
  chip: "bg-violet-500",
  soft: "bg-violet-100 text-violet-800",
};

type KindFilter = "all" | "follow_up" | "viewing";

type ScheduleItem =
  | {
      kind: "follow_up";
      id: string;
      at: string;
      title: string;
      href: string;
      subtitle: string | null;
      phone: string | null;
      agentName: string | null;
      overdue: boolean;
      lead: FollowUpLead;
    }
  | {
      kind: "viewing";
      id: string;
      at: string;
      title: string;
      href: string;
      subtitle: string | null;
      phone: string | null;
      agentName: string | null;
      overdue: boolean;
      viewing: CalendarViewing;
      status: string;
    };

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function weekStartFromParam(week: string | undefined) {
  if (week) {
    const parsed = parseISO(week);
    if (!Number.isNaN(parsed.getTime())) return startOfWeek(parsed, { weekStartsOn: 1 });
  }
  return startOfWeek(new Date(), { weekStartsOn: 1 });
}

function subjectLabel(row: CalendarViewing) {
  const lead = first(row.lead);
  if (lead?.name) return lead.name;
  const deal = first(row.deal);
  if (deal?.title) return deal.title;
  return "Viewing";
}

export function ScheduleBoard({
  followUps,
  viewings,
  agents,
  week,
  agent,
  canEdit,
  agentLocked,
}: {
  followUps: FollowUpLead[];
  viewings: CalendarViewing[];
  agents: { id: string; full_name: string }[];
  week?: string;
  agent?: string;
  canEdit: boolean;
  agentLocked?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const start = weekStartFromParam(week);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [start]);
  const weekEnd = addDays(start, 7);

  function push(next: { week?: Date; agent?: string }) {
    const params = new URLSearchParams();
    const weekDate = next.week ?? start;
    params.set("week", format(weekDate, "yyyy-MM-dd"));
    const agentValue = next.agent ?? agent;
    if (!agentLocked && agentValue && agentValue !== "all") params.set("agent", agentValue);
    router.push(`/leads/followups?${params.toString()}`);
  }

  const items = useMemo(() => {
    const nowMs = Date.now();
    const rows: ScheduleItem[] = [];

    for (const lead of followUps) {
      if (!lead.next_follow_up_at) continue;
      const at = new Date(lead.next_follow_up_at);
      if (Number.isNaN(at.getTime())) continue;
      if (agent && agent !== "all" && lead.assigned_to !== agent) continue;
      rows.push({
        kind: "follow_up",
        id: `fu_${lead.id}`,
        at: lead.next_follow_up_at,
        title: lead.name,
        href: `/leads/${lead.id}`,
        subtitle: lead.interest || lead.stage?.name || null,
        phone: lead.phone,
        agentName: lead.assigned_to_profile?.full_name ?? null,
        overdue: at.getTime() < nowMs,
        lead,
      });
    }

    for (const viewing of viewings) {
      const at = new Date(viewing.scheduled_at);
      if (Number.isNaN(at.getTime())) continue;
      if (agent && agent !== "all" && viewing.agent_id !== agent) continue;
      const unit = first(viewing.property);
      rows.push({
        kind: "viewing",
        id: `vw_${viewing.id}`,
        at: viewing.scheduled_at,
        title: subjectLabel(viewing),
        href: viewing.lead_id
          ? `/leads/${viewing.lead_id}`
          : viewing.deal_id
            ? `/pipeline/${viewing.deal_id}`
            : "/leads/followups",
        subtitle: unit ? propertyLabel(unit) : null,
        phone: null,
        agentName: first(viewing.agent)?.full_name ?? null,
        overdue: viewing.status === "scheduled" && at.getTime() < nowMs,
        viewing,
        status: viewing.status,
      });
    }

    rows.sort((a, b) => a.at.localeCompare(b.at));
    return rows;
  }, [followUps, viewings, agent]);

  const weekItems = useMemo(
    () =>
      items.filter((item) => {
        const t = new Date(item.at).getTime();
        return t >= start.getTime() && t < weekEnd.getTime();
      }),
    [items, start, weekEnd]
  );

  const overdueOutsideWeek = useMemo(
    () =>
      items.filter(
        (item) =>
          item.kind === "follow_up" &&
          item.overdue &&
          (new Date(item.at).getTime() < start.getTime() || new Date(item.at).getTime() >= weekEnd.getTime())
      ),
    [items, start, weekEnd]
  );

  const listItems = useMemo(() => {
    const base = [...overdueOutsideWeek, ...weekItems];
    const filtered =
      kindFilter === "all" ? base : base.filter((item) => item.kind === kindFilter);
    if (!selectedDay) return filtered;
    return filtered.filter((item) => isSameDay(new Date(item.at), parseISO(selectedDay)));
  }, [overdueOutsideWeek, weekItems, kindFilter, selectedDay]);

  const byDay = days.map((day) => ({
    day,
    rows: weekItems.filter((item) => {
      if (kindFilter !== "all" && item.kind !== kindFilter) return false;
      return isSameDay(new Date(item.at), day);
    }),
  }));

  function handleComplete(leadId: string) {
    startTransition(async () => {
      const result = await completeFollowUp(leadId);
      if (result.ok) {
        toast.success("Follow-up completed");
        router.refresh();
      } else toast.error(result.error ?? "Failed");
    });
  }

  function handleSnooze(leadId: string, daysCount: number) {
    const next = addDays(new Date(), daysCount);
    startTransition(async () => {
      const result = await snoozeFollowUp(leadId, next.toISOString());
      if (result.ok) {
        toast.success(`Snoozed ${daysCount}d`);
        router.refresh();
      } else toast.error(result.error ?? "Failed");
    });
  }

  function handleOutcome(
    id: string,
    nextStatus: "completed" | "no_show" | "cancelled",
    outcome?: string
  ) {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => push({ week: addDays(start, -7) })}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="min-w-[180px] text-center text-sm font-semibold">
            {format(start, "d MMM")} – {format(addDays(start, 6), "d MMM yyyy")}
          </p>
          <Button size="sm" variant="outline" onClick={() => push({ week: addDays(start, 7) })}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedDay(null);
              push({ week: startOfWeek(new Date(), { weekStartsOn: 1 }) });
            }}
          >
            Today
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-3 rounded-[10px] border border-border bg-card px-3 py-1.5 text-[0.72rem] font-medium">
            <span className="inline-flex items-center gap-1.5 text-amber-800">
              <span className={cn("h-2.5 w-2.5 rounded-full", FOLLOW_UP_COLOR.dot)} />
              Follow-up
            </span>
            <span className="inline-flex items-center gap-1.5 text-violet-800">
              <span className={cn("h-2.5 w-2.5 rounded-full", VIEWING_COLOR.dot)} />
              Viewing
            </span>
          </div>

          <div className="flex rounded-md border border-border p-0.5">
            {(
              [
                ["all", "All"],
                ["follow_up", "Follow-ups"],
                ["viewing", "Viewings"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setKindFilter(key)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  kindFilter === key
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {!agentLocked ? (
            <Select value={agent ?? "all"} onValueChange={(v) => push({ agent: v ?? "all" })}>
              <SelectTrigger className="h-9 w-[180px]">
                <span className="truncate">
                  {agent && agent !== "all"
                    ? agents.find((a) => a.id === agent)?.full_name ?? "Agent"
                    : "All agents"}
                </span>
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="overflow-hidden rounded-[14px] border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Agenda</h2>
              <p className="text-xs text-muted-foreground">
                {listItems.length} item{listItems.length === 1 ? "" : "s"}
                {selectedDay ? ` · ${format(parseISO(selectedDay), "EEE d MMM")}` : " this week"}
              </p>
            </div>
            {selectedDay ? (
              <Button size="sm" variant="ghost" onClick={() => setSelectedDay(null)}>
                Clear day
              </Button>
            ) : null}
          </div>

          <div className="max-h-[70vh] space-y-2 overflow-y-auto p-3">
            {listItems.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                Nothing scheduled for this filter.
              </p>
            ) : (
              listItems.map((item) => {
                const colors = item.kind === "follow_up" ? FOLLOW_UP_COLOR : VIEWING_COLOR;
                return (
                  <article
                    key={item.id}
                    className={cn(
                      "rounded-[12px] border px-3 py-2.5",
                      colors.bg,
                      colors.border,
                      item.overdue && "ring-1 ring-destructive/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide",
                              colors.soft
                            )}
                          >
                            {item.kind === "follow_up" ? (
                              <Bell className="h-3 w-3" />
                            ) : (
                              <Calendar className="h-3 w-3" />
                            )}
                            {item.kind === "follow_up" ? "Follow-up" : "Viewing"}
                          </span>
                          {item.overdue ? (
                            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[0.65rem] font-semibold text-destructive">
                              Overdue
                            </span>
                          ) : null}
                        </div>
                        <Link
                          href={item.href}
                          className={cn("block truncate text-sm font-semibold hover:underline", colors.text)}
                        >
                          {format(new Date(item.at), "EEE HH:mm")} · {item.title}
                        </Link>
                        {item.subtitle ? (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.subtitle}</p>
                        ) : null}
                        <p className="mt-0.5 text-[0.7rem] text-muted-foreground" title={formatDateTime(item.at)}>
                          {shortTimeAgo(item.at)}
                          {item.agentName ? ` · ${item.agentName}` : ""}
                        </p>
                      </div>
                    </div>

                    {canEdit && item.kind === "follow_up" ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.phone && telLink(item.phone) ? (
                          <a
                            href={telLink(item.phone)!}
                            className="inline-flex h-7 items-center gap-1 rounded-md border border-amber-300 bg-white px-2 text-[0.7rem] font-medium text-amber-900"
                          >
                            <Phone className="h-3 w-3" /> Call
                          </a>
                        ) : null}
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleComplete(item.lead.id)}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-amber-300 bg-white px-2 text-[0.7rem] font-medium text-amber-900"
                        >
                          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Done
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleSnooze(item.lead.id, 1)}
                          className="inline-flex h-7 items-center rounded-md border border-amber-300 bg-white px-2 text-[0.7rem] font-medium text-amber-900"
                        >
                          +1d
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleSnooze(item.lead.id, 3)}
                          className="inline-flex h-7 items-center rounded-md border border-amber-300 bg-white px-2 text-[0.7rem] font-medium text-amber-900"
                        >
                          +3d
                        </button>
                      </div>
                    ) : null}

                    {canEdit && item.kind === "viewing" && item.status === "scheduled" ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {VIEWING_OUTCOMES.slice(0, 2).map((outcome) => (
                          <button
                            key={outcome.value}
                            type="button"
                            disabled={pending}
                            className="inline-flex h-7 items-center rounded-md border border-violet-300 bg-white px-2 text-[0.7rem] font-medium text-violet-900"
                            onClick={() => handleOutcome(item.viewing.id, "completed", outcome.value)}
                          >
                            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : outcome.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[14px] border border-border bg-card p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-foreground">Calendar</h2>
            <p className="text-xs text-muted-foreground">
              {weekItems.filter((i) => kindFilter === "all" || i.kind === kindFilter).length} this week
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
            {byDay.map(({ day, rows }) => {
              const isToday = isSameDay(day, new Date());
              const dayKey = format(day, "yyyy-MM-dd");
              const isSelected = selectedDay === dayKey;
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDay(isSelected ? null : dayKey)}
                  className={cn(
                    "min-h-[140px] rounded-[12px] border p-2.5 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : isToday
                        ? "border-primary/40 bg-card"
                        : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {format(day, "EEE")}
                  </p>
                  <p className={cn("mb-2 text-lg font-semibold", isToday && "text-primary")}>
                    {format(day, "d")}
                  </p>
                  <div className="space-y-1.5">
                    {rows.length === 0 ? (
                      <p className="text-[0.7rem] text-muted-foreground">—</p>
                    ) : (
                      rows.slice(0, 5).map((item) => {
                        const colors = item.kind === "follow_up" ? FOLLOW_UP_COLOR : VIEWING_COLOR;
                        return (
                          <div
                            key={item.id}
                            className={cn(
                              "rounded-md border px-1.5 py-1 text-[0.68rem] leading-snug",
                              colors.bg,
                              colors.border,
                              colors.text
                            )}
                          >
                            <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle", colors.dot)} />
                            {format(new Date(item.at), "HH:mm")} {item.title}
                          </div>
                        );
                      })
                    )}
                    {rows.length > 5 ? (
                      <p className="text-[0.65rem] font-medium text-muted-foreground">
                        +{rows.length - 5} more
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
