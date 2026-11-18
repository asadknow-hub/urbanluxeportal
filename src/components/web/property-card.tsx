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
  compact = false,
  className,
}: {
  listing: Listing;
  layout?: "tile" | "fill";
  compact?: boolean;
  className?: string;
}) {
  const { format } = useCurrency();

  return (
    <Link href={`/properties/${listing.slug}`} className={cn("group block h-full", className)}>
      <div
        className={cn(
          "relative h-full overflow-hidden bg-[var(--ul-primary)]",
          layout === "fill"
            ? "min-h-[18rem]"
            : compact
              ? "aspect-[5/4]"
              : "aspect-[4/5]"
        )}
      >
        <Image
          src={listing.image}
          alt={listing.title}
          fill
          sizes={
            layout === "fill"
              ? "(max-width: 768px) 100vw, 60vw"
              : compact
                ? "(max-width: 768px) 100vw, 25vw"
                : "(max-width: 768px) 100vw, 33vw"
          }
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1630]/80 via-[#0A1630]/15 to-transparent transition-colors duration-500 group-hover:from-[#0A1630]/90" />
        <p
          className={cn(
            "absolute bg-[#f6f3ee]/92 font-medium tracking-[0.2em] uppercase text-[#0A1630]",
            compact
              ? "left-3 top-3 px-2 py-0.5 text-[0.58rem]"
              : "left-4 top-4 px-3 py-1 text-[0.62rem]"
          )}
        >
          {listing.kind === "rent" ? "To let" : listing.kind === "offplan" ? "Off-plan" : "For sale"}
        </p>
        <span
          className={cn(
            "absolute inline-flex items-center gap-1 font-medium tracking-[0.18em] uppercase text-[#f6f3ee] opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            compact ? "right-3 top-3 text-[0.58rem]" : "right-4 top-4 text-[0.62rem]"
          )}
        >
          View <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
        <div
          className={cn(
            "absolute text-[#f6f3ee]",
            compact ? "inset-x-3 bottom-3" : "inset-x-4 bottom-4 md:inset-x-6 md:bottom-6"
          )}
        >
          <p className="text-[0.6rem] tracking-[0.18em] uppercase text-[var(--ul-secondary)]">
            {listing.community}
          </p>
          <h3
            className={cn(
              "ul-display mt-0.5 leading-tight",
              compact ? "text-lg md:text-xl" : "text-2xl md:text-[1.85rem]"
            )}
          >
            {listing.title}
          </h3>
          <p className={cn("font-light tracking-wide", compact ? "mt-1.5 text-xs" : "mt-3 text-sm")}>
            {format(listing.priceAed, { kind: listing.kind })}
            <span className="mx-1.5 text-[#f6f3ee]/40">·</span>
            {listing.beds} bed
            <span className="mx-1.5 text-[#f6f3ee]/40">·</span>
            {listing.sqft.toLocaleString()} sq.ft
          </p>
        </div>
      </div>
    </Link>
  );
}
