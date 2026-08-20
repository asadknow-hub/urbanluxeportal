"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bed, Maximize2 } from "lucide-react";
import { type Listing } from "@/lib/web/listings";
import { useCurrency } from "@/components/web/currency-provider";
import { cn } from "@/lib/utils";

export function HomePropertyCard({
  listing,
  className,
}: {
  listing: Listing;
  className?: string;
}) {
  const { format } = useCurrency();
  const price = format(listing.priceAed, { kind: listing.kind === "rent" ? "rent" : listing.kind });

  return (
    <Link
      href={`/properties/${listing.slug}`}
      prefetch
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-sm bg-white shadow-[0_4px_24px_rgba(11,29,61,0.07)] transition-shadow hover:shadow-[0_8px_32px_rgba(11,29,61,0.12)]",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={listing.image}
          alt={listing.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {listing.exclusive && (
          <span className="absolute left-3 top-3 rounded-sm bg-[var(--ul-secondary)] px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-white">
            Exclusive
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ul-secondary)]">
          {listing.community}
        </p>
        <h3 className="mt-1.5 text-lg font-semibold leading-snug text-[var(--ul-primary)] transition-colors group-hover:text-[var(--ul-secondary)]">
          {listing.title}
        </h3>
        <p className="mt-2 text-base font-semibold text-[var(--ul-primary)]">{price}</p>
        <div className="mt-auto flex items-center gap-4 pt-4 text-sm text-[var(--ul-muted)]">
          <span className="inline-flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" />
            {listing.beds} bed
          </span>
          <span className="inline-flex items-center gap-1">
            <Maximize2 className="h-3.5 w-3.5" />
            {listing.sqft.toLocaleString()} sq.ft
          </span>
          <ArrowRight className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </Link>
  );
}
