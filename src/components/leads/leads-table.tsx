"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
import { LeadDrawer } from "./lead-drawer";
import { MessageCircle, Search } from "lucide-react";

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
  off_plan: "Off-Plan",
  commercial: "Commercial",
};

export function LeadsTable({
  leads,
  agents,
  currentFilters,
  userRole,
}: {
  leads: LeadRow[];
  agents: { id: string; full_name: string; role: string }[];
  currentFilters: { status?: string; source?: string; assigned?: string; q?: string };
  userRole: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [searchValue, setSearchValue] = useState(currentFilters.q ?? "");

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/leads?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("q", searchValue);
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

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
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
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No leads found. Try adjusting filters or create a new lead.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const colors = getStatusColor(lead.status);
                  const waLink = whatsappLink(lead.phone);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {lead.name}
                      </td>
                      <td className="px-4 py-3">
                        {lead.phone ? (
                          <a
                            href={waLink ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
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
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
                          {lead.status}
                        </span>
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

      {/* Drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
}
