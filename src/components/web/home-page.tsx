import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IMAGES, listingsFor } from "@/lib/web/listings";
import { HeroSection } from "@/components/web/hero-section";
import { DevelopersMarquee } from "@/components/web/developers-marquee";
import { TestimonialsSection } from "@/components/web/testimonials-section";
import { PropertyCard } from "@/components/web/property-card";
import { Reveal } from "@/components/web/reveal";
import { cn } from "@/lib/utils";

const CATEGORY_CARDS = [
  {
    href: "/buy",
    image: IMAGES.villa,
    kicker: "Buy",
    title: "Starting from AED 1.2M",
    link: "View properties",
  },
  {
    href: "/rent",
    image: IMAGES.living,
    kicker: "Rent",
    title: "Annual lets in better buildings",
    link: "View properties",
  },
  {
    href: "/off-plan",
    image: IMAGES.marina,
    kicker: "Offplan",
    title: "New launches & payment plans",
    link: "View projects",
  },
] as const;

export function HomePage() {
  const buyListings = listingsFor("sale").slice(0, 4);
  const rentListings = listingsFor("rent").slice(0, 4);

  return (
    <>
      <HeroSection />

      <section className="ul-band-light py-12 md:py-16 lg:py-[4.5rem]">
        <div className="ul-shell-wide">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="ul-kicker">Explore</p>
              <h2 className="ul-section-heading mt-2 text-3xl md:text-4xl">Featured Categories</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 md:grid-rows-2 md:gap-6">
            {CATEGORY_CARDS.map((card, i) => (
              <Reveal
                key={card.href}
                delay={i * 60}
                className={cn(i === 0 && "md:row-span-2")}
              >
                <Link
                  href={card.href}
                  prefetch
                  className={cn(
                    "group flex h-full flex-col overflow-hidden border border-[var(--ul-hair)] bg-white",
                    i === 0 ? "min-h-[22rem] md:min-h-full" : "min-h-[16rem]"
                  )}
                >
                  <div
                    className={cn(
                      "relative flex-1 overflow-hidden bg-[var(--ul-tertiary)]",
                      i === 0
                        ? "min-h-[14rem] sm:min-h-[18rem] md:min-h-[20rem]"
                        : "min-h-[10rem] sm:min-h-[11rem]"
                    )}
                  >
                    <Image
                      src={card.image}
                      alt={card.kicker}
                      fill
                      sizes={i === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 25vw"}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col px-5 py-5 sm:px-6 sm:py-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ul-primary)]">
                      {card.kicker}
                    </p>
                    <p
                      className={cn(
                        "mt-2 font-bold leading-snug tracking-tight text-[var(--ul-primary)]",
                        i === 0 ? "text-xl md:text-2xl lg:text-[1.65rem]" : "text-lg md:text-xl"
                      )}
                    >
                      {card.title}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ul-primary)]">
                      {card.link} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="ul-band-light border-t border-[var(--ul-hair)] py-12 md:py-16">
        <div className="ul-shell-wide">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="ul-kicker">Acquire</p>
              <h2 className="ul-section-heading mt-2 text-3xl md:text-4xl">Buy Real Estate</h2>
            </div>
            <Link href="/buy" prefetch className="ul-link-arrow">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {buyListings.map((listing, i) => (
              <Reveal key={listing.slug} delay={i * 50}>
                <PropertyCard listing={listing} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="ul-band-light border-t border-[var(--ul-hair)] py-12 md:py-16">
        <div className="ul-shell-wide">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="ul-kicker">Reside</p>
              <h2 className="ul-section-heading mt-2 text-3xl md:text-4xl">Properties For Rent</h2>
            </div>
            <Link href="/rent" prefetch className="ul-link-arrow">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rentListings.map((listing, i) => (
              <Reveal key={listing.slug} delay={i * 50}>
                <PropertyCard listing={listing} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <DevelopersMarquee />

      <TestimonialsSection />

      <section className="ul-band-light border-t border-[var(--ul-hair)] py-9 md:py-12 lg:py-[3.75rem]">
        <Reveal className="ul-shell-wide flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="ul-kicker">Stay informed</p>
            <h2 className="ul-section-heading mt-3 text-2xl md:text-3xl">
              Desk notes on pricing, launches, and communities
            </h2>
            <p className="ul-section-lede mt-3 max-w-md">
              Short briefs when a market moves or a launch is worth a private look. Ask us to add
              you to the list.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href="/contact" prefetch className="ul-btn-primary rounded-full">
              Get in touch
            </Link>
            <Link href="/buy" prefetch className="ul-btn-outline rounded-full">
              Browse listings
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
