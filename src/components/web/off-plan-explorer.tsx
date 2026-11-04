"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { COMMUNITIES, monthlyFor, type Listing } from "@/lib/web/listings";
import { useCurrency } from "@/components/web/currency-provider";
import { cn } from "@/lib/utils";

const TYPES = [
  { id: "", label: "All" },
  { id: "apartment", label: "Apartment" },
  { id: "townhouse", label: "Townhouse" },
  { id: "villa", label: "Villa" },
] as const;

function fmtShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

const field =
  "mt-2 h-11 w-full border border-[var(--ul-hair)] bg-white px-3 text-sm text-[var(--ul-primary)] outline-none focus:border-[var(--ul-secondary)]";

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

  const filters = (
    <>
      <label className="block text-[0.65rem] tracking-[0.18em] uppercase text-[var(--ul-muted)]">
        Location
      </label>
      <select
        value={community}
        onChange={(e) => setCommunity(e.target.value)}
        className={field}
      >
        <option value="">All communities</option>
        {COMMUNITIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      <p className="mt-5 text-[0.65rem] tracking-[0.18em] uppercase text-[var(--ul-muted)]">
        Property type
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {TYPES.map((t) => (
          <button
            key={t.id || "all"}
            type="button"
            onClick={() => setType(t.id)}
            className={cn(
              "border px-2 py-2.5 text-[0.7rem] font-medium",
              type === t.id
                ? "border-[var(--ul-secondary)] text-[var(--ul-secondary)]"
                : "border-[var(--ul-hair)] text-[var(--ul-muted)]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label className="mt-5 block text-[0.65rem] tracking-[0.18em] uppercase text-[var(--ul-muted)]">
        Bedrooms
      </label>
      <select value={beds} onChange={(e) => setBeds(e.target.value)} className={field}>
        <option value="">Any</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4+</option>
      </select>

      <label className="mt-5 flex justify-between text-[0.65rem] tracking-[0.18em] uppercase text-[var(--ul-muted)]">
        Price
        <span className="normal-case tracking-normal text-[var(--ul-primary)]">
          to {fmtShort(priceMax)}
        </span>
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

      <label className="mt-5 flex justify-between text-[0.65rem] tracking-[0.18em] uppercase text-[var(--ul-muted)]">
        Monthly
        <span className="normal-case tracking-normal text-[var(--ul-primary)]">
          {format(monthlyMax)}
        </span>
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

      <label className="mt-5 flex justify-between text-[0.65rem] tracking-[0.18em] uppercase text-[var(--ul-muted)]">
        Down payment
        <span className="normal-case tracking-normal text-[var(--ul-primary)]">
          {format(downMax)}
        </span>
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

      <p className="mt-6 text-sm text-[var(--ul-muted)]">
        <span className="font-semibold text-[var(--ul-primary)]">{filtered.length}</span> matches
      </p>
    </>
  );

  return (
    <div>
      <header className="mb-6 flex items-end justify-between gap-3 md:mb-8">
        <div className="min-w-0 max-w-2xl">
          <p className="ul-kicker">Off-plan</p>
          <h1 className="mt-2 text-[1.75rem] font-extrabold uppercase leading-[1.08] tracking-[-0.03em] text-[var(--ul-primary)] sm:text-4xl">
            New launches & payment plans
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ul-muted)] sm:text-[0.95rem]">
            Filter by budget, monthly, and down payment. Private allocations when they fit.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-11 shrink-0 items-center gap-2 border border-[var(--ul-hair)] bg-white px-3.5 text-sm font-semibold text-[var(--ul-primary)] lg:hidden"
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </header>

      <div className="grid gap-8 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-10">
        {filtersOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-[var(--ul-primary)]/45 lg:hidden"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
        )}

        <aside
          className={cn(
            "border border-[var(--ul-hair)] bg-white p-4 text-[var(--ul-primary)] sm:p-5",
            "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-50 max-lg:max-h-[88svh] max-lg:overflow-y-auto max-lg:border-x-0 max-lg:pb-[calc(1.25rem+var(--ul-safe-bottom,0px))]",
            filtersOpen ? "max-lg:block" : "max-lg:hidden",
            "lg:sticky lg:top-24 lg:block lg:self-start lg:border-0 lg:border-r lg:bg-transparent lg:p-0 lg:pr-6"
          )}
        >
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <p className="text-sm font-semibold">Filters</p>
            <button
              type="button"
              className="text-sm font-semibold text-[var(--ul-secondary)]"
              onClick={() => setFiltersOpen(false)}
            >
              Done
            </button>
          </div>
          {filters}
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-3 border-b border-[var(--ul-hair)] pb-4">
            <p className="text-sm text-[var(--ul-muted)]">
              <span className="font-semibold text-[var(--ul-primary)]">{filtered.length}</span>{" "}
              projects
            </p>
            <p className="text-xs text-[var(--ul-muted)]">
              Down to {format(downMax)} · monthly to {format(monthlyMax)}
            </p>
          </div>

          {filtered.length === 0 ? (
            <p className="border border-dashed border-[var(--ul-hair)] px-5 py-12 text-center text-sm text-[var(--ul-muted)]">
              No matches in this range. Widen the sliders, or enquire and we will look beyond the
              brochure.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((listing, i) => (
                <OffPlanCard key={listing.slug} listing={listing} best={i === 0} />
              ))}
            </div>
          )}
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
    <article className="flex flex-col border border-[var(--ul-hair)] bg-white">
      <Link href={`/properties/${listing.slug}`} prefetch className="relative block aspect-[16/10]">
        <Image
          src={listing.image}
          alt={listing.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
        {listing.developer ? (
          <span className="absolute left-3 top-3 bg-white px-2 py-1 text-[0.65rem] font-semibold tracking-wide text-[var(--ul-primary)]">
            {listing.developer}
          </span>
        ) : null}
        {best ? (
          <span className="absolute right-3 top-3 bg-[var(--ul-secondary)] px-2 py-1 text-[0.62rem] font-semibold tracking-[0.08em] uppercase text-white">
            Best match
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold leading-snug text-[var(--ul-primary)]">{listing.title}</h3>
        <p className="mt-1 text-sm text-[var(--ul-muted)]">{listing.community}</p>
        <p className="mt-2 text-xs uppercase tracking-wide text-[var(--ul-muted)]">
          {listing.type} · {listing.beds} bedroom
        </p>
        <p className="mt-3 text-base font-semibold text-[var(--ul-primary)]">
          From {format(listing.priceAed)}
        </p>
        {monthly != null ? (
          <p className="text-sm text-[var(--ul-secondary)]">Est. monthly {format(monthly)}</p>
        ) : null}
        <div className="mt-4">
          <div className="flex h-1 overflow-hidden bg-[var(--ul-paper)]">
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
          <span>{listing.sqft.toLocaleString()} sq.ft</span>
          <span>Handover {listing.handover ?? "TBA"}</span>
        </div>
        <Link
          href={`/properties/${listing.slug}`}
          className="mt-4 inline-flex h-10 items-center justify-center bg-[var(--ul-secondary)] text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-white transition-colors hover:bg-[#006633]"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
