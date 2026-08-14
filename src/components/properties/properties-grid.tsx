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
      <div className="flex flex-wrap items-center gap-3 p-2 bg-slate-100/80 backdrop-blur-md rounded-[1.25rem] w-fit border border-slate-200/60 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search ref no, title, community..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-64 pl-10 h-10 rounded-xl bg-white border-slate-200 shadow-sm focus-visible:ring-emerald-500/20"
          />
        </form>

        <Select
          value={currentFilters.purpose ?? "all"}
          onValueChange={(v) => updateFilter("purpose", v ?? "all")}
        >
          <SelectTrigger className="w-32 h-10 rounded-xl bg-white border-slate-200 shadow-sm focus:ring-emerald-500/20">
            <SelectValue placeholder="Purpose" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-xl">
            <SelectItem value="all">All Purposes</SelectItem>
            <SelectItem value="sale">For Sale</SelectItem>
            <SelectItem value="rent">For Rent</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.category ?? "all"}
          onValueChange={(v) => updateFilter("category", v ?? "all")}
        >
          <SelectTrigger className="w-36 h-10 rounded-xl bg-white border-slate-200 shadow-sm focus:ring-emerald-500/20">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-xl">
            <SelectItem value="all">All Categories</SelectItem>
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
          <SelectTrigger className="w-36 h-10 rounded-xl bg-white border-slate-200 shadow-sm focus:ring-emerald-500/20">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-xl">
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
            // Convert 'bg-emerald-50' to 'bg-emerald-500' for a solid badge
            const solidBadgeBg = colors.bg.replace(/50|100/, "500").replace("bg-slate-500", "bg-slate-700");
            const hasDetails = prop.bedrooms !== null || prop.bathrooms !== null || prop.size_sqft !== null;

            return (
              <Link
                key={prop.id}
                href={`/properties/${prop.id}`}
                className="group flex flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-sm border border-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-200"
              >
                {/* Image placeholder with clean, premium light gradient */}
                <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden border-b border-slate-100">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
                  <Building2 className="h-10 w-10 text-slate-200 group-hover:scale-110 group-hover:text-emerald-200 transition-all duration-500" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm ${solidBadgeBg} text-white`}>
                      {prop.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Ref Badge */}
                  <div className="absolute bottom-4 left-4">
                    <span className="inline-flex rounded-lg bg-white/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm border border-slate-200/50">
                      {prop.ref_no}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                      {prop.title}
                    </h3>
                    {prop.community && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-500">
                        <MapPin className="h-4 w-4 text-emerald-500" />
                        {prop.community}
                      </p>
                    )}
                  </div>

                  {hasDetails && (
                    <div className="flex items-center gap-4 text-sm font-semibold text-slate-600 py-3 border-t border-slate-100 mb-4">
                      {prop.bedrooms !== null && (
                        <span className="flex items-center gap-1.5">
                          <Bed className="h-4 w-4 text-slate-400" />
                          {prop.bedrooms}
                        </span>
                      )}
                      {prop.bathrooms !== null && (
                        <span className="flex items-center gap-1.5">
                          <Bath className="h-4 w-4 text-slate-400" />
                          {prop.bathrooms}
                        </span>
                      )}
                      {prop.size_sqft !== null && (
                        <span className="flex items-center gap-1.5">
                          <Maximize className="h-4 w-4 text-slate-400" />
                          {prop.size_sqft.toLocaleString()} <span className="text-xs text-slate-400 font-normal">sqft</span>
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-end justify-between pt-4 mt-auto border-t border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Asking Price</p>
                      <span className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                        {formatAED(prop.price)}
                      </span>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm ${prop.purpose === "sale" ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                      For {prop.purpose}
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
