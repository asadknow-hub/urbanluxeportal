"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { COMMUNITIES, formatAed, type Listing, type ListingKind } from "@/lib/web/listings";
import { PropertyCard } from "@/components/web/property-card";

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
  const [community, setCommunity] = useState(searchParams.get("community") ?? "");
  const [beds, setBeds] = useState(searchParams.get("beds") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");

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
      return true;
    });
  }, [listings, community, beds, type]);

  function push(next: { community?: string; beds?: string; type?: string }) {
    const c = next.community ?? community;
    const b = next.beds ?? beds;
    const t = next.type ?? type;
    const params = new URLSearchParams();
    if (c) params.set("community", c);
    if (b) params.set("beds", b);
    if (t) params.set("type", t);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  const selectClass =
    "h-11 border border-[#e4d9c8] bg-[#fffcf8] px-3 text-sm text-[#14110e] outline-none focus:border-[#2dd4bf]";

  return (
    <div>
      <div className="mb-10 grid gap-3 border border-[#e4d9c8] bg-[#fffcf8] p-4 md:grid-cols-4">
        <select
          className={selectClass}
          value={community}
          onChange={(e) => {
            setCommunity(e.target.value);
            push({ community: e.target.value });
          }}
        >
          <option value="">All communities</option>
          {COMMUNITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            push({ type: e.target.value });
          }}
        >
          <option value="">All types</option>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
          <option value="penthouse">Penthouse</option>
          <option value="townhouse">Townhouse</option>
        </select>
        <select
          className={selectClass}
          value={beds}
          onChange={(e) => {
            setBeds(e.target.value);
            push({ beds: e.target.value });
          }}
        >
          <option value="">Any beds</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4+</option>
        </select>
        <p className="flex items-center text-sm text-[#8a8178]">
          {filtered.length} residence{filtered.length === 1 ? "" : "s"}
          {kind === "rent" ? " to let" : kind === "offplan" ? " forthcoming" : " for sale"}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="border border-dashed border-[#e4d9c8] px-6 py-16 text-center text-[#8a8178]">
          Nothing in this combination yet. Widen the search — or enquire and we will look beyond the brochure.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((listing) => (
            <PropertyCard key={listing.slug} listing={listing} />
          ))}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-[#8a8178]">
        Sample residences for client review. Prices shown in AED
        {kind === "rent" ? " per year" : ""}. Live inventory will replace this set.
      </p>
    </div>
  );
}

export function PriceNote({ listing }: { listing: Listing }) {
  return <span>{formatAed(listing.priceAed, listing.kind)}</span>;
}
