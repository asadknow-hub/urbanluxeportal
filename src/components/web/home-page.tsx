import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { IMAGES } from "@/lib/web/listings";
import { HeroSection } from "@/components/web/hero-section";
import { Reveal } from "@/components/web/reveal";
import { cn } from "@/lib/utils";

const CATEGORY_CARDS = [
  {
    href: "/buy",
    image: IMAGES.night,
    panel: "bg-[var(--ul-primary)] text-white",
    wash: "from-[var(--ul-primary)]/55",
    kicker: "Buy",
    title: "Starting from AED 1.2M",
    link: "View properties",
  },
  {
    href: "/rent",
    image: IMAGES.living,
    panel: "bg-[var(--ul-tertiary)] text-[var(--ul-primary)]",
    wash: "from-[var(--ul-tertiary)]/80",
    kicker: "Rent",
    title: "Best price for luxury flats",
    link: "View properties",
  },
  {
    href: "/off-plan",
    image: IMAGES.marina,
    panel: "bg-[var(--ul-secondary)] text-white",
    wash: "from-[var(--ul-secondary)]/50",
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
    href: "/about",
  },
  {
    image: IMAGES.villa,
    panel: "bg-[var(--ul-tertiary)] text-[var(--ul-primary)]",
    title: "Villa sales reach new highs",
    href: "/buy",
  },
  {
    image: IMAGES.creek,
    panel: "bg-[var(--ul-secondary)] text-white",
    title: "Off-plan launches this quarter",
    href: "/off-plan",
  },
] as const;

function BrandImage({
  src,
  alt,
  wash,
  className,
}: {
  src: string;
  alt: string;
  wash?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative aspect-[4/3] overflow-hidden rounded-sm", className)}>
      <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
      {wash && (
        <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-tr to-transparent", wash)} />
      )}
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
      <HeroSection />

      {/* Category cards — Buy · Rent · Offplan · brand-washed · laptop viewport */}
      <section className="flex min-h-svh items-center bg-[var(--ul-tertiary)] px-5 py-12 md:px-10 md:py-16">
        <div className="mx-auto grid w-full max-w-[1280px] gap-6 md:grid-cols-3 md:gap-8">
          {CATEGORY_CARDS.map((card, i) => (
            <Reveal key={card.href} delay={i * 60}>
              <Link
                href={card.href}
                prefetch
                className="group flex h-full min-h-[22rem] flex-col overflow-hidden rounded-sm bg-white shadow-[0_8px_32px_rgba(11,29,61,0.08)] transition-shadow hover:shadow-[0_12px_40px_rgba(11,29,61,0.12)] md:min-h-[26rem]"
              >
                <div className="relative min-h-[14rem] flex-1 overflow-hidden md:min-h-[18rem]">
                  <Image
                    src={card.image}
                    alt={card.kicker}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent",
                      card.wash
                    )}
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

      {/* —— Section 3+: brand-aligned content —— */}

      <SplitSection
        bg="bg-white"
        image={
          <BrandImage
            src={IMAGES.interior}
            alt="Luxury interior in Dubai"
            wash="from-[var(--ul-primary)]/25"
          />
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

      <SplitSection
        bg="bg-[var(--ul-tertiary)]"
        reverse
        image={
          <BrandImage
            src={IMAGES.about}
            alt="Urban Luxe team"
            wash="from-[var(--ul-secondary)]/30"
          />
        }
      >
        <p className="ul-kicker">The team</p>
        <h2 className="ul-section-heading mt-3 text-3xl leading-tight md:text-4xl lg:text-[2.65rem]">
          See what you&apos;re missing out.
        </h2>
        <p className="ul-section-lede mt-5 max-w-md text-base leading-relaxed">
          Our agents know Dubai&apos;s neighbourhoods inside out. Get access to off-market listings
          and priority viewings before properties go public.
        </p>
        <Link href="/contact" prefetch className="ul-btn-secondary mt-8">
          Meet our team
        </Link>
      </SplitSection>

      <SplitSection
        bg="bg-white"
        image={
          <BrandImage
            src={IMAGES.house}
            alt="Property guides"
            wash="from-[var(--ul-primary)]/20"
          />
        }
      >
        <p className="ul-kicker">Expertise</p>
        <h2 className="ul-section-heading mt-3 text-3xl leading-tight md:text-4xl lg:text-[2.65rem]">
          Trusted experts, proven success.
        </h2>
        <p className="ul-section-lede mt-5 max-w-md text-base leading-relaxed">
          With years of experience across Dubai&apos;s prime communities, we deliver results —
          whether you&apos;re buying, renting, or investing off-plan.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href="/about" prefetch className="ul-btn-primary">
            About us
          </Link>
          <Link href="/contact" prefetch className="ul-link-arrow">
            Contact us <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </SplitSection>

      {/* Primary featured band */}
      <section className="bg-[var(--ul-primary)]">
        <div className="mx-auto grid max-w-[1280px] items-center gap-8 md:grid-cols-[1fr_auto]">
          <Reveal className="px-5 py-16 md:px-10 md:py-20">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[var(--ul-secondary)]">
              Dedicated service
            </p>
            <h2 className="mt-3 max-w-lg text-3xl leading-tight text-white md:text-4xl">
              Dedicated to achieving your goals — we make sure you choose your perfect home.
            </h2>
            <Link href="/contact" prefetch className="ul-link-arrow-light mt-8">
              Contact us <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <Reveal delay={80} className="hidden md:block">
            <div className="relative h-[28rem] w-[22rem] overflow-hidden">
              <Image
                src={IMAGES.penthouse}
                alt="Luxury penthouse interior"
                fill
                sizes="352px"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[var(--ul-primary)]/40 to-transparent" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Services bar */}
      <section className="border-y border-[var(--ul-hair)] bg-white px-5 py-12 md:px-10">
        <Reveal className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <p className="max-w-xl text-lg font-semibold text-[var(--ul-primary)] md:text-xl">
            We provide all kinds of real estate in all prime areas
          </p>
          <Link href="/communities" prefetch className="ul-link-arrow shrink-0">
            Learn more <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </section>

      {/* Secondary discover banner */}
      <section className="bg-[var(--ul-secondary)] px-5 py-16 text-center md:px-10 md:py-20">
        <Reveal>
          <h2 className="text-3xl font-semibold text-white md:text-4xl lg:text-5xl">
            Discover your home in Dubai
          </h2>
          <Link href="/buy" prefetch className="ul-link-arrow-light mt-6">
            View projects <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </section>

      <SplitSection
        bg="bg-[var(--ul-tertiary)]"
        image={
          <BrandImage
            src={IMAGES.pool}
            alt="Luxury pool and terrace"
            wash="from-[var(--ul-secondary)]/25"
          />
        }
      >
        <p className="ul-kicker">Platform</p>
        <h2 className="ul-section-heading mt-3 text-3xl leading-tight md:text-4xl">
          Convenience starting to find your next place
        </h2>
        <p className="ul-section-lede mt-5 max-w-md text-base leading-relaxed">
          Browse curated listings, schedule viewings online, and get expert advice — all from one
          platform built for Dubai real estate.
        </p>
        <Link href="/buy" prefetch className="ul-btn-primary mt-8">
          Browse listings
        </Link>
      </SplitSection>

      {/* Market snapshot */}
      <section className="relative overflow-hidden bg-[var(--ul-quaternary)]">
        <div className="relative aspect-[21/9] min-h-[16rem] md:min-h-[22rem]">
          <Image
            src={IMAGES.night}
            alt="Dubai skyline at night"
            fill
            sizes="100vw"
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-[var(--ul-primary)]/65" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
            <Reveal>
              <button
                type="button"
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-sm bg-white text-[var(--ul-primary)] shadow-lg ring-4 ring-[var(--ul-secondary)]/40 transition-transform hover:scale-105"
                aria-label="Play video"
              >
                <Play className="h-6 w-6 fill-current" />
              </button>
              <p className="text-sm font-semibold tracking-wide text-[var(--ul-secondary)]">
                Watch now
              </p>
              <h2 className="mt-2 max-w-lg text-2xl text-white md:text-3xl">
                Dubai Property Market Snapshot 2026
              </h2>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Featured */}
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
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={item.image}
                      alt=""
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

      {/* CTA */}
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
