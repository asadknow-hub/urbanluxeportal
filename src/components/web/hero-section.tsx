import Image from "next/image";
import { HeroSearch } from "@/components/web/hero-search";
import { IMAGES } from "@/lib/web/listings";

function UlMonogram() {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      className="pointer-events-none absolute -left-4 -top-6 h-48 w-48 text-[#0B1D3D]/[0.08] md:-left-6 md:-top-10 md:h-56 md:w-56"
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
    <section className="relative min-h-[calc(100svh-4.25rem)] overflow-hidden">
      <Image
        src={IMAGES.heroRefined}
        alt="Luxury penthouse terrace overlooking Dubai at dusk"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white/75 via-white/35 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-white/10" />

      <div className="relative mx-auto flex min-h-[calc(100svh-4.25rem)] max-w-[1440px] flex-col justify-end px-5 pb-14 pt-16 md:px-10 md:pb-20 md:pt-20">
        <div className="relative max-w-2xl">
          <UlMonogram />
          <h1 className="ul-hero-title relative text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.08] text-[#0B1D3D]">
            Find your refined life.
          </h1>
          <div className="relative mt-10 md:mt-12">
            <HeroSearch />
          </div>
        </div>
      </div>
    </section>
  );
}
