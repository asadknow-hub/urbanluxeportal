"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Phone,
  MessageCircle,
  Clock,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  List,
  X,
  User as UserIcon,
  Check,
  Bell,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { whatsappLink, telLink } from "@/lib/phone";
import { formatDate, timeAgo } from "@/lib/dates";
import { completeFollowUp, snoozeFollowUp } from "@/server/leads";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/primitives/empty-state";

export type FollowUpLead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  interest: string | null;
  next_follow_up_at: string | null;
  last_activity_at: string | null;
  updated_at: string;
  stage_id: string | null;
  assigned_to: string | null;
  assigned_to_profile: { id: string; full_name: string; avatar_url: string | null } | null;
  stage: { id: string; name: string; color: string; kind: string } | null;
};

export type FollowUpStage = {
  id: string;
  name: string;
  color: string;
  kind: string;
};

export type FollowUpAgent = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

type SortField = "next_follow_up_at" | "name" | "stage" | "assigned_to" | "last_activity_at";
type SortDir = "asc" | "desc";
type ViewMode = "grouped" | "table";
type TimeGroup = "overdue" | "today" | "tomorrow" | "this_week" | "later";

const GROUP_CONFIG: Record<TimeGroup, { label: string; tone: string; dot: string }> = {
  overdue: { label: "Overdue", tone: "text-destructive", dot: "bg-destructive" },
  today: { label: "Today", tone: "text-foreground", dot: "bg-primary" },
  tomorrow: { label: "Tomorrow", tone: "text-foreground", dot: "bg-secondary" },
  this_week: { label: "This week", tone: "text-muted-foreground", dot: "bg-muted-foreground" },
  later: { label: "Later", tone: "text-muted-foreground", dot: "bg-border" },
};

const GROUP_ORDER: TimeGroup[] = ["overdue", "today", "tomorrow", "this_week", "later"];

const STAGE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  green: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  slate: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  gray: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  amber: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500" },
  red: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

function getStageColor(color: string) {
  return STAGE_COLORS[color] ?? STAGE_COLORS.blue;
}

function getTimeGroup(dateStr: string): TimeGroup {
  const now = new Date();
  const date = new Date(dateStr);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  const weekEnd = new Date(todayEnd);
  weekEnd.setDate(weekEnd.getDate() + 7);

  if (date < now) return "overdue";
  if (date <= todayEnd) return "today";
  if (date <= tomorrowEnd) return "tomorrow";
  if (date <= weekEnd) return "this_week";
  return "later";
}

function SortButton({
  field,
  label,
  sortField,
  sortDir,
  onSort,
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
}) {
  const isActive = sortField === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1 text-xs font-medium transition-colors duration-200",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {isActive ? (
        sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}

export function FollowUpsView({
  leads,
  stages,
  agents,
  userRole,
}: {
  leads: FollowUpLead[];
  stages: FollowUpStage[];
  agents: FollowUpAgent[];
  userRole: string;
}) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("next_follow_up_at");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [agentFilter, setAgentFilter] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<TimeGroup | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return field;
    });
  }, []);

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (lead) =>
          lead.name.toLowerCase().includes(q) ||
          lead.phone?.toLowerCase().includes(q) ||
          lead.email?.toLowerCase().includes(q)
      );
    }

    if (stageFilter) {
      result = result.filter((lead) => lead.stage_id === stageFilter);
    }

    if (agentFilter === "unassigned") {
      result = result.filter((lead) => !lead.assigned_to);
    } else if (agentFilter) {
      result = result.filter((lead) => lead.assigned_to === agentFilter);
    }

    if (groupFilter) {
      result = result.filter((lead) => lead.next_follow_up_at && getTimeGroup(lead.next_follow_up_at) === groupFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "stage":
          cmp = (a.stage?.name ?? "").localeCompare(b.stage?.name ?? "");
          break;
        case "assigned_to":
          cmp = (a.assigned_to_profile?.full_name ?? "ZZZ").localeCompare(b.assigned_to_profile?.full_name ?? "ZZZ");
          break;
        case "last_activity_at":
          cmp = new Date(a.last_activity_at ?? a.updated_at).getTime() - new Date(b.last_activity_at ?? b.updated_at).getTime();
          break;
        case "next_follow_up_at":
        default:
          cmp = new Date(a.next_follow_up_at ?? 0).getTime() - new Date(b.next_follow_up_at ?? 0).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [leads, search, stageFilter, agentFilter, groupFilter, sortField, sortDir]);

  const groupedLeads = useMemo(() => {
    const map: Record<TimeGroup, FollowUpLead[]> = {
      overdue: [],
      today: [],
      tomorrow: [],
      this_week: [],
      later: [],
    };
    for (const lead of filteredLeads) {
      if (!lead.next_follow_up_at) continue;
      map[getTimeGroup(lead.next_follow_up_at)].push(lead);
    }
    return map;
  }, [filteredLeads]);

  const stats = useMemo(() => {
    const counts: Record<TimeGroup, number> = { overdue: 0, today: 0, tomorrow: 0, this_week: 0, later: 0 };
    for (const lead of leads) {
      if (!lead.next_follow_up_at) continue;
      counts[getTimeGroup(lead.next_follow_up_at)] += 1;
    }
    return counts;
  }, [leads]);

  const hasActiveFilters = Boolean(stageFilter || agentFilter || groupFilter || search.trim());
  const filterCount = [stageFilter, agentFilter, groupFilter, search.trim()].filter(Boolean).length;
  const clearFilters = () => {
    setStageFilter(null);
    setAgentFilter(null);
    setGroupFilter(null);
    setSearch("");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {GROUP_ORDER.map((group) => {
          const cfg = GROUP_CONFIG[group];
          const count = stats[group];
          const active = groupFilter === group;
          return (
            <button
              key={group}
              type="button"
              onClick={() => setGroupFilter(active ? null : group)}
              className={cn(
                "overflow-hidden rounded-[14px] border bg-card p-4 text-left transition-colors duration-200",
                "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                active ? "border-primary" : "border-border hover:border-primary/40"
              )}
            >
              <div className="-mx-4 -mt-4 mb-3 h-0.5 bg-primary" />
              <div className="flex items-center justify-between">
                <span className={cn("text-sm font-medium", cfg.tone)}>{cfg.label}</span>
                <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
              </div>
              <p
                className="mt-2 font-heading text-[26px] leading-none text-foreground"
                style={{ fontFamily: "var(--font-display), serif" }}
              >
                {count}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-card p-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Filter this list"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-[10px] border border-border bg-muted/40 py-2 pr-9 pl-9 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear filter"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors duration-200",
              hasActiveFilters
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted"
            )}
          >
            Filters
            {hasActiveFilters ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-background/20 px-1.5 text-xs">
                {filterCount}
              </span>
            ) : null}
          </button>

          <div className="flex h-9 rounded-lg border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grouped")}
              className={cn(
                "inline-flex cursor-pointer items-center rounded-md px-2.5 transition-colors duration-200",
                viewMode === "grouped" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="Grouped view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "inline-flex cursor-pointer items-center rounded-md px-2.5 transition-colors duration-200",
                viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showFilters ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-border bg-card p-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Stage
            <select
              value={stageFilter ?? ""}
              onChange={(e) => setStageFilter(e.target.value || null)}
              className="h-9 cursor-pointer rounded-[10px] border border-border bg-muted/40 px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="">All stages</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </label>

          {userRole !== "agent" && agents.length > 0 ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Agent
              <select
                value={agentFilter ?? ""}
                onChange={(e) => setAgentFilter(e.target.value || null)}
                className="h-9 cursor-pointer rounded-[10px] border border-border bg-muted/40 px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="">All agents</option>
                <option value="unassigned">Unassigned</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.full_name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            When
            <select
              value={groupFilter ?? ""}
              onChange={(e) => setGroupFilter((e.target.value as TimeGroup) || null)}
              className="h-9 cursor-pointer rounded-[10px] border border-border bg-muted/40 px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="">All time</option>
              {GROUP_ORDER.map((group) => (
                <option key={group} value={group}>
                  {GROUP_CONFIG[group].label}
                </option>
              ))}
            </select>
          </label>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground tabular-nums">{filteredLeads.length}</span>
        {" "}follow-up{filteredLeads.length === 1 ? "" : "s"}
        {hasActiveFilters ? " (filtered)" : ""}
      </p>

      {filteredLeads.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "No follow-ups match these filters" : "No follow-ups scheduled"}
          description={
            hasActiveFilters
              ? undefined
              : "Set a follow-up date on a lead to see it here."
          }
          action={
            hasActiveFilters ? (
              <Button type="button" variant="outline" className="cursor-pointer" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Link href="/leads" className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted">
                Open leads
              </Link>
            )
          }
        />
      ) : viewMode === "grouped" ? (
        <div className="space-y-5">
          {GROUP_ORDER.map((group) => {
            const items = groupedLeads[group];
            if (items.length === 0) return null;
            const cfg = GROUP_CONFIG[group];
            return (
              <div key={group} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <h2 className={cn("text-sm font-semibold", cfg.tone)}>{cfg.label}</h2>
                  <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((lead) => (
                    <FollowUpCard key={lead.id} lead={lead} group={group} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr className="text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">
                    <SortButton field="name" label="Lead" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="hidden px-4 py-3 md:table-cell">
                    <SortButton field="stage" label="Stage" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="hidden px-4 py-3 lg:table-cell">
                    <SortButton field="assigned_to" label="Agent" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="hidden px-4 py-3 lg:table-cell">
                    <SortButton field="last_activity_at" label="Last activity" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3">
                    <SortButton field="next_follow_up_at" label="Follow-up" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads.map((lead) => {
                  const group = lead.next_follow_up_at ? getTimeGroup(lead.next_follow_up_at) : "later";
                  const cfg = GROUP_CONFIG[group];
                  const stageColor = lead.stage ? getStageColor(lead.stage.color) : null;
                  return (
                    <tr key={lead.id} className="transition-colors duration-200 hover:bg-muted/40">
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {lead.name}
                        </Link>
                        {lead.interest ? (
                          <span className="ml-2 inline-flex rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
                            {lead.interest.replace(/_/g, " ")}
                          </span>
                        ) : null}
                      </td>
                      <td className="hidden px-4 py-2.5 md:table-cell">
                        {lead.stage && stageColor ? (
                          <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium", stageColor.bg, stageColor.text)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", stageColor.dot)} />
                            {lead.stage.name}
                          </span>
                        ) : null}
                      </td>
                      <td className="hidden px-4 py-2.5 lg:table-cell">
                        {lead.assigned_to_profile ? (
                          <div className="flex items-center gap-2">
                            {lead.assigned_to_profile.avatar_url ? (
                              <img
                                src={lead.assigned_to_profile.avatar_url}
                                alt=""
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                                <UserIcon className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                            <span className="text-sm text-foreground">{lead.assigned_to_profile.full_name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-2.5 text-xs text-muted-foreground lg:table-cell">
                        {timeAgo(lead.last_activity_at ?? lead.updated_at)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", cfg.tone)}>
                          {group === "overdue" ? <AlertCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                          {formatDate(lead.next_follow_up_at, "dd MMM, HH:mm")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.phone ? (
                            <>
                              <a
                                href={telLink(lead.phone) ?? "#"}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                title="Call"
                              >
                                <Phone className="h-4 w-4" />
                              </a>
                              <a
                                href={whatsappLink(lead.phone) ?? "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                title="WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            </>
                          ) : null}
                          <Link
                            href={`/leads/${lead.id}`}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function FollowUpCard({ lead, group }: { lead: FollowUpLead; group: TimeGroup }) {
  const router = useRouter();
  const cfg = GROUP_CONFIG[group];
  const stageColor = lead.stage ? getStageColor(lead.stage.color) : null;
  const [pending, setPending] = useState<null | "done" | "snooze">(null);
  const [note, setNote] = useState("");

  async function handleDone() {
    setPending("done");
    const result = await completeFollowUp(lead.id, note || undefined);
    if (result.ok) {
      toast.success("Follow-up completed");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to complete follow-up");
    }
    setPending(null);
  }

  async function handleSnooze(hours: number) {
    setPending("snooze");
    const next = new Date();
    next.setHours(next.getHours() + hours);
    const result = await snoozeFollowUp(lead.id, next.toISOString(), note || undefined);
    if (result.ok) {
      toast.success(`Snoozed for ${hours}h`);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to snooze follow-up");
    }
    setPending(null);
  }

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href={`/leads/${lead.id}`} className="line-clamp-1 text-[15px] font-semibold tracking-tight text-foreground hover:text-primary">
            {lead.name}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {lead.interest ? (
              <span className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
                {lead.interest.replace(/_/g, " ")}
              </span>
            ) : null}
            {lead.stage && stageColor ? (
              <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium", stageColor.bg, stageColor.text)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", stageColor.dot)} />
                {lead.stage.name}
              </span>
            ) : null}
          </div>
        </div>
        {group === "overdue" ? (
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
        ) : null}
      </div>

      {lead.assigned_to_profile ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {lead.assigned_to_profile.avatar_url ? (
            <img src={lead.assigned_to_profile.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
              <UserIcon className="h-3 w-3" />
            </span>
          )}
          <span className="truncate text-foreground">{lead.assigned_to_profile.full_name}</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">Unassigned</span>
      )}

      <div className="mt-auto flex flex-col gap-3 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", cfg.tone)}>
            <Clock className="h-4 w-4" />
            {formatDate(lead.next_follow_up_at, "dd MMM, HH:mm")}
          </span>
          <div className="flex items-center gap-1">
            {lead.phone ? (
              <>
                <a
                  href={telLink(lead.phone) ?? "#"}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Call"
                >
                  <Phone className="h-3.5 w-3.5" />
                </a>
                <a
                  href={whatsappLink(lead.phone) ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </a>
              </>
            ) : null}
          </div>
        </div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note before action"
          className="h-9 w-full rounded-[10px] border border-border bg-muted/40 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            className="h-9 flex-1 cursor-pointer"
            disabled={pending !== null}
            onClick={() => void handleDone()}
          >
            {pending === "done" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
            Done
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 flex-1 cursor-pointer"
            disabled={pending !== null}
            onClick={() => void handleSnooze(2)}
          >
            {pending === "snooze" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Bell className="mr-1.5 h-3.5 w-3.5" />}
            Snooze 2h
          </Button>
        </div>
      </div>
    </div>
  );
}
