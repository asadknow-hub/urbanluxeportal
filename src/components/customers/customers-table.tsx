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
  assigned_to: string | null;
  assigned_to_profile: { id: string; full_name: string; avatar_url: string | null } | null;
  created_at: string;
};

export function CustomersTable({
  customers,
  currentFilters,
}: {
  customers: CustomerRow[];
  currentFilters: { q?: string; type?: string };
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
    <div className="space-y-4">
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
          value={currentFilters.type ?? "all"}
          onValueChange={(v) => updateFilter("type", v ?? "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="company">Company</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    No customers found. Try adjusting filters or create a new customer.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const waLink = whatsappLink(customer.phone);
                  return (
                    <tr
                      key={customer.id}
                      className="group hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <Link href={`/customers/${customer.id}`} className="hover:text-emerald-600">
                          {customer.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${customer.type === "company" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"}`}>
                          {customer.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {customer.phone ? (
                          <a
                            href={waLink ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {customer.phone}
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {customer.email ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          customer.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                          customer.status === 'prospect' ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {customer.assigned_to_profile?.full_name ?? (
                          <span className="text-slate-300">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(customer.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="inline-flex items-center text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-slate-600"
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
