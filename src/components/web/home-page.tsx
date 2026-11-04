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
import { CareersCanvasSection } from "@/components/web/careers-canvas-section";
import { HowItWorksSection } from "@/components/web/how-it-works-section";
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
  tone = "light",
}: {
  children: ReactNode;
  image: ReactNode;
  reverse?: boolean;
  tone?: "light" | "dark";
}) {
  return (
    <section
      className={cn(
        "py-10 md:py-14 lg:py-16",
        tone === "dark" ? "ul-band-dark" : "ul-band-light"
      )}
    >
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

export function HomePage() {
  return (
    <>
      {/* DARK */}
      <HeroSection />

      {/* LIGHT */}
      <section className="ul-band-light py-10 md:py-14 lg:py-16">
        <div className="ul-shell-wide">
          <Reveal>
            <div className="grid gap-8 md:grid-cols-[minmax(0,1.35fr)_auto] md:items-center md:gap-12">
              <div className="min-w-0 text-left">
                <p className="ul-callout-kicker">Zero hidden fees</p>
                <h2 className="ul-callout-title mt-3 text-[clamp(1.85rem,4.2vw,3.35rem)]">
                  Your home journey starts and ends here, free.
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

      {/* DARK */}
      <HowItWorksSection />

      {/* LIGHT */}
      <section className="ul-band-light py-12 md:py-16 lg:py-[4.5rem]">
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
                      i === 0 ? "min-h-[14rem] sm:min-h-[18rem] md:min-h-[20rem]" : "min-h-[10rem] sm:min-h-[11rem]"
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
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ul-secondary)]">
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
                      {card.link} <ArrowRight className="h-4 w-4 text-[var(--ul-secondary)]" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* DARK */}
      <SplitSection
        tone="dark"
        image={<BrandImage src={IMAGES.interior} alt="Luxury interior in Dubai" />}
      >
        <p className="ul-kicker">Our promise</p>
        <h2 className="ul-section-heading mt-3 text-3xl leading-tight text-white md:text-4xl lg:text-[2.65rem]">
          Placed with the care of a private office
        </h2>
        <p className="ul-section-lede mt-5 max-w-lg text-base leading-relaxed">
          Dedicated specialists on one thread. Transparent fees, patient negotiation, and paperwork
          that closes without you chasing updates.
        </p>
        <Link href="/buy" prefetch className="ul-btn-primary mt-8 rounded-full">
          Start now
        </Link>
      </SplitSection>

      {/* LIGHT */}
      <WhyAgentsSection />

      {/* DARK */}
      <MarketGrowthSection />

      {/* LIGHT */}
      <DevelopersMarquee />

      {/* DARK */}
      <CareersCanvasSection />

      {/* LIGHT */}
      <TestimonialsSection />

      {/* DARK */}
      <section className="ul-band-dark py-8 md:py-12 lg:py-14">
        <div className="ul-shell-wide">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="ul-kicker">Insights</p>
                <h2 className="ul-section-heading mt-2 text-3xl text-white md:text-4xl">Featured</h2>
              </div>
              <Link
                href="/insights"
                prefetch
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 transition-colors hover:text-[var(--ul-secondary)]"
              >
                All insights <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-2 md:grid-rows-2 md:gap-5">
            {FEATURED_NEWS.map((item, i) => (
              <Reveal
                key={item.title}
                delay={i * 60}
                className={cn(i === 0 && "md:row-span-2")}
              >
                <Link
                  href={item.href}
                  prefetch
                  className={cn(
                    "group flex h-full flex-col overflow-hidden bg-white",
                    i === 0 ? "border border-white/10" : "border-b border-white/10 md:border-0 md:bg-transparent"
                  )}
                >
                  <div
                    className={cn(
                      "relative overflow-hidden bg-[var(--ul-tertiary)]",
                      i === 0 ? "aspect-[4/3] md:min-h-[18rem] md:flex-1 md:aspect-auto" : "aspect-[16/10]"
                    )}
                  >
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes={i === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 25vw"}
                      className="object-cover"
                    />
                  </div>
                  <div className={cn("py-4", i === 0 ? "px-5 pb-5 md:px-6" : "px-0 pt-3 md:py-3")}>
                    <p
                      className={cn(
                        "font-bold leading-snug text-[var(--ul-primary)]",
                        i === 0 ? "text-xl md:text-2xl" : "text-base md:text-lg"
                      )}
                    >
                      {item.title}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ul-secondary)]">
                      Read more <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* LIGHT — then footer (dark) */}
      <section className="ul-band-light py-10 md:py-14 lg:py-16">
        <Reveal className="ul-shell-wide flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="ul-kicker">Stay informed</p>
            <h2 className="ul-section-heading mt-3 text-2xl md:text-3xl">
              Keep up with what&apos;s happening
            </h2>
            <p className="ul-section-lede mt-3 max-w-md">
              Market updates, new launches, and expert insights straight to your inbox.
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
