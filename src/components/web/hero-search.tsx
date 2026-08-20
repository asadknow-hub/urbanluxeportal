"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { COMMUNITIES } from "@/lib/web/listings";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "residential", label: "Residential", short: "Home", path: "/buy" },
  { id: "communities", label: "Communities", short: "Areas", path: "/communities" },
  { id: "global", label: "Off-plan", short: "Off-plan", path: "/off-plan" },
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
    if (query) {
      const match = COMMUNITIES.find(
        (c) => c.slug === query || c.name.toLowerCase().includes(query.toLowerCase())
      );
      if (match) params.set("community", match.slug);
      else if (tab !== "communities") params.set("q", query);
    }
    const q = params.toString();
    router.push(q ? `${path}?${q}` : path);
  }

  return (
    <form onSubmit={submit} className="w-full max-w-2xl">
      <div className="ul-hide-scroll -mx-1 flex items-end gap-0.5 overflow-x-auto px-1 pb-px">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "shrink-0 px-3.5 py-2.5 text-[0.6875rem] font-semibold tracking-[0.12em] uppercase transition-colors sm:px-5 sm:tracking-[0.14em]",
                active
                  ? "rounded-t-md bg-white text-[#0B1D3D]"
                  : "rounded-t-md bg-[#F2F2F2]/90 text-[#0B1D3D]/70 hover:text-[#0B1D3D]"
              )}
            >
              <span className="sm:hidden">{item.short}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center overflow-hidden rounded-b-lg rounded-tr-lg bg-white shadow-[0_12px_48px_rgba(11,29,61,0.14)]">
        <label className="sr-only" htmlFor="hero-location">
          City or property type
        </label>
        <input
          id="hero-location"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="City or property type"
          className="h-12 min-w-0 flex-1 bg-transparent px-4 text-base text-[#0B1D3D] outline-none placeholder:text-[#0B1D3D]/40 sm:h-[3.25rem] sm:px-5 sm:text-sm"
        />

        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center border-l border-[#0B1D3D]/8 text-[#0B1D3D]/80 transition-colors hover:text-[#0B1D3D] sm:h-[3.25rem] sm:w-auto sm:gap-2 sm:px-5 sm:text-sm sm:font-medium"
          aria-expanded={showFilters}
          aria-label="Filters"
        >
          <span className="hidden sm:inline">Filter</span>
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        <button
          type="submit"
          className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#1E7A4A] text-white transition-colors hover:bg-[#155c38] sm:h-[3.25rem] sm:w-[3.25rem]"
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
            className="h-11 w-full rounded border border-[#0B1D3D]/12 px-3 text-base text-[#0B1D3D] outline-none focus:border-[#1E7A4A] sm:h-10 sm:text-sm"
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
