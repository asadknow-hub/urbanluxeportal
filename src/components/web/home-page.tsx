import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IMAGES } from "@/lib/web/listings";
import { HeroSection } from "@/components/web/hero-section";
import { HomeListingsShowcase } from "@/components/web/home-listings-showcase";
import { DevelopersMarquee } from "@/components/web/developers-marquee";
import { WhyAgentsSection } from "@/components/web/why-agents-section";
import { MarketGrowthSection } from "@/components/web/market-growth-section";
import { TestimonialsSection } from "@/components/web/testimonials-section";
import { Reveal } from "@/components/web/reveal";
import { cn } from "@/lib/utils";

const CATEGORY_CARDS = [
  {
    href: "/buy",
    image: IMAGES.villa,
    panel: "bg-[var(--ul-primary)] text-white",
    kicker: "Buy",
    title: "Starting from AED 1.2M",
    link: "View properties",
  },
  {
    href: "/rent",
    image: IMAGES.living,
    panel: "bg-[var(--ul-tertiary)] text-[var(--ul-primary)]",
    kicker: "Rent",
    title: "Best price for luxury flats",
    link: "View properties",
  },
  {
    href: "/off-plan",
    image: IMAGES.marina,
    panel: "bg-[var(--ul-secondary)] text-white",
    kicker: "Offplan",
    title: "New projects coming soon",
    link: "View projects",
  },
] as const;

const FEATURED_NEWS = [
  {
    image: IMAGES.downtown,
    panel: "bg-[var(--ul-primary)] text-white",
    title: "Downtown Dubai market update",
    href: "/insights",
  },
  {
    image: IMAGES.penthouse,
    panel: "bg-[var(--ul-tertiary)] text-[var(--ul-primary)]",
    title: "Villa sales reach new highs",
    href: "/insights",
  },
  {
    image: IMAGES.creek,
    panel: "bg-[var(--ul-secondary)] text-white",
    title: "Off-plan launches this quarter",
    href: "/insights",
  },
] as const;

function BrandImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={cn("relative aspect-[4/3] overflow-hidden rounded-sm bg-[var(--ul-tertiary)]", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
      />
    </div>
  );
}

function SplitSection({
  children,
  image,
  reverse = false,
  bg = "bg-white",
}: {
  children: ReactNode;
  image: ReactNode;
  reverse?: boolean;
  bg?: string;
}) {
  return (
    <section className={cn(bg, "px-5 py-16 md:px-10 md:py-24")}>
      <div className="mx-auto grid max-w-[1280px] items-center gap-10 md:grid-cols-2 md:gap-16">
        <Reveal className={reverse ? "md:order-2" : undefined}>{children}</Reveal>
        <Reveal delay={80} className={reverse ? "md:order-1" : undefined}>
          {image}
        </Reveal>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <>
      {/* 1 · Hero */}
      <HeroSection />

      {/* 2 · Categories — Buy · Rent · Offplan */}
      <section className="flex min-h-svh items-center bg-[var(--ul-tertiary)] px-5 py-12 md:px-10 md:py-16">
        <div className="mx-auto grid w-full max-w-[1280px] gap-6 md:grid-cols-3 md:gap-8">
          {CATEGORY_CARDS.map((card, i) => (
            <Reveal key={card.href} delay={i * 60}>
              <Link
                href={card.href}
                prefetch
                className="group flex h-full min-h-[22rem] flex-col overflow-hidden rounded-sm bg-white shadow-[0_8px_32px_rgba(11,29,61,0.08)] transition-shadow hover:shadow-[0_12px_40px_rgba(11,29,61,0.12)] md:min-h-[26rem]"
              >
                <div className="relative min-h-[14rem] flex-1 overflow-hidden bg-[var(--ul-tertiary)] md:min-h-[18rem]">
                  <Image
                    src={card.image}
                    alt={card.kicker}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className={cn("flex flex-col px-6 py-6 md:px-7 md:py-7", card.panel)}>
                  <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-80">
                    {card.kicker}
                  </p>
                  <p className="mt-2 text-xl font-semibold leading-snug tracking-tight md:text-2xl">
                    {card.title}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium opacity-90 transition-all group-hover:gap-2.5 md:text-base">
                    {card.link} <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 3 · Buy listings */}
      <HomeListingsShowcase kind="sale" />

      {/* 4 · Rent listings */}
      <HomeListingsShowcase kind="rent" />

      {/* 5 · Why Urban Luxe */}
      <SplitSection
        bg="bg-white"
        image={
          <BrandImage src={IMAGES.interior} alt="Luxury interior in Dubai" />
        }
      >
        <p className="ul-kicker">Our promise</p>
        <h2 className="ul-section-heading mt-3 text-3xl leading-tight md:text-4xl lg:text-[2.65rem]">
          Your home-buying journey starts and ends here, free.
        </h2>
        <p className="ul-section-lede mt-5 max-w-md text-base leading-relaxed">
          From first viewing to final handover — Urban Luxe guides you through every step with
          dedicated specialists and zero hidden fees.
        </p>
        <Link href="/buy" prefetch className="ul-btn-primary mt-8">
          Start now
        </Link>
      </SplitSection>

      {/* 6 · Join us (careers) */}
      <section className="bg-[var(--ul-secondary)] px-5 py-16 md:px-10 md:py-24">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--ul-primary)]/20 md:aspect-[5/4]">
              <Image
                src={IMAGES.careers}
                alt="Urban Luxe team"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <p className="text-sm font-medium text-white/80">Interested in joining us?</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-[2.75rem]">
              See what you&apos;re missing out on!
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/85">
              We are always accepting online applications. Dubai awaits — are you ready to take the
              leap?
            </p>
            <Link
              href="/careers"
              prefetch
              className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-[var(--ul-primary)] px-8 text-sm font-semibold text-white transition-colors hover:bg-[color-mix(in_srgb,var(--ul-primary)_88%,black)]"
            >
              Get in touch
            </Link>
          </Reveal>
        </div>
      </section>

      {/* 7 · Why our agents */}
      <WhyAgentsSection />

      {/* 8 · Market growth & appreciation */}
      <MarketGrowthSection />

      {/* 9 · Developers marquee */}
      <DevelopersMarquee />

      {/* 10 · Insights */}
      <section className="bg-white px-5 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1280px]">
          <Reveal>
            <p className="ul-kicker">Insights</p>
            <h2 className="ul-section-heading mb-10 mt-3 text-3xl md:text-4xl">Featured</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURED_NEWS.map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <Link
                  href={item.href}
                  prefetch
                  className="group block overflow-hidden rounded-sm shadow-[0_4px_24px_rgba(11,29,61,0.06)] transition-shadow hover:shadow-[0_8px_32px_rgba(11,29,61,0.1)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[var(--ul-tertiary)]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className={cn("px-6 py-5", item.panel)}>
                    <p className="text-lg font-semibold leading-snug md:text-xl">{item.title}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium opacity-90 transition-all group-hover:gap-2.5">
                      Read more <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 11 · Testimonials */}
      <TestimonialsSection />

      {/* 12 · CTA */}
      <section className="border-t border-[var(--ul-hair)] bg-[var(--ul-tertiary)] px-5 py-16 md:px-10 md:py-20">
        <Reveal className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="ul-kicker">Stay informed</p>
            <h2 className="ul-section-heading mt-3 text-2xl md:text-3xl">
              Keep up with what&apos;s happening
            </h2>
            <p className="ul-section-lede mt-3 max-w-md">
              Market updates, new launches, and expert insights — straight to your inbox.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" prefetch className="ul-btn-secondary">
              Get in touch
            </Link>
            <Link href="/buy" prefetch className="ul-btn-outline">
              Browse listings
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
