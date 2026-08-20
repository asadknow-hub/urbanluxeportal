import Image from "next/image";
import { HeroSearch } from "@/components/web/hero-search";
import { IMAGES } from "@/lib/web/listings";

function UlMonogram() {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      className="pointer-events-none absolute -left-2 -top-4 h-36 w-36 text-[#0B1D3D]/[0.08] sm:-left-4 sm:-top-6 sm:h-48 sm:w-48 md:-left-6 md:-top-10 md:h-56 md:w-56"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M40 36c0-8.837 7.163-16 16-16h128c8.837 0 16 7.163 16 16v108c0 35.346-28.654 64-64 64s-64-28.654-64-64V72H72v72c0 17.673 14.327 32 32 32s32-14.327 32-32V72h-16v108c0 26.51-21.49 48-48 48S24 206.51 24 180V36h16z"
      />
      <path
        fill="currentColor"
        d="M168 36h16v144c0 17.673-14.327 32-32 32h-16V36h32z"
      />
    </svg>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-[min(100svh,52rem)] overflow-hidden sm:min-h-[calc(100svh-4.25rem)]">
      <Image
        src={IMAGES.heroRefined}
        alt="Luxury penthouse terrace overlooking Dubai at dusk"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_35%] sm:object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/45 to-transparent sm:from-white/75 sm:via-white/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/55 via-transparent to-white/15 sm:from-white/20 sm:to-white/10" />

      <div className="relative mx-auto flex min-h-[min(100svh,52rem)] max-w-[1440px] flex-col justify-end px-4 pb-10 pt-12 sm:min-h-[calc(100svh-4.25rem)] sm:px-5 sm:pb-14 sm:pt-16 md:px-10 md:pb-20 md:pt-20">
        <div className="relative max-w-2xl">
          <UlMonogram />
          <h1 className="ul-hero-title relative text-[clamp(2.05rem,9vw,4.5rem)] leading-[1.08] text-[#0B1D3D]">
            Find your refined life.
          </h1>
          <div className="relative mt-7 sm:mt-10 md:mt-12">
            <HeroSearch />
          </div>
        </div>
      </div>
    </section>
  );
}
