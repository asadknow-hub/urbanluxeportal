"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Map,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { COMMUNITIES, type Listing, type ListingKind } from "@/lib/web/listings";
import { ListingResultCard } from "@/components/web/listing-result-card";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "ready" | "offplan";
type SortKey = "recent" | "price-asc" | "price-desc" | "beds";

const PRICE_MIN_OPTIONS = [
  { value: "", label: "Price Min" },
  { value: "500000", label: "AED 500,000" },
  { value: "1000000", label: "AED 1,000,000" },
  { value: "2000000", label: "AED 2,000,000" },
  { value: "5000000", label: "AED 5,000,000" },
  { value: "10000000", label: "AED 10,000,000" },
] as const;

const PRICE_MAX_OPTIONS = [
  { value: "", label: "Price Max" },
  { value: "1500000", label: "AED 1,500,000" },
  { value: "3000000", label: "AED 3,000,000" },
  { value: "5000000", label: "AED 5,000,000" },
  { value: "10000000", label: "AED 10,000,000" },
  { value: "25000000", label: "AED 25,000,000" },
  { value: "100000000", label: "AED 100,000,000+" },
] as const;

const RENT_MIN_OPTIONS = [
  { value: "", label: "Price Min" },
  { value: "60000", label: "AED 60,000" },
  { value: "100000", label: "AED 100,000" },
  { value: "150000", label: "AED 150,000" },
  { value: "250000", label: "AED 250,000" },
  { value: "400000", label: "AED 400,000" },
] as const;

const RENT_MAX_OPTIONS = [
  { value: "", label: "Price Max" },
  { value: "120000", label: "AED 120,000" },
  { value: "200000", label: "AED 200,000" },
  { value: "350000", label: "AED 350,000" },
  { value: "500000", label: "AED 500,000" },
  { value: "1000000", label: "AED 1,000,000+" },
] as const;

function FilterSelect({
  value,
  onChange,
  children,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
  "aria-label": string;
}) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <select
        aria-label={ariaLabel}
        className="h-11 w-full appearance-none rounded-md border border-[#d1d5db] bg-white py-2 pl-3 pr-9 text-sm font-medium text-[#0B1D3D] outline-none transition-colors hover:border-[#0B1D3D]/40 focus:border-[#0B1D3D]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0B1D3D]/45" />
    </div>
  );
}

export function ListingsExplorer({
  listings,
  kind,
}: {
  listings: Listing[];
  kind: ListingKind;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [beds, setBeds] = useState(searchParams.get("beds") ?? "");
  const [priceMin, setPriceMin] = useState(searchParams.get("min") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("max") ?? "");
  const [status, setStatus] = useState<StatusFilter>(() => {
    const fromUrl = searchParams.get("status") as StatusFilter | null;
    if (fromUrl) return fromUrl;
    return kind === "offplan" ? "offplan" : "ready";
  });
  const [sort, setSort] = useState<SortKey>((searchParams.get("sort") as SortKey) || "recent");
  const [moreOpen, setMoreOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [community, setCommunity] = useState(searchParams.get("community") ?? "");

  const isRent = kind === "rent";
  const minOptions = isRent ? RENT_MIN_OPTIONS : PRICE_MIN_OPTIONS;
  const maxOptions = isRent ? RENT_MAX_OPTIONS : PRICE_MAX_OPTIONS;

  function syncUrl(next: Record<string, string>) {
    const params = new URLSearchParams();
    const state = {
      q: query,
      type,
      beds,
      min: priceMin,
      max: priceMax,
      status,
      sort,
      community,
      ...next,
    };
    Object.entries(state).forEach(([k, v]) => {
      if (v && !(k === "status" && v === "ready") && !(k === "sort" && v === "recent")) {
        params.set(k, v);
      }
    });
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  const filtered = useMemo(() => {
    let rows = listings.filter((l) => {
      if (!isRent) {
        if (status === "ready" && l.status !== "ready") return false;
        if (status === "offplan" && l.status !== "offplan") return false;
      }
      if (type && l.type !== type) return false;
      if (community && l.communitySlug !== community) return false;
      if (beds) {
        const n = Number(beds);
        if (n >= 4) {
          if (l.beds < 4) return false;
        } else if (l.beds !== n) return false;
      }
      if (priceMin && l.priceAed < Number(priceMin)) return false;
      if (priceMax && l.priceAed > Number(priceMax)) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay = `${l.title} ${l.community} ${l.subtitle} ${l.ref}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    rows = [...rows];
    if (sort === "price-asc") rows.sort((a, b) => a.priceAed - b.priceAed);
    else if (sort === "price-desc") rows.sort((a, b) => b.priceAed - a.priceAed);
    else if (sort === "beds") rows.sort((a, b) => b.beds - a.beds);

    return rows;
  }, [listings, status, type, community, beds, priceMin, priceMax, query, sort, isRent]);

  const title =
    kind === "rent" ? "Properties For Rent In Dubai" : "Properties For Sale In Dubai";

  const activeFilterCount = [type, beds, priceMin, priceMax, community].filter(Boolean).length;

  const filterFields = (
    <>
      <FilterSelect
        aria-label="Property type"
        className="w-full lg:w-[9.5rem]"
        value={type}
        onChange={(v) => {
          setType(v);
          syncUrl({ type: v });
        }}
      >
        <option value="">Property Type</option>
        <option value="apartment">Apartment</option>
        <option value="villa">Villa</option>
        <option value="penthouse">Penthouse</option>
        <option value="townhouse">Townhouse</option>
      </FilterSelect>

      <FilterSelect
        aria-label="Minimum price"
        className="w-full lg:w-[9rem]"
        value={priceMin}
        onChange={(v) => {
          setPriceMin(v);
          syncUrl({ min: v });
        }}
      >
        {minOptions.map((o) => (
          <option key={o.label} value={o.value}>
            {o.label}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        aria-label="Maximum price"
        className="w-full lg:w-[9rem]"
        value={priceMax}
        onChange={(v) => {
          setPriceMax(v);
          syncUrl({ max: v });
        }}
      >
        {maxOptions.map((o) => (
          <option key={o.label} value={o.value}>
            {o.label}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        aria-label="Bedrooms"
        className="w-full lg:w-[6.5rem]"
        value={beds}
        onChange={(v) => {
          setBeds(v);
          syncUrl({ beds: v });
        }}
      >
        <option value="">Beds</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4+</option>
      </FilterSelect>
    </>
  );

  return (
    <div>
      <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-[0_1px_2px_rgba(11,29,61,0.04)] md:p-3.5">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <FilterSelect
            aria-label="Transaction type"
            className="w-full shrink-0 lg:w-[7.5rem]"
            value={kind === "rent" ? "rent" : "buy"}
            onChange={(v) => router.push(v === "rent" ? "/rent" : "/buy")}
          >
            <option value="buy">Buy</option>
            <option value="rent">Rent</option>
          </FilterSelect>

          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0B1D3D]/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                syncUrl({ q: e.target.value });
              }}
              placeholder="Community or building"
              className="h-11 w-full rounded-md border border-[#d1d5db] bg-white py-2 pl-10 pr-3 text-base text-[#0B1D3D] outline-none placeholder:text-[#0B1D3D]/40 hover:border-[#0B1D3D]/40 focus:border-[#0B1D3D] sm:text-sm"
            />
          </div>

          <div className="hidden lg:contents">{filterFields}</div>

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className={cn(
              "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-[#d1d5db] px-3.5 text-sm font-semibold text-[#0B1D3D] transition-colors hover:border-[#0B1D3D]/40 lg:hidden",
              activeFilterCount > 0 && "border-[#0B1D3D] bg-[#F2F2F2]"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
            Filters
            {activeFilterCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0B1D3D] px-1.5 text-[0.7rem] text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "hidden h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-[#d1d5db] px-3.5 text-sm font-semibold text-[#0B1D3D] transition-colors hover:border-[#0B1D3D]/40 lg:inline-flex",
              moreOpen && "border-[#0B1D3D] bg-[#F2F2F2]"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
            More Filters
          </button>
        </div>

        {moreOpen && (
          <div className="mt-3 hidden gap-2.5 border-t border-[#eee] pt-3 sm:grid-cols-2 lg:grid lg:grid-cols-3">
            <FilterSelect
              aria-label="Community"
              value={community}
              onChange={(v) => {
                setCommunity(v);
                syncUrl({ community: v });
              }}
            >
              <option value="">All communities</option>
              {COMMUNITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </FilterSelect>
          </div>
        )}
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[55] lg:hidden" role="dialog" aria-modal="true" aria-label="Listing filters">
          <button
            type="button"
            className="absolute inset-0 bg-[#0B1D3D]/45"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88svh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-[calc(1.25rem+var(--ul-safe-bottom,0px))] pt-3 shadow-[0_-12px_40px_rgba(11,29,61,0.18)]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#d1d5db]" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[#0B1D3D]">Filters</h2>
              <button
                type="button"
                className="text-sm font-semibold text-[#1E7A4A]"
                onClick={() => {
                  setType("");
                  setBeds("");
                  setPriceMin("");
                  setPriceMax("");
                  setCommunity("");
                  syncUrl({ type: "", beds: "", min: "", max: "", community: "" });
                }}
              >
                Clear all
              </button>
            </div>
            <div className="grid gap-3">{filterFields}</div>
            <FilterSelect
              aria-label="Community"
              className="mt-3"
              value={community}
              onChange={(v) => {
                setCommunity(v);
                syncUrl({ community: v });
              }}
            >
              <option value="">All communities</option>
              {COMMUNITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </FilterSelect>
            <button
              type="button"
              className="ul-btn-primary mt-5 h-12 w-full"
              onClick={() => setFiltersOpen(false)}
            >
              Show {filtered.length} results
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-4 border-b border-[#e5e7eb] pb-4 sm:mt-6 sm:pb-5 lg:flex-row lg:items-center lg:justify-between lg:pb-6">
        <p className="text-sm text-[#0B1D3D]/70 md:text-[0.9375rem]">
          {title}{" "}
          <span className="font-bold text-[#0B1D3D]">| {filtered.length} results</span>
        </p>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
          {!isRent && (
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <span className="hidden text-sm text-[#0B1D3D]/65 sm:inline">Show:</span>
              <div className="inline-flex w-full overflow-hidden rounded-md border border-[#d1d5db] sm:w-auto">
                {(
                  [
                    { id: "ready" as const, label: "Ready" },
                    { id: "offplan" as const, label: "Off Plan" },
                  ] as const
                ).map((opt) => {
                  const active = status === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setStatus(opt.id);
                        syncUrl({ status: opt.id });
                      }}
                      className={cn(
                        "inline-flex h-10 flex-1 items-center justify-center gap-1.5 px-3 text-sm font-semibold transition-colors sm:h-9 sm:flex-none",
                        active
                          ? "bg-[#0B1D3D] text-white"
                          : "bg-white text-[#0B1D3D] hover:bg-[#F2F2F2]"
                      )}
                    >
                      {active ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : null}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="relative min-w-0 flex-1 sm:flex-none">
            <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#0B1D3D]/45" />
            <select
              aria-label="Sort listings"
              className="h-10 w-full appearance-none rounded-md border border-[#d1d5db] bg-white py-1.5 pl-8 pr-8 text-sm font-medium text-[#0B1D3D] outline-none hover:border-[#0B1D3D]/40 focus:border-[#0B1D3D] sm:h-9 sm:w-auto"
              value={sort}
              onChange={(e) => {
                const v = e.target.value as SortKey;
                setSort(v);
                syncUrl({ sort: v });
              }}
            >
              <option value="recent">Sort: Most Recent</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="beds">Bedrooms</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#0B1D3D]/45" />
          </div>

          <a
            href={
              community
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${COMMUNITIES.find((c) => c.slug === community)?.name ?? community}, Dubai`
                  )}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    kind === "rent" ? "Properties for rent Dubai" : "Properties for sale Dubai"
                  )}`
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-[#d1d5db] px-3 text-sm font-semibold text-[#0B1D3D] transition-colors hover:border-[#0B1D3D]/40 hover:bg-[#F2F2F2] sm:h-9"
          >
            <Map className="h-3.5 w-3.5" strokeWidth={2} />
            Map
          </a>
        </div>
      </div>

      <div className="mt-6 space-y-5 pb-8 sm:mt-8 sm:space-y-6 md:mt-10 md:space-y-8 md:pb-12">
        {filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[#d1d5db] px-5 py-12 text-center text-sm text-[#0B1D3D]/55 sm:px-6 sm:py-16">
            No properties match these filters. Try widening your search.
          </p>
        ) : (
          filtered.map((listing) => <ListingResultCard key={listing.slug} listing={listing} />)
        )}
      </div>
    </div>
  );
}
