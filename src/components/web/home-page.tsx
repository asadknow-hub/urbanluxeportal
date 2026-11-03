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
    <section className="bg-white py-10 md:py-14 lg:py-16">
      <div className="ul-shell-wide grid items-center gap-10 md:grid-cols-2 md:gap-16 xl:gap-24">
        <Reveal className={reverse ? "md:order-2" : "md:justify-self-start"}>
          {children}
        </Reveal>
        <Reveal delay={80} className={reverse ? "md:order-1 md:justify-self-start" : "md:justify-self-end"}>
          {image}
        </Reveal>
      </div>
    </section>
  );
}

function SectionHead({
  kicker,
  title,
  lede,
}: {
  kicker: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end">
      <div className="justify-self-start">
        <p className="ul-kicker">{kicker}</p>
        <h2 className="ul-section-heading mt-3 text-3xl md:text-4xl lg:text-[2.65rem]">{title}</h2>
      </div>
      {lede ? (
        <p className="max-w-xl text-base leading-relaxed text-[var(--ul-muted)] lg:justify-self-end lg:text-right">
          {lede}
        </p>
      ) : null}
    </div>
  );
}

export function HomePage() {
  return (
    <>
      <HeroSection />

      {/* Green-on-white callout — forest green, condensed type, left copy / right CTAs */}
      <section className="ul-band-dark -mt-2 pb-8 pt-2 md:pb-12">
        <div className="ul-shell-wide">
          <Reveal>
            <div className="ul-callout grid gap-8 md:grid-cols-[minmax(0,1.35fr)_auto] md:items-center md:gap-12">
              <div className="min-w-0 text-left">
                <p className="ul-callout-kicker">Zero hidden fees</p>
                <h2 className="ul-callout-title mt-3 text-[clamp(1.85rem,4.2vw,3.35rem)]">
                  Your home journey starts and ends here — free.
                </h2>
                <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-[#333333] sm:text-base">
                  From first viewing to final handover, UrbanLuxe guides every step with dedicated
                  specialists and transparent advice.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link href="/buy" prefetch className="ul-btn-primary">
                  Start now <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact" prefetch className="ul-btn-outline">
                  Talk to us
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Dark accent band mixed into light UI */}
      <section className="ul-band-dark py-10 md:py-14 lg:py-16">
        <div className="ul-shell-wide">
          <SectionHead
            kicker="How UrbanLuxe works"
            title="A clear path from brief to keys"
            lede="Left-to-right structure on every screen — value on one side, action on the other. No skinny middle brochure."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 70}>
                <article className="ul-card-dark flex h-full flex-col p-5 sm:p-6">
                  <span className="text-3xl font-extrabold tabular-nums text-[var(--ul-secondary)]">
                    {step.n}
                  </span>
                  <h3 className="mt-4 text-lg font-bold uppercase tracking-wide text-white">{step.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[#8ba0b8]">{step.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-10 md:py-14 lg:py-16">
        <div className="ul-shell-wide">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="justify-self-start">
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
                  className="group flex h-full min-h-[20rem] flex-col overflow-hidden rounded-2xl border border-[var(--ul-hair)] bg-white shadow-[0_8px_30px_rgba(7,17,31,0.05)] transition-transform duration-200 motion-safe:hover:-translate-y-0.5"
                >
                  <div className="relative min-h-[12rem] flex-1 overflow-hidden bg-[var(--ul-tertiary)] sm:min-h-[14rem]">
                    <Image
                      src={card.image}
                      alt={card.kicker}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col px-5 py-5 sm:px-6 sm:py-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ul-secondary)]">
                      {card.kicker}
                    </p>
                    <p className="mt-2 text-xl font-bold leading-snug tracking-tight text-[var(--ul-primary)] md:text-2xl">
                      {card.title}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ul-primary)] transition-all group-hover:gap-2.5">
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
        <Link href="/buy" prefetch className="ul-btn-primary mt-8 rounded-full">
          Start now
        </Link>
      </SplitSection>

      <section className="ul-band-dark py-16 md:py-24">
        <div className="ul-shell-wide grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white/5 md:aspect-[5/4]">
              <Image
                src={IMAGES.careers}
                alt="Urban Luxe team"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={80} className="md:justify-self-end md:text-right">
            <p className="ul-kicker">Careers</p>
            <h2 className="ul-section-heading mt-3 text-3xl text-white md:text-4xl lg:text-[2.75rem]">
              See what you&apos;re missing out on
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[#8ba0b8] md:ml-auto">
              We are always accepting online applications. Dubai awaits — are you ready to take the
              leap?
            </p>
            <Link href="/careers" prefetch className="ul-btn-primary mt-8 rounded-full">
              Get in touch
            </Link>
          </Reveal>
        </div>
      </section>

      <WhyAgentsSection />
      <MarketGrowthSection />
      <DevelopersMarquee />

      <section className="bg-white py-16 md:py-24">
        <div className="ul-shell-wide">
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
                  className="group block overflow-hidden rounded-2xl border border-[var(--ul-hair)] bg-white shadow-[0_8px_30px_rgba(7,17,31,0.05)]"
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
                  <div className="px-5 py-5">
                    <p className="text-lg font-bold leading-snug text-[var(--ul-primary)] md:text-xl">
                      {item.title}
                    </p>
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

      <section className="border-t border-[var(--ul-hair)] bg-[var(--ul-tertiary)] py-16 md:py-20">
        <Reveal className="ul-shell-wide flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="ul-kicker">Stay informed</p>
            <h2 className="ul-section-heading mt-3 text-2xl md:text-3xl">
              Keep up with what&apos;s happening
            </h2>
            <p className="ul-section-lede mt-3 max-w-md">
              Market updates, new launches, and expert insights — straight to your inbox.
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
