"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStatusColor } from "@/lib/status-colors";
import { whatsappLink } from "@/lib/phone";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { bulkAssignLeads } from "@/server/leads";
import { toast } from "sonner";
import { MessageCircle, Search, Loader2, UserCog } from "lucide-react";

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
};

const SOURCE_LABELS: Record<string, string> = {
  website: "Website",
  bayut: "Bayut",
  property_finder: "Property Finder",
  dubizzle: "Dubizzle",
  referral: "Referral",
  walk_in: "Walk-in",
  social: "Social",
  other: "Other",
};

const INTEREST_LABELS: Record<string, string> = {
  buy: "Buy",
  rent: "Rent",
  sell: "Sell",
  off_plan: "Off Plan",
  commercial: "Commercial",
};

export function LeadsTable({
  leads,
  agents,
  stages,
  currentFilters,
  userRole,
}: {
  leads: LeadRow[];
  agents: { id: string; full_name: string; role: string }[];
  stages?: { id: string; name: string; color: string }[];
  currentFilters: { status?: string; source?: string; assigned?: string; q?: string; stage?: string };
  userRole: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentFilters.q ?? "");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAgent, setBulkAgent] = useState("");
  const [pending, startTransition] = useTransition();

  const canBulkAssign = userRole === "admin" || userRole === "manager";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("view", "list");
    router.push(`/leads?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("q", searchValue);
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
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search name, phone, email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-64 pl-9"
          />
        </form>

        <Select
          value={currentFilters.status ?? "all"}
          onValueChange={(v) => updateFilter("status", v ?? "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="unqualified">Unqualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>

        {stages && stages.length > 0 && (
          <Select
            value={currentFilters.stage ?? "all"}
            onValueChange={(v) => updateFilter("stage", v ?? "all")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
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
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {Object.entries(SOURCE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {userRole !== "agent" && (
          <Select
            value={currentFilters.assigned ?? "all"}
            onValueChange={(v) => updateFilter("assigned", v ?? "all")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Assigned" />
            </SelectTrigger>
            <SelectContent>
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
      </div>

      {/* Bulk assign bar */}
      {canBulkAssign && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
          <span className="text-sm font-medium text-emerald-700">
            {selectedIds.size} selected
          </span>
          <Select value={bulkAgent} onValueChange={(v) => setBulkAgent(v ?? "")}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="Assign to..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.full_name} ({a.role})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBulkAssign} disabled={pending || !bulkAgent}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCog className="mr-2 h-4 w-4" />}
            Assign
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                {canBulkAssign && (
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === leads.length && leads.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                )}
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Interest</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Follow-up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={canBulkAssign ? 10 : 9} className="px-4 py-12 text-center text-slate-400">
                    No leads found. Try adjusting filters or create a new lead.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const colors = getStatusColor(lead.status);
                  const waLink = whatsappLink(lead.phone);
                  const isSelected = selectedIds.has(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-50 ${isSelected ? "bg-emerald-50/50" : ""}`}
                    >
                      {canBulkAssign && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(lead.id)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <Link href={`/leads/${lead.id}`} className="hover:text-emerald-600">
                          {lead.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {lead.phone ? (
                          <a
                            href={waLink ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {lead.phone}
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {SOURCE_LABELS[lead.source] ?? lead.source}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {INTEREST_LABELS[lead.interest] ?? lead.interest}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {lead.budget_min || lead.budget_max
                          ? `${lead.budget_min ? formatAED(lead.budget_min) : "?"} – ${lead.budget_max ? formatAED(lead.budget_max) : "?"}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/leads/${lead.id}`}>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
                            {lead.status}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {lead.score !== null ? (
                          <span className={`text-xs font-bold ${lead.score >= 70 ? "text-emerald-600" : lead.score >= 40 ? "text-amber-600" : "text-slate-400"}`}>
                            {lead.score}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {lead.assigned_to_profile?.full_name ?? (
                          <span className="text-slate-300">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
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
    </div>
  );
}
