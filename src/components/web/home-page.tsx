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
    bg: "bg-[#0B1D3D]",
    text: "text-white",
    kicker: "Buy",
    title: "Starting from AED 1.2M",
    link: "View properties",
  },
  {
    href: "/rent",
    image: IMAGES.living,
    bg: "bg-[#F2F2F2]",
    text: "text-[#0B1D3D]",
    kicker: "Rent",
    title: "Best price for luxury flats",
    link: "View properties",
  },
  {
    href: "/off-plan",
    image: IMAGES.marina,
    bg: "bg-[#E1EBF2]",
    text: "text-[#0B1D3D]",
    kicker: "Offplan",
    title: "New projects coming soon",
    link: "View projects",
  },
] as const;

const FEATURED_NEWS = [
  {
    image: IMAGES.downtown,
    bg: "bg-[#0B1D3D]",
    text: "text-white",
    title: "Downtown Dubai market update",
    href: "/about",
  },
  {
    image: IMAGES.villa,
    bg: "bg-[#E8E4DE]",
    text: "text-[#0B1D3D]",
    title: "Villa sales reach new highs",
    href: "/buy",
  },
  {
    image: IMAGES.creek,
    bg: "bg-[#DCE8EF]",
    text: "text-[#0B1D3D]",
    title: "Off-plan launches this quarter",
    href: "/off-plan",
  },
] as const;

export function HomePage() {
  return (
    <>
      <HeroSection />

      {/* Category cards — Buy · Rent · Offplan only */}
      <section className="isolate bg-white px-5 py-10 md:px-10 md:py-14">
        <div className="mx-auto grid max-w-[1440px] gap-5 md:grid-cols-3">
          {CATEGORY_CARDS.map((card, i) => (
            <Reveal key={card.href} delay={i * 60}>
              <Link
                href={card.href}
                prefetch
                className="group flex h-full flex-col overflow-hidden rounded-xl shadow-[0_4px_24px_rgba(11,29,61,0.06)] transition-shadow hover:shadow-[0_8px_32px_rgba(11,29,61,0.1)]"
              >
                <div className="relative aspect-[16/11] overflow-hidden">
                  <Image
                    src={card.image}
                    alt={card.kicker}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className={cn("flex flex-1 flex-col px-6 py-6", card.bg, card.text)}>
                  <p className="text-[0.6875rem] font-semibold tracking-[0.18em] uppercase opacity-75">
                    {card.kicker}
                  </p>
                  <p className="mt-2 text-xl font-semibold leading-snug tracking-tight md:text-[1.35rem]">
                    {card.title}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium opacity-90 transition-all group-hover:gap-2.5">
                    {card.link} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Journey section */}
      <section className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-16 md:grid-cols-2 md:gap-16 md:px-10 md:py-24">
        <Reveal>
          <h2 className="text-3xl leading-tight text-[#0B1D3D] md:text-4xl lg:text-[2.75rem]">
            Your home-buying journey starts and ends here, free.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[#6b7280]">
            From first viewing to final handover — UrbanLuxe guides you through every step with
            dedicated specialists and zero hidden fees.
          </p>
          <Link href="/buy" prefetch className="ul-btn-primary mt-8">
            Start now
          </Link>
        </Reveal>
        <Reveal delay={100}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
            <Image
              src={IMAGES.interior}
              alt="Luxury interior in Dubai"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </section>

      {/* Team section */}
      <section className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-16 md:grid-cols-2 md:gap-16 md:px-10 md:py-24">
        <Reveal className="order-2 md:order-1">
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
            <Image
              src={IMAGES.about}
              alt="UrbanLuxe team"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </Reveal>
        <Reveal delay={80} className="order-1 md:order-2">
          <h2 className="text-3xl leading-tight text-[#0B1D3D] md:text-4xl lg:text-[2.75rem]">
            See what you&apos;re missing out.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[#6b7280]">
            Our agents know Dubai&apos;s neighbourhoods inside out. Get access to off-market listings
            and priority viewings before properties go public.
          </p>
          <Link href="/contact" prefetch className="ul-btn-primary mt-8">
            Meet our team
          </Link>
        </Reveal>
      </section>

      {/* Trusted experts */}
      <section className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-16 md:grid-cols-2 md:gap-16 md:px-10 md:py-24">
        <Reveal>
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
            <Image
              src={IMAGES.house}
              alt="Property guides"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="text-3xl leading-tight text-[#0B1D3D] md:text-4xl lg:text-[2.75rem]">
            Trusted experts, proven success.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[#6b7280]">
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
        </Reveal>
      </section>

      {/* Dark featured band */}
      <section className="bg-[#0B1D3D]">
        <div className="mx-auto grid max-w-[1440px] items-center gap-8 md:grid-cols-[1fr_auto]">
          <Reveal className="px-5 py-16 md:px-10 md:py-20">
            <h2 className="max-w-lg text-3xl leading-tight text-white md:text-4xl">
              Dedicated to achieving your goals — we make sure you choose your perfect home.
            </h2>
            <Link
              href="/contact"
              prefetch
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white transition-all hover:gap-3"
            >
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
            </div>
          </Reveal>
        </div>
      </section>

      {/* Services bar */}
      <section className="border-y border-[#e5e7eb] bg-white px-5 py-10 md:px-10">
        <Reveal className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <p className="max-w-xl text-lg font-medium text-[#0B1D3D] md:text-xl">
            We provide all kinds of real estate in all prime areas
          </p>
          <Link href="/communities" prefetch className="ul-link-arrow shrink-0">
            Learn more <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </section>

      {/* Discover banner */}
      <section className="bg-[#0B1D3D] px-5 py-16 text-center md:px-10 md:py-20">
        <Reveal>
          <h2 className="text-3xl text-white md:text-4xl lg:text-5xl">
            Discover your home in Dubai
          </h2>
          <Link
            href="/buy"
            prefetch
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white transition-all hover:gap-3"
          >
            View projects <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </section>

      {/* Convenience section */}
      <section className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-16 md:grid-cols-2 md:gap-16 md:px-10 md:py-24">
        <Reveal>
          <h2 className="text-3xl leading-tight text-[#0B1D3D] md:text-4xl">
            Convenience starting to find your next place
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[#6b7280]">
            Browse curated listings, schedule viewings online, and get expert advice — all from one
            platform built for Dubai real estate.
          </p>
          <Link href="/buy" prefetch className="ul-btn-primary mt-8">
            Browse listings
          </Link>
        </Reveal>
        <Reveal delay={80}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-[#F2F2F2]">
            <Image
              src={IMAGES.pool}
              alt="Luxury pool and terrace"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </section>

      {/* Video / market snapshot */}
      <section className="relative overflow-hidden">
        <div className="relative aspect-[21/9] min-h-[16rem] md:min-h-[22rem]">
          <Image
            src={IMAGES.night}
            alt="Dubai skyline at night"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#0B1D3D]/50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
            <Reveal>
              <button
                type="button"
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-[#0B1D3D] shadow-lg transition-transform hover:scale-105"
                aria-label="Play video"
              >
                <Play className="h-6 w-6 fill-current" />
              </button>
              <p className="text-sm font-medium tracking-wide text-white/80">Watch now</p>
              <h2 className="mt-2 max-w-lg text-2xl text-white md:text-3xl">
                Dubai Property Market Snapshot 2026
              </h2>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Featured news */}
      <section className="px-5 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1440px]">
          <Reveal>
            <h2 className="mb-10 text-3xl text-[#0B1D3D] md:text-4xl">Featured</h2>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURED_NEWS.map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <Link href={item.href} prefetch className="group block overflow-hidden rounded-sm">
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className={`${item.bg} ${item.text} px-5 py-4`}>
                    <p className="font-semibold leading-snug">{item.title}</p>
                    <span className="mt-2 inline-flex items-center gap-1.5 text-sm opacity-90 group-hover:gap-2.5 transition-all">
                      Read more <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="border-t border-[#e5e7eb] bg-[#F2F2F2] px-5 py-16 md:px-10 md:py-20">
        <Reveal className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl text-[#0B1D3D] md:text-3xl">Keep up with what&apos;s happening</h2>
            <p className="mt-3 max-w-md text-[#6b7280]">
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
