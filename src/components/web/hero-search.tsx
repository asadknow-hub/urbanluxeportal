"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { COMMUNITIES } from "@/lib/web/listings";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "residential", label: "Residential", path: "/buy" },
  { id: "commercial", label: "Commercial", path: "/buy" },
  { id: "global", label: "Global Projects", path: "/off-plan" },
] as const;

export function HeroSearch() {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("residential");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const path = TABS.find((t) => t.id === tab)?.path ?? "/buy";
    const params = new URLSearchParams();
    if (tab === "commercial") params.set("type", "commercial");
    if (query) {
      const match = COMMUNITIES.find(
        (c) => c.slug === query || c.name.toLowerCase().includes(query.toLowerCase())
      );
      if (match) params.set("community", match.slug);
      else params.set("q", query);
    }
    const q = params.toString();
    router.push(q ? `${path}?${q}` : path);
  }

  return (
    <form onSubmit={submit} className="w-full max-w-2xl">
      {/* Tabs */}
      <div className="flex items-end gap-0.5">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "px-5 py-2.5 text-[0.6875rem] font-semibold tracking-[0.14em] uppercase transition-colors",
                active
                  ? "rounded-t-md bg-white text-[#0B1D3D]"
                  : "rounded-t-md bg-[#F2F2F2]/90 text-[#0B1D3D]/70 hover:text-[#0B1D3D]"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div className="flex items-center overflow-hidden rounded-b-lg rounded-tr-lg bg-white shadow-[0_12px_48px_rgba(11,29,61,0.14)]">
        <label className="sr-only" htmlFor="hero-location">
          City or property type
        </label>
        <input
          id="hero-location"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter city or property type"
          className="h-[3.25rem] min-w-0 flex-1 bg-transparent px-5 text-sm text-[#0B1D3D] outline-none placeholder:text-[#0B1D3D]/40"
        />

        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="hidden h-[3.25rem] shrink-0 items-center gap-2 border-l border-[#0B1D3D]/8 px-5 text-sm font-medium text-[#0B1D3D]/80 transition-colors hover:text-[#0B1D3D] sm:inline-flex"
          aria-expanded={showFilters}
        >
          Filter
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        <button
          type="submit"
          className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center bg-[#1E7A4A] text-white transition-colors hover:bg-[#155c38]"
          aria-label="Search properties"
        >
          <Search className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.25} />
        </button>
      </div>

      {showFilters && (
        <div className="mt-2 rounded-lg bg-white/95 p-4 shadow-lg ring-1 ring-[#0B1D3D]/8 backdrop-blur-sm">
          <label className="mb-1.5 block text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-[#0B1D3D]/60">
            Community
          </label>
          <select
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded border border-[#0B1D3D]/12 px-3 text-sm text-[#0B1D3D] outline-none focus:border-[#1E7A4A]"
          >
            <option value="">Any area</option>
            {COMMUNITIES.map((c) => (
              <option key={c.slug} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </form>
  );
}
