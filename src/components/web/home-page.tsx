import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IMAGES, listingsFor } from "@/lib/web/listings";
import { HeroSection } from "@/components/web/hero-section";
import { DevelopersMarquee } from "@/components/web/developers-marquee";
import { TestimonialsSection } from "@/components/web/testimonials-section";
import { PropertyCard } from "@/components/web/property-card";
import { Reveal } from "@/components/web/reveal";

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

      <section className="ul-band-light py-7 md:py-9">
        <div className="ul-shell-wide">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="ul-kicker">Explore</p>
              <h2 className="ul-section-heading mt-1.5 text-2xl md:text-3xl">Featured Categories</h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {CATEGORY_CARDS.map((card, i) => (
              <Reveal key={card.href} delay={i * 50}>
                <Link
                  href={card.href}
                  prefetch
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--ul-hair)] bg-white shadow-[0_10px_28px_rgba(10,22,48,0.1)] transition-shadow duration-300 hover:shadow-[0_16px_36px_rgba(10,22,48,0.14)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-[var(--ul-tertiary)]">
                    <Image
                      src={card.image}
                      alt={card.kicker}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-col px-4 py-3.5">
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--ul-primary)]">
                      {card.kicker}
                    </p>
                    <p className="mt-1 text-base font-bold leading-snug tracking-tight text-[var(--ul-primary)] md:text-lg">
                      {card.title}
                    </p>
                    <span className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--ul-primary)]">
                      {card.link} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="ul-band-light border-t border-[var(--ul-hair)] py-7 md:py-9">
        <div className="ul-shell-wide">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="ul-kicker">Acquire</p>
              <h2 className="ul-section-heading mt-1.5 text-2xl md:text-3xl">Buy Real Estate</h2>
            </div>
            <Link href="/buy" prefetch className="ul-link-arrow">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {buyListings.map((listing, i) => (
              <Reveal key={listing.slug} delay={i * 40}>
                <PropertyCard listing={listing} compact />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="ul-band-light border-t border-[var(--ul-hair)] py-7 md:py-9">
        <div className="ul-shell-wide">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="ul-kicker">Reside</p>
              <h2 className="ul-section-heading mt-1.5 text-2xl md:text-3xl">Properties For Rent</h2>
            </div>
            <Link href="/rent" prefetch className="ul-link-arrow">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {rentListings.map((listing, i) => (
              <Reveal key={listing.slug} delay={i * 40}>
                <PropertyCard listing={listing} compact />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <DevelopersMarquee />

      <TestimonialsSection />

      <section className="ul-band-light border-t border-[var(--ul-hair)] py-7 md:py-9">
        <Reveal className="ul-shell-wide flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="ul-kicker">Stay informed</p>
            <h2 className="ul-section-heading mt-1.5 text-xl md:text-2xl">
              Desk notes on pricing, launches, and communities
            </h2>
            <p className="ul-section-lede mt-2 max-w-md text-sm">
              Short briefs when a market moves or a launch is worth a private look. Ask us to add
              you to the list.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 md:justify-end">
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
