"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Heart,
  Home,
  Landmark,
  LayoutGrid,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { COMMUNITIES, monthlyFor, type Listing } from "@/lib/web/listings";
import { useCurrency } from "@/components/web/currency-provider";
import { cn } from "@/lib/utils";

const TYPES = [
  { id: "", label: "All", icon: LayoutGrid },
  { id: "apartment", label: "Apartment", icon: Building2 },
  { id: "townhouse", label: "Townhouse", icon: Home },
  { id: "villa", label: "Villa", icon: Landmark },
] as const;

function fmtShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

export function OffPlanExplorer({ listings }: { listings: Listing[] }) {
  const { format } = useCurrency();
  const [community, setCommunity] = useState("");
  const [type, setType] = useState("");
  const [beds, setBeds] = useState("");
  const [priceMax, setPriceMax] = useState(10_000_000);
  const [monthlyMax, setMonthlyMax] = useState(50_000);
  const [downMax, setDownMax] = useState(1_000_000);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (community && l.communitySlug !== community) return false;
      if (type && l.type !== type) return false;
      if (beds) {
        const n = Number(beds);
        if (n >= 4) {
          if (l.beds < 4) return false;
        } else if (l.beds !== n) return false;
      }
      if (l.priceAed > priceMax) return false;
      const monthly = monthlyFor(l) ?? 0;
      if (monthly > monthlyMax) return false;
      const down = l.downPaymentAed ?? Math.round(l.priceAed * 0.1);
      if (down > downMax) return false;
      return true;
    });
  }, [listings, community, type, beds, priceMax, monthlyMax, downMax]);

  const developers = new Set(listings.map((l) => l.developer).filter(Boolean)).size;

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-5 md:px-8">
      <div className="mb-5 flex items-end justify-between gap-3 sm:mb-6 sm:gap-4">
        <div className="min-w-0">
          <p className="ul-kicker">Off-plan</p>
          <h1 className="mt-2 text-2xl leading-tight sm:text-3xl md:text-4xl">Find your perfect property</h1>
        </div>
        <button
          type="button"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-[var(--ul-hair)] bg-white px-3.5 text-sm sm:px-4 lg:hidden"
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {filtersOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-[#0A1630]/45 lg:hidden"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
        )}
        <aside
          className={cn(
            "rounded-xl border border-[var(--ul-hair)] bg-white p-5 text-[var(--ul-primary)] sm:p-6",
            "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-50 max-lg:max-h-[88svh] max-lg:overflow-y-auto max-lg:rounded-b-none max-lg:rounded-t-xl max-lg:pb-[calc(1.25rem+var(--ul-safe-bottom,0px))]",
            filtersOpen ? "max-lg:block" : "max-lg:hidden",
            "lg:sticky lg:top-24 lg:block lg:self-start"
          )}
        >
          <div className="mb-2 flex items-center justify-between lg:block">
            <p className="text-sm font-semibold tracking-wide">Search filters</p>
            <button
              type="button"
              className="text-sm font-semibold text-[var(--ul-secondary)] lg:hidden"
              onClick={() => setFiltersOpen(false)}
            >
              Done
            </button>
          </div>

          <label className="mt-6 block text-[0.65rem] tracking-[0.18em] uppercase text-[var(--ul-muted)]">Location</label>
          <select
            value={community}
            onChange={(e) => setCommunity(e.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-[var(--ul-hair)] bg-[var(--ul-paper)] px-3 text-sm outline-none focus:border-[var(--ul-primary)]"
          >
            <option value="">All communities</option>
            {COMMUNITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <p className="mt-6 text-[0.65rem] tracking-[0.18em] uppercase text-[var(--ul-muted)]">Property type</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.id || "all"}
                type="button"
                onClick={() => setType(t.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md border px-2 py-3 text-[0.7rem]",
                  type === t.id
                    ? "border-[var(--ul-secondary)] bg-[color-mix(in_srgb,var(--ul-secondary)_8%,white)] text-[var(--ul-secondary)]"
                    : "border-[var(--ul-hair)] text-[var(--ul-muted)]"
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          <label className="mt-6 block text-[0.65rem] tracking-[0.18em] uppercase text-[var(--ul-muted)]">Bedrooms</label>
          <select
            value={beds}
            onChange={(e) => setBeds(e.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-[var(--ul-hair)] bg-[var(--ul-paper)] px-3 text-sm outline-none focus:border-[var(--ul-primary)]"
          >
            <option value="">Any</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4+</option>
          </select>

          <label className="mt-6 flex justify-between text-[0.65rem] tracking-[0.18em] uppercase text-[var(--ul-muted)]">
            Price <span className="normal-case tracking-normal text-[var(--ul-primary)]">to {fmtShort(priceMax)}</span>
          </label>
          <input
            type="range"
            min={500000}
            max={10000000}
            step={100000}
            value={priceMax}
            onChange={(e) => setPriceMax(Number(e.target.value))}
            className="ul-range mt-3"
          />

          <label className="mt-6 flex justify-between text-[0.65rem] tracking-[0.18em] uppercase text-[var(--ul-muted)]">
            I can pay monthly
            <span className="normal-case tracking-normal text-[var(--ul-primary)]">{format(monthlyMax)}</span>
          </label>
          <input
            type="range"
            min={5000}
            max={50000}
            step={1000}
            value={monthlyMax}
            onChange={(e) => setMonthlyMax(Number(e.target.value))}
            className="ul-range mt-3"
          />

          <label className="mt-6 flex justify-between text-[0.65rem] tracking-[0.18em] uppercase text-[var(--ul-muted)]">
            Down payment
            <span className="normal-case tracking-normal text-[var(--ul-primary)]">{format(downMax)}</span>
          </label>
          <input
            type="range"
            min={50000}
            max={1000000}
            step={25000}
            value={downMax}
            onChange={(e) => setDownMax(Number(e.target.value))}
            className="ul-range mt-3"
          />

          <p className="mt-8 flex h-12 items-center justify-center gap-2 rounded-md bg-[var(--ul-secondary)] text-[0.75rem] font-semibold tracking-[0.16em] uppercase text-white">
            <Search className="h-4 w-4" />
            {filtered.length} matches
          </p>
        </aside>

        <div>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: Building2, k: `${listings.length}+`, v: "Off-plan properties" },
              { icon: Landmark, k: `${Math.max(developers, 5)}+`, v: "Top developers" },
              { icon: Wallet, k: "Flexible", v: "Payment plans" },
              { icon: BadgeCheck, k: "Private", v: "Property advisors" },
            ].map((s) => (
              <div key={s.v} className="flex items-center gap-3 border border-[var(--ul-hair)] bg-white px-4 py-3">
                <s.icon className="h-5 w-5 text-[var(--ul-secondary)]" />
                <div>
                  <p className="text-sm font-medium">{s.k}</p>
                  <p className="text-xs text-[var(--ul-muted)]">{s.v}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-xl">Properties for you</h2>
              <p className="mt-1 text-sm text-[var(--ul-muted)]">Matched to budget and payment preferences.</p>
            </div>
            <p className="text-sm text-[var(--ul-muted)]">{filtered.length} shown</p>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--ul-hair)] bg-white px-6 py-16 text-center text-[var(--ul-muted)]">
              No matches in this range. Widen the sliders, or enquire and we will look beyond the brochure.
            </p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((listing, i) => (
                <OffPlanCard key={listing.slug} listing={listing} best={i === 0} />
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-col items-start justify-between gap-4 border border-[var(--ul-hair)] bg-white px-6 py-5 sm:flex-row sm:items-center">
            <p className="text-sm text-[var(--ul-muted)]">
              Based on your budget. Down payment:{" "}
              <span className="text-[var(--ul-primary)]">{format(downMax)}</span>
              {" · "}
              Monthly: <span className="text-[var(--ul-primary)]">{format(monthlyMax)}</span>
              {". "}
              {filtered.length} project{filtered.length === 1 ? "" : "s"} match.
            </p>
            <Link
              href="/contact"
              className="inline-flex h-10 items-center rounded-md bg-[var(--ul-primary)] px-4 text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-white"
            >
              View all matches
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            {[
              { icon: ShieldCheck, t: "Verified developers" },
              { icon: Landmark, t: "Secure investment" },
              { icon: CalendarClock, t: "Flexible payment" },
              { icon: BadgeCheck, t: "Expert guidance" },
            ].map((x) => (
              <div key={x.t} className="flex items-center gap-2 text-sm text-[var(--ul-muted)]">
                <x.icon className="h-4 w-4 text-[#008040]" />
                {x.t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OffPlanCard({ listing, best }: { listing: Listing; best?: boolean }) {
  const { format } = useCurrency();
  const monthly = monthlyFor(listing);
  const plan = listing.paymentPlan ?? [
    { label: "Booking", pct: 10 },
    { label: "Construction", pct: 40 },
    { label: "Handover", pct: 50 },
  ];

  return (
    <article className="flex flex-col overflow-hidden border border-[var(--ul-hair)] bg-white">
      <div className="relative aspect-[16/10]">
        <Image src={listing.image} alt={listing.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
        {listing.developer && (
          <span className="absolute left-3 top-3 rounded-md bg-white px-2 py-1 text-[0.65rem] font-semibold tracking-wide text-[var(--ul-primary)]">
            {listing.developer}
          </span>
        )}
        {best && (
          <span className="absolute right-12 top-3 rounded-md bg-[var(--ul-secondary)] px-2 py-1 text-[0.62rem] font-semibold tracking-[0.08em] uppercase text-white">
            Best match
          </span>
        )}
        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[var(--ul-muted)]">
          <Heart className="h-4 w-4" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg leading-snug">{listing.title}</h3>
        <p className="mt-1 text-sm text-[var(--ul-muted)]">{listing.community}</p>
        <p className="mt-2 text-xs uppercase tracking-wide text-[var(--ul-muted)]">
          {listing.type} · {listing.beds} bedroom
        </p>
        <p className="mt-3 text-base font-medium">From {format(listing.priceAed)}</p>
        {monthly != null && (
          <p className="text-sm text-[var(--ul-secondary)]">Est. monthly {format(monthly)}</p>
        )}
        <div className="mt-4">
          <div className="flex h-1.5 overflow-hidden rounded-full bg-[var(--ul-paper)]">
            {plan.map((p, i) => (
              <span
                key={p.label}
                className={i % 2 === 0 ? "bg-[var(--ul-secondary)]" : "bg-[var(--ul-primary)]"}
                style={{ width: `${p.pct}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.65rem] text-[var(--ul-muted)]">
            {plan.map((p) => (
              <span key={p.label}>
                {p.pct}% {p.label}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-between text-xs text-[var(--ul-muted)]">
          <span>Size {listing.sqft.toLocaleString()} sq.ft</span>
          <span>Handover {listing.handover ?? "TBA"}</span>
        </div>
        <Link
          href={`/properties/${listing.slug}`}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[var(--ul-primary)] text-[0.7rem] font-semibold tracking-[0.16em] uppercase text-white transition-colors hover:bg-[var(--ul-secondary)]"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
