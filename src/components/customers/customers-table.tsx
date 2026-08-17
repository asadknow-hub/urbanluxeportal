"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { whatsappLink } from "@/lib/phone";
import { formatDate } from "@/lib/dates";
import { MessageCircle, Search, ChevronRight } from "lucide-react";

export type CustomerRow = {
  id: string;
  type: string;
  name: string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  status: string;
  lead_id: string | null;
  assigned_to: string | null;
  assigned_to_profile: { id: string; full_name: string; avatar_url: string | null } | null;
  created_at: string;
};

export function CustomersTable({
  customers,
  currentFilters,
}: {
  customers: CustomerRow[];
  currentFilters: { q?: string; type?: string; status?: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentFilters.q ?? "");

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/customers?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("q", searchValue);
  }

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-[1.5rem] border border-slate-200/60 shadow-sm w-fit">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search name, phone, email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-[300px] pl-10 border-0 bg-slate-50/50 focus-visible:bg-slate-100 rounded-xl h-10 shadow-none focus-visible:ring-0"
          />
        </form>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        <Select
          value={currentFilters.type ?? "all"}
          onValueChange={(v) => updateFilter("type", v ?? "all")}
        >
          <SelectTrigger className="w-[140px] border-0 bg-transparent hover:bg-slate-50 focus:ring-0 rounded-xl font-medium shadow-none h-10">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl font-medium">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="company">Company</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={currentFilters.status ?? "all"}
          onValueChange={(v) => updateFilter("status", v ?? "all")}
        >
          <SelectTrigger className="w-[140px] border-0 bg-transparent hover:bg-slate-50 focus:ring-0 rounded-xl font-medium shadow-none h-10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl font-medium">
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm border border-slate-200/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3 rounded-tl-[2rem]">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 rounded-tr-[2rem]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No customers found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting filters or create a new customer.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const waLink = whatsappLink(customer.phone);
                  return (
                    <tr
                      key={customer.id}
                      className="group transition-colors hover:bg-emerald-50/30"
                    >
                      <td className="px-4 py-3 font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        <Link href={`/customers/${customer.id}`}>
                          {customer.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${customer.type === "company" ? "bg-purple-50 text-purple-700 border-purple-200/60" : "bg-blue-50 text-blue-700 border-blue-200/60"}`}>
                          {customer.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {customer.phone ? (
                          <a
                            href={waLink ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/50 px-2.5 py-1 rounded-md transition-colors"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {customer.phone}
                          </a>
                        ) : (
                          <span className="text-slate-300 font-medium">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600">
                        {customer.email ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${
                          customer.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                          customer.status === 'prospect' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                          'bg-slate-50 text-slate-500 border-slate-200/60'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-500">
                        {customer.lead_id ? "Converted lead" : "Direct"}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600">
                        {customer.assigned_to_profile?.full_name ?? (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-500">
                        {formatDate(customer.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200/60 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 shadow-sm"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
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
