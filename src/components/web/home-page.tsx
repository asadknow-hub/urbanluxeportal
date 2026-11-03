import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IMAGES } from "@/lib/web/listings";
import { HeroSection } from "@/components/web/hero-section";
import { DevelopersMarquee } from "@/components/web/developers-marquee";
import { WhyAgentsSection } from "@/components/web/why-agents-section";
import { MarketGrowthSection } from "@/components/web/market-growth-section";
import { TestimonialsSection } from "@/components/web/testimonials-section";
import { Reveal } from "@/components/web/reveal";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    n: "01",
    title: "Tell us the brief",
    body: "Budget, community, lifestyle — we lock the criteria before we show a single home.",
  },
  {
    n: "02",
    title: "Private shortlist",
    body: "Curated buy, rent, and off-plan options — including quiet listings off the open portals.",
  },
  {
    n: "03",
    title: "Close with clarity",
    body: "Negotiation, paperwork, and handover handled end-to-end by one dedicated advisor.",
  },
] as const;

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
    title: "Best price for luxury flats",
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

const FEATURED_NEWS = [
  {
    image: IMAGES.downtown,
    title: "Downtown Dubai market update",
    href: "/insights/downtown-dubai-demand-this-season",
  },
  {
    image: IMAGES.penthouse,
    title: "Villa sales reach new highs",
    href: "/insights/villa-sales-reach-new-highs",
  },
  {
    image: IMAGES.creek,
    title: "Off-plan launches this quarter",
    href: "/insights/off-plan-launches-this-quarter",
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
    <div className={cn("relative aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--ul-tertiary)]", className)}>
      <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
    </div>
  );
}

function SplitSection({
  children,
  image,
  reverse = false,
}: {
  children: ReactNode;
  image: ReactNode;
  reverse?: boolean;
}) {
  return (
    <section className="bg-[var(--ul-primary)] px-0 py-14 sm:py-18 md:py-24">
      <div className="ul-shell grid items-center gap-10 md:grid-cols-2 md:gap-16">
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

      {/* How it works — structured 3-up like the reference */}
      <section className="bg-[var(--ul-primary)] py-14 md:py-20">
        <div className="ul-shell">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end lg:gap-12">
            <Reveal>
              <p className="ul-kicker">How UrbanLuxe works</p>
              <h2 className="ul-section-heading mt-3 text-3xl md:text-4xl lg:text-[2.75rem]">
                A clear path from brief to keys
              </h2>
            </Reveal>
            <Reveal delay={60}>
              <p className="max-w-2xl text-base leading-relaxed text-[var(--ul-muted)] lg:justify-self-end lg:text-right">
                No middle-of-the-page brochure fluff — a structured process built for serious buyers,
                tenants, and sellers across Dubai.
              </p>
            </Reveal>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 70}>
                <article className="ul-card-dark flex h-full flex-col p-5 sm:p-6">
                  <span className="text-3xl font-extrabold tabular-nums text-[var(--ul-secondary)]">
                    {step.n}
                  </span>
                  <h3 className="mt-4 text-lg font-bold uppercase tracking-wide text-white">{step.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--ul-muted)]">{step.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Green-on-white banner — reference callout */}
      <section className="bg-[var(--ul-primary)] pb-6 md:pb-10">
        <div className="ul-shell">
          <Reveal>
            <div className="ul-panel-light grid gap-6 p-6 sm:p-8 md:grid-cols-[1.2fr_0.8fr] md:items-center md:gap-10 md:p-10">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--ul-secondary)]">
                  Zero hidden fees
                </p>
                <h2 className="mt-3 text-3xl font-extrabold uppercase leading-[1.05] tracking-[-0.03em] text-[var(--ul-secondary)] md:text-4xl lg:text-[2.85rem]">
                  Your home journey starts and ends here — free.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-[#334155]">
                  From first viewing to final handover, UrbanLuxe guides every step with dedicated
                  specialists and transparent advice.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link href="/buy" prefetch className="ul-btn-primary">
                  Start now <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  prefetch
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-[#07111F]/15 px-5 text-[0.75rem] font-bold uppercase tracking-[0.06em] text-[#07111F] transition-colors hover:border-[var(--ul-secondary)] hover:text-[var(--ul-secondary)]"
                >
                  Talk to us
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-[var(--ul-primary)] py-14 md:py-20">
        <div className="ul-shell">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="ul-kicker">Explore</p>
              <h2 className="ul-section-heading mt-2 text-3xl md:text-4xl">Buy · Rent · Offplan</h2>
            </div>
            <Link href="/communities" prefetch className="ul-link-arrow">
              Browse communities <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3 md:gap-6">
            {CATEGORY_CARDS.map((card, i) => (
              <Reveal key={card.href} delay={i * 60}>
                <Link
                  href={card.href}
                  prefetch
                  className="group flex h-full min-h-[20rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--ul-tertiary)] transition-transform duration-200 motion-safe:hover:-translate-y-0.5"
                >
                  <div className="relative min-h-[12rem] flex-1 overflow-hidden sm:min-h-[14rem]">
                    <Image
                      src={card.image}
                      alt={card.kicker}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col bg-[var(--ul-paper)] px-5 py-5 text-[#07111F] sm:px-6 sm:py-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ul-secondary)]">
                      {card.kicker}
                    </p>
                    <p className="mt-2 text-xl font-bold leading-snug tracking-tight md:text-2xl">
                      {card.title}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#07111F] transition-all group-hover:gap-2.5">
                      {card.link} <ArrowRight className="h-4 w-4 text-[var(--ul-secondary)]" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SplitSection image={<BrandImage src={IMAGES.interior} alt="Luxury interior in Dubai" />}>
        <p className="ul-kicker">Our promise</p>
        <h2 className="ul-section-heading mt-3 text-3xl leading-tight md:text-4xl lg:text-[2.65rem]">
          Placed with the care of a private office
        </h2>
        <p className="ul-section-lede mt-5 max-w-lg text-base leading-relaxed">
          From first viewing to final handover — UrbanLuxe guides you through every step with
          dedicated specialists and zero hidden fees.
        </p>
        <Link href="/buy" prefetch className="ul-btn-primary mt-8">
          Start now
        </Link>
      </SplitSection>

      {/* Careers band */}
      <section className="bg-[var(--ul-tertiary)] py-16 md:py-24">
        <div className="ul-shell grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--ul-primary)]/40 md:aspect-[5/4]">
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
            <p className="ul-kicker">Careers</p>
            <h2 className="ul-section-heading mt-3 text-3xl md:text-4xl lg:text-[2.75rem]">
              See what you&apos;re missing out on
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--ul-muted)]">
              We are always accepting online applications. Dubai awaits — are you ready to take the
              leap?
            </p>
            <Link href="/careers" prefetch className="ul-btn-primary mt-8">
              Get in touch
            </Link>
          </Reveal>
        </div>
      </section>

      <WhyAgentsSection />
      <MarketGrowthSection />
      <DevelopersMarquee />

      <section className="bg-[var(--ul-primary)] py-16 md:py-24">
        <div className="ul-shell">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="ul-kicker">Insights</p>
                <h2 className="ul-section-heading mt-2 text-3xl md:text-4xl">Featured</h2>
              </div>
              <Link href="/insights" prefetch className="ul-link-arrow">
                All insights <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {FEATURED_NEWS.map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <Link
                  href={item.href}
                  prefetch
                  className="group block overflow-hidden rounded-2xl border border-white/10 bg-[var(--ul-tertiary)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="bg-[var(--ul-paper)] px-5 py-5 text-[#07111F]">
                    <p className="text-lg font-bold leading-snug md:text-xl">{item.title}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ul-secondary)] transition-all group-hover:gap-2.5">
                      Read more <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <section className="border-t border-white/10 bg-[var(--ul-quaternary)] py-16 md:py-20">
        <Reveal className="ul-shell flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
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
            <Link href="/contact" prefetch className="ul-btn-primary">
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
