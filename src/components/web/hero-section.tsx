import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroSearch } from "@/components/web/hero-search";
import { IMAGES } from "@/lib/web/listings";

export function HeroSection() {
  return (
    <section className="relative h-[75svh] max-h-[44rem] min-h-[28rem] overflow-hidden bg-[var(--ul-primary)]">
      <div className="absolute inset-0">
        <Image
          src={IMAGES.heroRefined}
          alt="Luxury penthouse terrace overlooking Dubai at dusk"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%] opacity-55 sm:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--ul-primary)]/95 via-[var(--ul-primary)]/75 to-[var(--ul-primary)]/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ul-primary)] via-transparent to-[var(--ul-primary)]/25" />
      </div>

      <div className="ul-shell-wide relative flex h-full grid-cols-1 flex-col justify-end gap-6 pb-14 pt-[calc(4.5rem+var(--ul-safe-top,0px))] sm:pb-16 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,26rem)] lg:items-end lg:gap-12 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,28rem)] xl:gap-16">
        <div className="max-w-none lg:max-w-[42rem] lg:justify-self-start">
          <p className="ul-kicker">Private Dubai brokerage</p>
          <h1 className="ul-hero-title mt-3 text-[clamp(2.1rem,5.5vw,4.25rem)] font-bold uppercase tracking-[-0.04em] text-white">
            Find your
            <span className="block text-[var(--ul-secondary)]">refined life.</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
            Villas, apartments, and off-plan residences — placed with discretion, not listed as
            noise.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/buy" prefetch className="ul-btn-primary">
              Browse homes <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/sell" prefetch className="ul-btn-outline-light">
              List your property
            </Link>
          </div>
        </div>

        <div className="ul-panel-light w-full p-4 sm:p-5 lg:justify-self-end">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[var(--ul-secondary)]">
            Search Dubai
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--ul-primary)]">
            Buy, rent, or off-plan — structured to your brief.
          </p>
          <div className="mt-3">
            <HeroSearch />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 sm:h-10">
        <div className="ul-sheet h-full w-full" />
      </div>
    </section>
  );
}
