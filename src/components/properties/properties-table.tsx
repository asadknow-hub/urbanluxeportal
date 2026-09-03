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
import { formatDate } from "@/lib/dates";
import { formatAED } from "@/lib/money";
import { formatPropertyLine } from "@/lib/deal-transaction";
import { formatPropertyType } from "@/lib/inventory";
import { Search, ChevronRight } from "lucide-react";

export type CompanyPropertyRow = {
  id: string;
  property_title: string;
  property_community: string | null;
  property_building: string | null;
  property_unit: string | null;
  property_type: string | null;
  deal_type: string;
  value: number;
  agency_commission_amount: number | null;
  acquired_at: string;
  deal_id: string | null;
  customer: { id: string; name: string } | null;
  agent: { id: string; full_name: string } | null;
};

export function PropertiesTable({
  properties,
  currentFilters,
}: {
  properties: CompanyPropertyRow[];
  currentFilters: { q?: string; type?: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentFilters.q ?? "");

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || !value) params.delete(key);
    else params.set(key, value);
    // Keep closed-deals view when filtering from that tab.
    if (!params.get("view")) params.set("view", "closed");
    router.push(`/company-properties?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("q", searchValue);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-border bg-card p-2 w-fit">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search property, customer..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-9 w-[280px] border-0 bg-muted/40 pl-9 shadow-none focus-visible:ring-0"
          />
        </form>
        <div className="mx-1 h-6 w-px bg-border" />
        <Select value={currentFilters.type ?? "all"} onValueChange={(v) => updateFilter("type", v ?? "all")}>
          <SelectTrigger className="h-9 w-[140px] border-0 bg-transparent shadow-none">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
            <SelectItem value="townhouse">Townhouse</SelectItem>
            <SelectItem value="penthouse">Penthouse</SelectItem>
            <SelectItem value="plot">Plot</SelectItem>
            <SelectItem value="office">Office</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="h-0.5 bg-primary" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Agency comm.</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Closed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No closed-deal properties yet. Properties are created when a deal is marked closed.
                  </td>
                </tr>
              ) : (
                properties.map((row) => (
                  <tr key={row.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {formatPropertyLine(row)}
                      </p>
                      <p className="text-xs capitalize text-muted-foreground">{row.deal_type.replace(/_/g, " ")}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatPropertyType(row.property_type)}
                    </td>
                    <td className="px-4 py-3">
                      {row.customer ? (
                        <Link href={`/customers/${row.customer.id}`} className="font-medium hover:text-primary hover:underline">
                          {row.customer.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatAED(row.value)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.agency_commission_amount ? formatAED(row.agency_commission_amount) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.agent?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(row.acquired_at, "dd MMM yyyy")}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/company-properties/${row.id}`}
                        className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
                      >
                        View
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
