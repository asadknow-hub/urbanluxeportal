"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { type Listing } from "@/lib/web/listings";
import { useCurrency } from "@/components/web/currency-provider";
import { cn } from "@/lib/utils";

export function PropertyCard({
  listing,
  layout = "tile",
  className,
}: {
  listing: Listing;
  layout?: "tile" | "fill";
  className?: string;
}) {
  const { format } = useCurrency();

  return (
    <Link href={`/properties/${listing.slug}`} className={cn("group block h-full", className)}>
      <div
        className={cn(
          "relative h-full overflow-hidden bg-[#1b2430]",
          layout === "tile" ? "aspect-[4/5]" : "min-h-[22rem]"
        )}
      >
        <Image
          src={listing.image}
          alt={listing.title}
          fill
          sizes={layout === "fill" ? "(max-width: 768px) 100vw, 60vw" : "(max-width: 768px) 100vw, 33vw"}
          className="object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14110e]/80 via-[#14110e]/15 to-transparent transition-colors duration-500 group-hover:from-[#14110e]/90" />
        <p className="absolute left-4 top-4 bg-[#f6f3ee]/92 px-3 py-1 text-[0.62rem] font-medium tracking-[0.2em] uppercase text-[#14110e]">
          {listing.kind === "rent" ? "To let" : listing.kind === "offplan" ? "Off-plan" : "For sale"}
        </p>
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 text-[0.62rem] font-medium tracking-[0.18em] uppercase text-[#f6f3ee] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          View <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
        <div className="absolute inset-x-4 bottom-4 text-[#f6f3ee] md:inset-x-6 md:bottom-6">
          <p className="text-[0.65rem] tracking-[0.22em] uppercase text-[#2dd4bf]">{listing.community}</p>
          <h3 className="ul-display mt-1 text-2xl leading-tight md:text-[1.85rem]">{listing.title}</h3>
          <p className="mt-3 text-sm font-light tracking-wide">
            {format(listing.priceAed, { kind: listing.kind })}
            <span className="mx-2 text-[#f6f3ee]/40">·</span>
            {listing.beds} bed
            <span className="mx-2 text-[#f6f3ee]/40">·</span>
            {listing.sqft.toLocaleString()} sq.ft
          </p>
        </div>
      </div>
    </Link>
  );
}
