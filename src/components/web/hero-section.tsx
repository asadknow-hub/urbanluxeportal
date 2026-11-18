"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Mouse } from "lucide-react";
import { HeroSearch } from "@/components/web/hero-search";
import { cn } from "@/lib/utils";

/** Local webp slides — no remote Unsplash hop on first paint. */
const HERO_SLIDES = [
  "/hero/villa.webp",
  "/hero/living.webp",
  "/hero/penthouse.webp",
  "/hero/marina.webp",
  "/hero/terrace.webp",
] as const;

const INTERVAL_MS = 4500;

export function HeroSection() {
  const [index, setIndex] = useState(0);

  const go = useCallback((dir: -1 | 1) => {
    setIndex((i) => (i + dir + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => go(1), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [go]);

  return (
    <section className="relative flex h-[100svh] min-h-[36rem] flex-col overflow-hidden bg-[var(--ul-primary)]">
      <div className="absolute inset-0">
        {HERO_SLIDES.map((src, i) => (
          <div
            key={src}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-out",
              i === index ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={i !== index}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- local static webp, skip optimizer lag */}
            <img
              src={src}
              alt=""
              decoding={i === 0 ? "sync" : "async"}
              fetchPriority={i === 0 ? "high" : "low"}
              className={cn(
                "absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[4500ms] ease-out will-change-transform",
                i === index ? "scale-105" : "scale-100"
              )}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-[var(--ul-primary)]/12" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ul-primary)]/40 via-transparent to-[var(--ul-primary)]/18" />
      </div>

      {/* Hidden preload of remaining slides so the carousel never stalls. */}
      <div className="hidden" aria-hidden>
        {HERO_SLIDES.slice(1).map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" />
        ))}
      </div>

      <div className="ul-shell-wide relative flex min-h-0 flex-1 flex-col pt-[calc(5.5rem+var(--ul-safe-top,0px))] pb-8 sm:pb-10">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center pt-[12vh] sm:max-w-2xl sm:pt-[14vh]">
          <HeroSearch />
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div className="hidden flex-col items-center gap-1.5 pb-1 text-white/90 drop-shadow sm:flex sm:absolute sm:bottom-10 sm:left-1/2 sm:-translate-x-1/2">
            <Mouse className="h-5 w-5" strokeWidth={1.4} aria-hidden />
            <span className="text-[0.62rem] font-semibold tracking-[0.22em] uppercase">Scroll</span>
          </div>

          <div className="ml-auto flex gap-2">
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
