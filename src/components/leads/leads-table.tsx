"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { whatsappLink } from "@/lib/phone";
import { formatAEDRange } from "@/lib/money";
import { canManageCrm } from "@/lib/permissions";
import { formatDate } from "@/lib/dates";
import { firstResponseClock } from "@/lib/lead-sla";
import { bulkAssignLeads } from "@/server/leads";
import { optionLabel, scoreBandForValue, type LeadFieldOption } from "@/lib/lead-field-options";
import { toast } from "sonner";
import { MessageCircle, Loader2, UserCog, Search } from "lucide-react";
import { FilterBar } from "@/components/primitives/filter-bar";

export type LeadRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  interest: string;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  score: number | null;
  next_follow_up_at: string | null;
  assigned_to: string | null;
  assigned_to_profile: { id: string; full_name: string; avatar_url: string | null } | null;
  created_at: string;
  stage_id: string | null;
  first_response_due_at?: string | null;
  first_responded_at?: string | null;
  first_response_minutes?: number | null;
};

export function LeadsTable({
  leads,
  agents,
  stages,
  currentFilters,
  userRole,
  fieldOptions,
  totalCount = 0,
  page = 1,
  pageSize = 50,
}: {
  leads: LeadRow[];
  agents: { id: string; full_name: string; role: string }[];
  stages?: { id: string; name: string; color: string }[];
  currentFilters: { source?: string; assigned?: string; q?: string; stage?: string; page?: string };
  userRole: string;
  fieldOptions: Record<string, LeadFieldOption[]>;
  totalCount?: number;
  page?: number;
  pageSize?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAgent, setBulkAgent] = useState("");
  const [pending, startTransition] = useTransition();

  const canBulkAssign = canManageCrm(userRole);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(currentFilters)) {
      if (!value || key === "page") continue;
      params.set(key, value);
    }
    params.set("view", "list");
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/leads?${params.toString()}`;
  }

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    params.set("view", "list");
    router.push(`/leads?${params.toString()}`);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)));
    }
  }

  function handleBulkAssign() {
    if (!bulkAgent || selectedIds.size === 0) return;
    startTransition(async () => {
      const agentId = bulkAgent === "unassigned" ? null : bulkAgent;
      const result = await bulkAssignLeads([...selectedIds], agentId);
      if (result.ok) {
        toast.success(`${result.data?.assigned ?? 0} leads ${agentId ? "assigned" : "unassigned"}`);
        setSelectedIds(new Set());
        setBulkAgent("");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <FilterBar>
        {stages && stages.length > 0 && (
          <Select
            value={currentFilters.stage ?? "all"}
            onValueChange={(v) => updateFilter("stage", v ?? "all")}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All Stages</SelectItem>
              {stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={currentFilters.source ?? "all"}
          onValueChange={(v) => updateFilter("source", v ?? "all")}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="all">All Sources</SelectItem>
            {(fieldOptions.source ?? []).map((row) => (
              <SelectItem key={row.value} value={row.value}>
                {row.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {userRole !== "agent" && (
          <Select
            value={currentFilters.assigned ?? "all"}
            onValueChange={(v) => updateFilter("assigned", v ?? "all")}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Assigned" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All Agents</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FilterBar>

      {/* Bulk assign bar */}
      {canBulkAssign && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/10 p-3 px-5">
          <span className="rounded-lg bg-card px-3 py-1 text-sm font-medium text-foreground">
            {selectedIds.size} selected
          </span>
          <Select value={bulkAgent} onValueChange={(v) => setBulkAgent(v ?? "")}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Assign to agent..." />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.full_name} ({a.role})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBulkAssign} disabled={pending || !bulkAgent} className="h-9 px-4">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCog className="mr-2 h-4 w-4" />}
            Assign Selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="h-9">
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground">
                {canBulkAssign && (
                  <th className="px-5 py-2.5 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === leads.length && leads.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-border text-primary"
                    />
                  </th>
                )}
                <th className="px-5 py-2.5">Name</th>
                <th className="px-5 py-2.5">Phone</th>
                <th className="px-5 py-2.5">Source</th>
                <th className="px-5 py-2.5">Interest</th>
                <th className="px-5 py-2.5">Budget</th>
                <th className="px-5 py-2.5">Stage</th>
                <th className="px-5 py-2.5">Score</th>
                <th className="px-5 py-2.5">Agent</th>
                <th className="px-5 py-2.5">Follow-up</th>
              </tr>
            </thead>
              <tbody className="divide-y divide-slate-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={canBulkAssign ? 10 : 9} className="px-5 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-8 w-8 text-slate-300 mb-3" />
                      <p className="font-medium text-slate-600">No leads found</p>
                      <p className="text-sm mt-1">Try adjusting your filters or create a new lead.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const waLink = whatsappLink(lead.phone);
                  const isSelected = selectedIds.has(lead.id);
                  const stage = stages?.find((row) => row.id === lead.stage_id);
                  const band = scoreBandForValue(fieldOptions.score, lead.score);
                  const clock = firstResponseClock(lead);
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-muted/50 transition-colors group ${isSelected ? "bg-primary/5" : ""}`}
                    >
                      {canBulkAssign && (
                        <td className="px-5 py-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(lead.id)}
                            className="h-4 w-4 rounded border-border text-primary"
                          />
                        </td>
                      )}
                      <td className="px-5 py-2 font-semibold text-slate-900">
                        <Link href={`/leads/${lead.id}`} className="hover:text-primary group-hover:underline underline-offset-4">
                          {lead.name}
                        </Link>
                        {clock ? (
                          <span
                            title={clock.title}
                            className={`ml-2 inline-block h-2 w-2 rounded-full align-middle ${
                              clock.tone === "overdue" ? "bg-red-600" : "bg-amber-500"
                            }`}
                          />
                        ) : null}
                      </td>
                      <td className="px-5 py-2">
                        {lead.phone ? (
                          <a
                            href={waLink ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-medium text-foreground hover:bg-muted/80"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {lead.phone}
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-2 text-slate-600 font-medium">
                        {optionLabel(fieldOptions.source, lead.source)}
                      </td>
                      <td className="px-5 py-2">
                        <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                          {optionLabel(fieldOptions.interest, lead.interest)}
                        </span>
                      </td>
                      <td className="px-5 py-2 text-slate-600">
                        {formatAEDRange(lead.budget_min, lead.budget_max) ?? "—"}
                      </td>
                      <td className="px-5 py-2">
                        <Link href={`/leads/${lead.id}`}>
                          <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                            {stage?.name ?? "—"}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-2">
                        {lead.score !== null ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                            {lead.score}
                            {band ? <span className="text-muted-foreground">· {band.label}</span> : null}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-2 text-slate-600">
                        {lead.assigned_to_profile?.full_name ? (
                          <span className="font-medium text-slate-700">{lead.assigned_to_profile.full_name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-slate-500 font-medium" suppressHydrationWarning>
                        {lead.next_follow_up_at ? formatDate(lead.next_follow_up_at) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalCount > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)}
            </span>{" "}
            of <span className="font-medium text-foreground">{totalCount}</span>
            <span className="text-muted-foreground"> · page {page} of {totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
              >
                Previous
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
            )}
            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
                className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
              >
                Next
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
