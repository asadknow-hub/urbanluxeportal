import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { KIND_META, listingsFor, type ListingKind } from "@/lib/web/listings";
import { HomePropertyCard } from "@/components/web/home-property-card";
import { Reveal } from "@/components/web/reveal";

export function HomeListingsShowcase({ kind }: { kind: Extract<ListingKind, "sale" | "rent"> }) {
  const meta = KIND_META[kind];
  const listings = listingsFor(kind).slice(0, 3);

  if (listings.length === 0) return null;

  return (
    <section
      className={
        kind === "sale"
          ? "bg-white px-4 py-12 sm:px-5 sm:py-16 md:px-10 md:py-24"
          : "bg-[var(--ul-tertiary)] px-4 py-12 sm:px-5 sm:py-16 md:px-10 md:py-24"
      }
    >
      <div className="mx-auto max-w-[1280px]">
        <Reveal className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 md:flex-row md:items-end">
          <div>
            <p className="ul-kicker">{meta.eyebrow}</p>
            <h2 className="ul-section-heading mt-3 text-2xl sm:text-3xl md:text-4xl">{meta.title}</h2>
            <p className="ul-section-lede mt-3 max-w-xl text-[0.9375rem] sm:text-base">{meta.lede}</p>
          </div>
          <Link href={meta.path} prefetch className="ul-link-arrow shrink-0">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
        <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
          {listings.map((listing, i) => (
            <Reveal key={listing.slug} delay={i * 70}>
              <HomePropertyCard listing={listing} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
