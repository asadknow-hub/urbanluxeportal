"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { COMMUNITIES } from "@/lib/web/listings";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "buy", label: "Buy", path: "/buy" },
  { id: "rent", label: "Rent", path: "/rent" },
  { id: "offplan", label: "Off Plan", path: "/off-plan" },
] as const;

const PROPERTY_TYPES = [
  { value: "", label: "Property Type" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "penthouse", label: "Penthouse" },
  { value: "townhouse", label: "Townhouse" },
] as const;

const BEDS = [
  { value: "", label: "Beds" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
] as const;

const PRICES = [
  { value: "", label: "Price" },
  { value: "2000000", label: "Up to 2M" },
  { value: "5000000", label: "Up to 5M" },
  { value: "10000000", label: "Up to 10M" },
  { value: "20000000", label: "Up to 20M" },
] as const;

export function HeroSearch() {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("buy");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [beds, setBeds] = useState("");
  const [price, setPrice] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const path = TABS.find((t) => t.id === tab)?.path ?? "/buy";
    const params = new URLSearchParams();
    if (query) {
      const match = COMMUNITIES.find(
        (c) => c.slug === query || c.name.toLowerCase().includes(query.toLowerCase())
      );
      if (match) params.set("community", match.slug);
      else params.set("q", query);
    }
    if (type) params.set("type", type);
    if (beds) params.set("beds", beds);
    if (price) params.set("max", price);
    const q = params.toString();
    router.push(q ? `${path}?${q}` : path);
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full bg-[var(--ul-primary)]/55 p-1 ring-1 ring-white/15 backdrop-blur-md">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-[0.68rem] font-semibold tracking-[0.14em] uppercase transition-colors sm:px-5",
                  active
                    ? "bg-[var(--ul-secondary)] text-[var(--ul-primary)]"
                    : "text-[var(--ul-secondary)]/85 hover:text-[var(--ul-secondary)]"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-col overflow-hidden rounded-full bg-[var(--ul-secondary)] shadow-[0_16px_48px_rgba(10,22,48,0.28)] sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="hero-location">
          Search by location
        </label>
        <div className="flex min-w-0 flex-1 items-center gap-2 px-4 py-3 sm:px-5 sm:py-0">
          <Search className="h-4 w-4 shrink-0 text-[var(--ul-primary)]/45" strokeWidth={2} aria-hidden />
          <input
            id="hero-location"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by location, community, or area"
            className="h-11 min-w-0 flex-1 bg-transparent text-base text-[var(--ul-primary)] outline-none placeholder:text-[var(--ul-primary)]/40 sm:h-14 sm:text-sm"
          />
        </div>

        <div className="hidden h-8 w-px shrink-0 bg-[var(--ul-primary)]/12 lg:block" />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="hidden h-14 shrink-0 appearance-none bg-transparent px-4 text-sm font-medium text-[var(--ul-primary)]/80 outline-none lg:block"
          aria-label="Property type"
        >
          {PROPERTY_TYPES.map((o) => (
            <option key={o.label} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="hidden h-8 w-px shrink-0 bg-[var(--ul-primary)]/12 lg:block" />

        <select
          value={beds}
          onChange={(e) => setBeds(e.target.value)}
          className="hidden h-14 shrink-0 appearance-none bg-transparent px-4 text-sm font-medium text-[var(--ul-primary)]/80 outline-none md:block"
          aria-label="Bedrooms"
        >
          {BEDS.map((o) => (
            <option key={o.label} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="hidden h-8 w-px shrink-0 bg-[var(--ul-primary)]/12 md:block" />

        <select
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="hidden h-14 shrink-0 appearance-none bg-transparent px-4 text-sm font-medium text-[var(--ul-primary)]/80 outline-none md:block"
          aria-label="Price"
        >
          {PRICES.map((o) => (
            <option key={o.label} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="shrink-0 p-2 sm:pr-2 sm:pl-1">
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--ul-primary)] px-5 text-sm font-semibold text-[var(--ul-secondary)] transition-colors hover:bg-[var(--ul-accent-deep)] sm:h-12 sm:w-auto sm:px-6"
          >
            <Search className="h-4 w-4" strokeWidth={2.25} />
            Search
          </button>
        </div>
      </div>
    </form>
  );
}
