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
  Users,
  CalendarClock,
  LayoutGrid,
  List,
  ChevronDown,
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

const GROUP_CONFIG: Record<TimeGroup, { label: string; color: string; border: string; bg: string; badge: string; grad: string }> = {
  overdue: { label: "Overdue", color: "text-red-700", border: "border-red-200/60", bg: "bg-white", badge: "bg-red-500", grad: "from-red-50 to-transparent" },
  today: { label: "Today", color: "text-amber-700", border: "border-amber-200/60", bg: "bg-white", badge: "bg-amber-500", grad: "from-amber-50 to-transparent" },
  tomorrow: { label: "Tomorrow", color: "text-blue-700", border: "border-blue-200/60", bg: "bg-white", badge: "bg-blue-500", grad: "from-blue-50 to-transparent" },
  this_week: { label: "This Week", color: "text-slate-700", border: "border-slate-200/60", bg: "bg-white", badge: "bg-slate-400", grad: "from-slate-50 to-transparent" },
  later: { label: "Later", color: "text-slate-500", border: "border-slate-200/60", bg: "bg-white", badge: "bg-slate-300", grad: "from-slate-50 to-transparent" },
};

const GROUP_ORDER: TimeGroup[] = ["overdue", "today", "tomorrow", "this_week", "later"];

const STAGE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  green: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  slate: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  gray: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
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
      onClick={() => onSort(field)}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium transition-colors",
        isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
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
  const router = useRouter();
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

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q)
      );
    }

    // Stage filter
    if (stageFilter) {
      result = result.filter((l) => l.stage_id === stageFilter);
    }

    // Agent filter
    if (agentFilter) {
      result = result.filter((l) => l.assigned_to === agentFilter);
    }

    // Time group filter
    if (groupFilter) {
      result = result.filter((l) => l.next_follow_up_at && getTimeGroup(l.next_follow_up_at) === groupFilter);
    }

    // Sort
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

  // Group leads by time
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

  // Stats
  const stats = useMemo(() => {
    const counts: Record<TimeGroup, number> = { overdue: 0, today: 0, tomorrow: 0, this_week: 0, later: 0 };
    for (const lead of leads) {
      if (!lead.next_follow_up_at) continue;
      counts[getTimeGroup(lead.next_follow_up_at)]++;
    }
    return counts;
  }, [leads]);

  const hasActiveFilters = stageFilter || agentFilter || groupFilter || search.trim();
  const clearFilters = () => {
    setStageFilter(null);
    setAgentFilter(null);
    setGroupFilter(null);
    setSearch("");
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {GROUP_ORDER.map((group) => {
          const cfg = GROUP_CONFIG[group];
          const count = stats[group];
          return (
            <button
              key={group}
              onClick={() => setGroupFilter(groupFilter === group ? null : group)}
              className={cn(
                "relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-gradient-to-br",
                cfg.border,
                cfg.bg,
                cfg.grad,
                groupFilter === group ? "ring-2 ring-emerald-500 shadow-md scale-[1.02]" : "shadow-sm"
              )}
            >
              <div className="relative z-10 flex items-center justify-between mb-2">
                <span className={cn("text-sm font-bold uppercase tracking-wider", cfg.color)}>{cfg.label}</span>
                <span className={cn("h-2.5 w-2.5 rounded-full shadow-sm", cfg.badge)} />
              </div>
              <p className="relative z-10 text-2xl font-bold text-slate-900">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-2 rounded-xl border border-slate-200/60 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-9 text-xs text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-200 p-1 text-slate-500 hover:bg-slate-300 hover:text-slate-700 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs text-sm font-bold transition-colors shadow-sm",
              hasActiveFilters
                ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <ArrowUpDown className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px]">
                {[stageFilter, agentFilter, groupFilter, search.trim()].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* View mode toggle */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-50/50 p-1 shadow-inner">
            <button
              onClick={() => setViewMode("grouped")}
              className={cn(
                "rounded-lg px-3 py-1.5 transition-all duration-200",
                viewMode === "grouped" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-700 font-medium"
              )}
              title="Grouped view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "rounded-lg px-3 py-1.5 transition-all duration-200",
                viewMode === "table" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-700 font-medium"
              )}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Stage filter */}
          <div className="flex items-center gap-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Stage</label>
            <select
              value={stageFilter ?? ""}
              onChange={(e) => setStageFilter(e.target.value || null)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-3 pr-8 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">All stages</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Agent filter */}
          {userRole !== "agent" && agents.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Agent</label>
              <select
                value={agentFilter ?? ""}
                onChange={(e) => setAgentFilter(e.target.value || null)}
                className="rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-3 pr-8 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">All agents</option>
                <option value="unassigned">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time group filter */}
          <div className="flex items-center gap-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">When</label>
            <select
              value={groupFilter ?? ""}
              onChange={(e) => setGroupFilter((e.target.value as TimeGroup) || null)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-3 pr-8 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">All time</option>
              {GROUP_ORDER.map((g) => (
                <option key={g} value={g}>
                  {GROUP_CONFIG[g].label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors ml-auto"
            >
              <X className="h-3.5 w-3.5" />
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-900">{filteredLeads.length}</span> follow-up{filteredLeads.length !== 1 ? "s" : ""}
          {hasActiveFilters && " (filtered)"}
        </p>
      </div>

      {/* Content */}
      {filteredLeads.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
          <CalendarClock className="h-10 w-10 opacity-40" />
          <p className="text-sm">
            {hasActiveFilters
              ? "No follow-ups match your filters."
              : "No follow-ups scheduled. Set follow-up dates on your leads to see them here."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm font-medium text-slate-600 underline hover:text-slate-900"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : viewMode === "grouped" ? (
        <div className="space-y-5">
          {GROUP_ORDER.map((group) => {
            const items = groupedLeads[group];
            if (items.length === 0) return null;
            const cfg = GROUP_CONFIG[group];
            return (
              <div key={group} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <h2 className={cn("text-base font-bold", cfg.color)}>{cfg.label}</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500 shadow-sm border border-slate-200/60">
                    {items.length}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((lead) => (
                    <FollowUpCard key={lead.id} lead={lead} group={group} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/60 shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200/80 bg-slate-50/50">
                <tr className="text-left text-xs font-bold uppercase tracking-widest text-slate-500">
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
                    <SortButton field="last_activity_at" label="Last Activity" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3">
                    <SortButton field="next_follow_up_at" label="Follow-up" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => {
                  const group = lead.next_follow_up_at ? getTimeGroup(lead.next_follow_up_at) : "later";
                  const cfg = GROUP_CONFIG[group];
                  const stageColor = lead.stage ? getStageColor(lead.stage.color) : null;
                  return (
                    <tr key={lead.id} className="group transition-colors hover:bg-slate-50/80">
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors"
                        >
                          {lead.name}
                        </Link>
                        {lead.interest && (
                          <span className="ml-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{lead.interest}</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-2.5 md:table-cell">
                        {lead.stage && stageColor && (
                          <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset border border-transparent", stageColor.bg, stageColor.text)}>
                            {lead.stage.name}
                          </span>
                        )}
                      </td>
                      <td className="hidden px-4 py-2.5 lg:table-cell">
                        {lead.assigned_to_profile ? (
                          <div className="flex items-center gap-2">
                             {lead.assigned_to_profile.avatar_url ? (
                               <img src={lead.assigned_to_profile.avatar_url} className="w-6 h-6 rounded-full object-cover" />
                             ) : (
                               <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                                 <UserIcon className="h-3 w-3 text-slate-500" />
                               </div>
                             )}
                            <span className="text-sm font-medium text-slate-700">{lead.assigned_to_profile.full_name}</span>
                          </div>
                        ) : (
                          <span className="text-xs italic text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-2.5 lg:table-cell text-xs font-medium text-slate-500">
                        {timeAgo(lead.last_activity_at ?? lead.updated_at)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold", cfg.color)}>
                          {group === "overdue" && <AlertCircle className="h-3.5 w-3.5" />}
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(lead.next_follow_up_at, "dd MMM, HH:mm")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-3">
                          {lead.phone && (
                            <>
                              <a
                                href={telLink(lead.phone) ?? "#"}
                                onClick={(e) => e.stopPropagation()}
                                className="text-slate-400 transition-colors hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 p-1.5 rounded-lg"
                                title="Call"
                              >
                                <Phone className="h-4 w-4" />
                              </a>
                              <a
                                href={whatsappLink(lead.phone) ?? "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-emerald-500 transition-colors hover:text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100 p-1.5 rounded-lg"
                                title="WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            </>
                          )}
                          <Link
                            href={`/leads/${lead.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-bold text-slate-500 transition-colors hover:text-slate-900 bg-slate-50 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
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
  const cfg = GROUP_CONFIG[group];
  const stageColor = lead.stage ? getStageColor(lead.stage.color) : null;
  const [pending, setPending] = useState<null | "done" | "snooze">(null);
  const [note, setNote] = useState("");

  async function handleDone() {
    setPending("done");
    const result = await completeFollowUp(lead.id, note || undefined);
    if (result.ok) {
      toast.success("Follow-up completed");
      window.location.reload();
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
      window.location.reload();
    } else {
      toast.error(result.error ?? "Failed to snooze follow-up");
    }
    setPending(null);
  }

  return (
    <div
      className={cn(
        "group flex flex-col gap-3 rounded-xl border p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
        cfg.border,
        "bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href={`/leads/${lead.id}`} className="text-[15px] font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
            {lead.name}
          </Link>
          <div className="mt-1 flex items-center gap-2">
            {lead.interest && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/60">{lead.interest}</span>
            )}
            {lead.stage && stageColor && (
              <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ring-inset", stageColor.bg, stageColor.text, "border-transparent")}>
                {lead.stage.name}
              </span>
            )}
          </div>
        </div>
        {group === "overdue" && (
          <div className="bg-red-50 p-1.5 rounded-full ring-1 ring-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {lead.assigned_to_profile ? (
          <div className="flex items-center gap-2 mt-1 mb-1 text-xs text-slate-500 truncate">
             {lead.assigned_to_profile.avatar_url ? (
               <img src={lead.assigned_to_profile.avatar_url} className="w-5 h-5 rounded-full object-cover" />
             ) : (
               <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                 <UserIcon className="h-3 w-3 text-slate-400" />
               </div>
             )}
            <span className="font-medium text-slate-700">{lead.assigned_to_profile.full_name}</span>
          </div>
        ) : (
          <span className="text-xs italic text-slate-400 mt-1 mb-1">Unassigned</span>
        )}
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-3 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <span className={cn("flex items-center gap-1.5 text-xs font-bold", cfg.color)}>
            <Clock className="h-4 w-4" />
            {formatDate(lead.next_follow_up_at, "dd MMM, HH:mm")}
          </span>
          <div className="flex items-center gap-1.5">
            {lead.phone && (
              <>
                <a
                  href={telLink(lead.phone) ?? "#"}
                  onClick={(e) => e.stopPropagation()}
                  className="text-slate-400 transition-colors hover:text-slate-700 bg-slate-50 p-1.5 rounded-md hover:bg-slate-200"
                  title="Call"
                >
                  <Phone className="h-3.5 w-3.5" />
                </a>
                <a
                  href={whatsappLink(lead.phone) ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-emerald-500 transition-colors hover:text-emerald-700 bg-emerald-50 p-1.5 rounded-md hover:bg-emerald-100"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </a>
              </>
            )}
          </div>
        </div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="Quick note before action..."
          className="w-full rounded-lg border border-slate-200/60 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-colors mt-auto"
        />

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleDone();
            }}
            disabled={pending !== null}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-2 text-[11px] font-bold text-white transition-all hover:shadow-md disabled:opacity-50"
          >
            {pending === "done" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            DONE
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleSnooze(2);
            }}
            disabled={pending !== null}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200/60 bg-amber-50 hover:bg-amber-100 px-3 py-2 text-[11px] font-bold text-amber-700 transition-all hover:shadow-sm disabled:opacity-50"
          >
            {pending === "snooze" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
            SNOOZE
          </button>
        </div>
      </div>
    </div>
  );
}
