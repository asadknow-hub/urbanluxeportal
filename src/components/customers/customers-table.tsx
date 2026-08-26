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
      <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-border bg-card p-2 w-fit">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-9 w-[280px] border-0 bg-muted/40 pl-9 shadow-none focus-visible:ring-0"
          />
        </form>

        <div className="mx-1 h-6 w-px bg-border" />

        <Select
          value={currentFilters.type ?? "all"}
          onValueChange={(v) => updateFilter("type", v ?? "all")}
        >
          <SelectTrigger className="h-9 w-[140px] border-0 bg-transparent shadow-none">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="company">Company</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={currentFilters.status ?? "all"}
          onValueChange={(v) => updateFilter("status", v ?? "all")}
        >
          <SelectTrigger className="h-9 w-[140px] border-0 bg-transparent shadow-none">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="h-0.5 bg-primary" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">No customers found</p>
                      <p className="mt-1 text-xs text-muted-foreground">Try adjusting filters or create a new customer.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const waLink = whatsappLink(customer.phone);
                  return (
                    <tr key={customer.id} className="group transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 font-semibold text-foreground group-hover:text-primary">
                        <Link href={`/customers/${customer.id}`} prefetch>{customer.name}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${customer.type === "company" ? "border-violet-200/60 bg-violet-50 text-violet-700" : "border-border bg-muted text-foreground"}`}>
                          {customer.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {customer.phone ? (
                          <a
                            href={waLink ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 font-medium text-primary transition-colors hover:bg-primary/15"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {customer.phone}
                          </a>
                        ) : (
                          <span className="font-medium text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-muted-foreground">
                        {customer.email ?? <span className="text-muted-foreground/60">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${
                          customer.status === "active"
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : customer.status === "qualified"
                              ? "border-emerald-200/60 bg-emerald-50 text-emerald-800"
                              : customer.status === "lead"
                                ? "border-amber-200/60 bg-amber-50 text-amber-800"
                                : customer.status === "lost"
                                  ? "border-red-200/60 bg-red-50 text-red-700"
                                  : "border-border bg-muted text-muted-foreground"
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                        {customer.lead_id ? "From lead" : "Direct"}
                      </td>
                      <td className="px-4 py-3 font-medium text-muted-foreground">
                        {customer.assigned_to_profile?.full_name ?? (
                          <span className="italic text-muted-foreground/70">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-muted-foreground">
                        {formatDate(customer.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/customers/${customer.id}`}
                          prefetch
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
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
