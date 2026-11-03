import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroSearch } from "@/components/web/hero-search";
import { IMAGES } from "@/lib/web/listings";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--ul-primary)]">
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
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ul-primary)] via-transparent to-[var(--ul-primary)]/30" />
      </div>

      {/* Full-bleed gutters — left copy / right tool, not a centered stack */}
      <div className="ul-shell-wide relative grid min-h-[min(92svh,52rem)] grid-cols-1 content-end gap-8 pb-28 pt-24 sm:pb-32 sm:pt-28 lg:min-h-[min(88svh,56rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,26rem)] lg:items-end lg:gap-12 lg:pb-36 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,28rem)] xl:gap-16">
        <div className="max-w-none lg:max-w-[40rem] xl:max-w-[46rem] lg:justify-self-start">
          <p className="ul-kicker">Private Dubai brokerage</p>
          <h1 className="ul-hero-title mt-4 text-[clamp(2.5rem,6.5vw,5rem)] font-extrabold uppercase leading-[0.96] tracking-[-0.045em] text-white">
            Find your
            <span className="block text-[var(--ul-secondary)]">refined life.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
            Villas, apartments, and off-plan residences — placed with discretion, not listed as
            noise.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/buy" prefetch className="ul-btn-primary rounded-full">
              Browse homes <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/sell" prefetch className="ul-btn-outline-light rounded-full">
              List your property
            </Link>
          </div>
        </div>

        <div className="ul-panel-light w-full justify-self-stretch p-4 sm:p-5 lg:justify-self-end lg:self-end">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[var(--ul-secondary)]">
            Search Dubai
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--ul-primary)]">
            Buy, rent, or off-plan — structured to your brief.
          </p>
          <div className="mt-4">
            <HeroSearch />
          </div>
        </div>
      </div>

      {/* Light sheet overlap — RealEstate.ae style transition into light UI */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 sm:h-14 md:h-16">
        <div className="ul-sheet h-full w-full" />
      </div>
    </section>
  );
}
