import Image from "next/image";
import Link from "next/link";
import { formatAed, type Listing } from "@/lib/web/listings";
import { cn } from "@/lib/utils";

export function PropertyCard({
  listing,
  featured = false,
  className,
}: {
  listing: Listing;
  featured?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={`/properties/${listing.slug}`}
      className={cn("group block", className)}
    >
      <div className={cn("relative overflow-hidden bg-[#1b2430]", featured ? "aspect-[4/5] md:aspect-[16/10]" : "aspect-[4/5]")}>
        <Image
          src={listing.image}
          alt={listing.title}
          fill
          sizes={featured ? "(max-width: 768px) 100vw, 70vw" : "(max-width: 768px) 100vw, 33vw"}
          className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14110e]/70 via-transparent to-transparent" />
        <p className="absolute left-4 top-4 bg-[#f6f3ee]/92 px-3 py-1 text-[0.62rem] font-medium tracking-[0.2em] uppercase text-[#14110e]">
          {listing.kind === "rent" ? "To let" : listing.kind === "offplan" ? "Off-plan" : "For sale"}
        </p>
        <div className="absolute inset-x-4 bottom-4 text-[#f6f3ee] md:inset-x-6 md:bottom-6">
          <p className="text-[0.65rem] tracking-[0.22em] uppercase text-[#b0893a]">{listing.community}</p>
          <h3 className="ul-display mt-1 text-2xl leading-tight md:text-3xl">{listing.title}</h3>
          <p className="mt-3 text-sm font-light tracking-wide">
            {formatAed(listing.priceAed, listing.kind)}
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
