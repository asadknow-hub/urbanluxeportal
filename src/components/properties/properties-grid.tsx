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
import { getStatusColor } from "@/lib/status-colors";
import { formatAED } from "@/lib/money";
import { Search, Building2, Bed, Bath, Maximize, MapPin } from "lucide-react";

export type PropertyRow = {
  id: string;
  ref_no: string;
  title: string;
  purpose: string;
  category: string;
  status: string;
  community: string | null;
  building: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqft: number | null;
  price: number;
  owner: { id: string; name: string } | null;
  assigned_to_profile: { id: string; full_name: string } | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  apartment: "Apartment",
  villa: "Villa",
  townhouse: "Townhouse",
  office: "Office",
  retail: "Retail",
  warehouse: "Warehouse",
  land: "Land",
  off_plan: "Off-Plan",
};

export function PropertiesGrid({
  properties,
  currentFilters,
}: {
  properties: PropertyRow[];
  currentFilters: { q?: string; purpose?: string; category?: string; status?: string };
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
    router.push(`/properties?${params.toString()}`);
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
            placeholder="Search ref no, title, community..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-64 pl-9"
          />
        </form>

        <Select
          value={currentFilters.purpose ?? "all"}
          onValueChange={(v) => updateFilter("purpose", v ?? "all")}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Purpose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="sale">For Sale</SelectItem>
            <SelectItem value="rent">For Rent</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.category ?? "all"}
          onValueChange={(v) => updateFilter("category", v ?? "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.status ?? "all"}
          onValueChange={(v) => updateFilter("status", v ?? "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="rented">Rented</SelectItem>
            <SelectItem value="off_market">Off Market</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {properties.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center text-slate-400 border border-slate-200">
          No properties found. Try adjusting filters or create a new property.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((prop) => {
            const colors = getStatusColor(prop.status);
            return (
              <Link
                key={prop.id}
                href={`/properties/${prop.id}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200 transition-shadow hover:shadow-md"
              >
                {/* Image placeholder */}
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                  <Building2 className="h-12 w-12 text-slate-300" />
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-400">{prop.ref_no}</p>
                      <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-emerald-600">
                        {prop.title}
                      </h3>
                    </div>
                    <span className={`inline-flex flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {prop.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  {prop.community && (
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {prop.community}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {prop.bedrooms !== null && (
                      <span className="flex items-center gap-1">
                        <Bed className="h-3.5 w-3.5" />
                        {prop.bedrooms}
                      </span>
                    )}
                    {prop.bathrooms !== null && (
                      <span className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5" />
                        {prop.bathrooms}
                      </span>
                    )}
                    {prop.size_sqft !== null && (
                      <span className="flex items-center gap-1">
                        <Maximize className="h-3.5 w-3.5" />
                        {prop.size_sqft.toLocaleString()} sqft
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-lg font-bold text-slate-900">
                      {formatAED(prop.price)}
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${prop.purpose === "sale" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {prop.purpose === "sale" ? "For Sale" : "For Rent"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
