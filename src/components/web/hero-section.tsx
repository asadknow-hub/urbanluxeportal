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
          className="object-cover object-[center_35%] opacity-45 sm:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--ul-primary)] via-[var(--ul-primary)]/92 to-[var(--ul-primary)]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ul-primary)] via-transparent to-[var(--ul-primary)]/40" />
      </div>

      <div className="ul-shell relative grid min-h-[min(100svh,54rem)] grid-cols-1 items-end gap-10 pb-12 pt-16 sm:pb-16 sm:pt-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:pb-20 lg:pt-24">
        <div className="max-w-3xl">
          <p className="ul-kicker">Private Dubai brokerage</p>
          <h1 className="ul-hero-title mt-4 text-[clamp(2.4rem,7vw,4.75rem)] font-extrabold uppercase leading-[0.98] tracking-[-0.04em] text-white">
            Find your
            <span className="block text-[var(--ul-secondary)]">refined life.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--ul-muted)] sm:text-lg">
            Villas, apartments, and off-plan residences — placed with discretion, not listed as
            noise.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/buy" prefetch className="ul-btn-primary">
              Browse homes <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/sell" prefetch className="ul-btn-outline">
              List your property
            </Link>
          </div>
        </div>

        <div className="ul-panel-light w-full p-4 sm:p-5 md:p-6">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[var(--ul-secondary)]">
            Search Dubai
          </p>
          <p className="mt-1 text-sm font-semibold text-[#07111F]">
            Buy, rent, or off-plan — structured to your brief.
          </p>
          <div className="mt-4">
            <HeroSearch />
          </div>
        </div>
      </div>
    </section>
  );
}
