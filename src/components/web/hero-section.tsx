"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Mouse } from "lucide-react";
import { HeroSearch } from "@/components/web/hero-search";
import { IMAGES } from "@/lib/web/listings";
import { cn } from "@/lib/utils";

const HERO_SLIDES = [
  {
    image: IMAGES.bedroom,
    location: "Palm Jumeirah, Dubai",
  },
  {
    image: IMAGES.villa,
    location: "Emirates Hills, Dubai",
  },
  {
    image: IMAGES.penthouse,
    location: "Downtown Dubai",
  },
  {
    image: IMAGES.marina,
    location: "Dubai Marina",
  },
  {
    image: IMAGES.terrace,
    location: "Dubai Creek Harbour",
  },
] as const;

const INTERVAL_MS = 6500;

export function HeroSection() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((dir: -1 | 1) => {
    setIndex((i) => (i + dir + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => go(1), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [go, paused, index]);

  const slide = HERO_SLIDES[index]!;

  return (
    <section
      className="relative flex h-[100svh] min-h-[36rem] flex-col overflow-hidden bg-[var(--ul-primary)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0">
        {HERO_SLIDES.map((item, i) => (
          <div
            key={item.image}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-out",
              i === index ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={i !== index}
          >
            <Image
              src={item.image}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className={cn(
                "object-cover object-center transition-transform duration-[6500ms] ease-out",
                i === index ? "scale-105" : "scale-100"
              )}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-[var(--ul-primary)]/12" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ul-primary)]/40 via-transparent to-[var(--ul-primary)]/18" />
      </div>

      <div className="ul-shell-wide relative flex min-h-0 flex-1 flex-col pt-[calc(5.5rem+var(--ul-safe-top,0px))] pb-8 sm:pb-10">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center">
          <HeroSearch />
        </div>

        <div className="mt-auto grid grid-cols-[1fr_auto_1fr] items-end gap-4 pt-8">
          <div className="min-w-0">
            <h1
              className="max-w-xl text-[clamp(2rem,5.5vw,3.75rem)] font-bold leading-[0.95] tracking-[-0.03em] text-white drop-shadow-[0_2px_18px_rgba(10,22,48,0.35)]"
              style={{ fontFamily: "var(--font-headline), var(--font-poppins), system-ui, sans-serif" }}
            >
              Dubai&apos;s Finest Homes
            </h1>
            <p className="mt-4 inline-flex max-w-full items-center rounded-full bg-[var(--ul-primary)]/55 px-3.5 py-1.5 text-[0.7rem] font-medium tracking-[0.04em] text-white ring-1 ring-white/25 backdrop-blur-md sm:text-xs">
              <span className="truncate">{slide.location}</span>
            </p>
          </div>

          <div className="hidden flex-col items-center gap-1.5 pb-1 text-white/90 drop-shadow sm:flex">
            <Mouse className="h-5 w-5" strokeWidth={1.4} aria-hidden />
            <span className="text-[0.62rem] font-semibold tracking-[0.22em] uppercase">Scroll</span>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ul-primary)]/55 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-[var(--ul-primary)]/75"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ul-primary)]/55 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-[var(--ul-primary)]/75"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
