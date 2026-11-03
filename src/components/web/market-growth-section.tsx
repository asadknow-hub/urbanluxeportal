"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

const TOWERS = [
  { name: "Hills Estate", gain: 14, height: 42 },
  { name: "Marina", gain: 16, height: 52 },
  { name: "Downtown", gain: 19, height: 64 },
  { name: "Creek Harbour", gain: 22, height: 78 },
  { name: "Palm Jumeirah", gain: 24, height: 92 },
] as const;

const STATS = [
  {
    value: "+18.4%",
    label: "Average appreciation",
    sub: "Prime Dubai communities, 2024–2026",
  },
  {
    value: "AED 420K",
    label: "Median capital gain",
    sub: "On AED 2.3M entry purchases",
  },
  {
    value: "94%",
    label: "Positive returns",
    sub: "UrbanLuxe buyers at resale",
  },
  {
    value: "+62%",
    label: "Portfolio growth",
    sub: "Indexed since 2020",
  },
] as const;

function Tower({
  name,
  gain,
  height,
  active,
  onFocus,
}: {
  name: string;
  gain: number;
  height: number;
  active: boolean;
  onFocus: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onFocus}
      onFocus={onFocus}
      className={cn(
        "group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end outline-none",
        active && "z-[1]"
      )}
      aria-label={`${name}: +${gain}% year on year`}
    >
      <span
        className={cn(
          "mb-2 text-[clamp(0.95rem,2.2vw,1.55rem)] font-bold tabular-nums tracking-tight text-[#F6F3EE] transition-opacity",
          active ? "opacity-100" : "opacity-80"
        )}
        style={{ fontFamily: "var(--font-headline), var(--font-poppins), system-ui, sans-serif" }}
      >
        +{gain}%
      </span>
      <span
        className={cn(
          "relative w-[72%] max-w-[5.5rem] overflow-hidden rounded-sm transition-[filter,transform] duration-300 sm:w-[68%] md:max-w-[6.5rem]",
          active ? "brightness-125" : "brightness-100 group-hover:brightness-110"
        )}
        style={{ height: `${height}%` }}
        aria-hidden
      >
        <span
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(246,243,238,0.55) 0 1.5px, transparent 1.5px 7px)",
            backgroundColor: "rgba(246,243,238,0.04)",
          }}
        />
        <span className="absolute inset-x-0 bottom-0 h-px bg-[#F6F3EE]/35" />
      </span>
      <span
        className={cn(
          "mt-3 max-w-[6.5rem] text-center text-[0.62rem] font-semibold uppercase leading-tight tracking-[0.08em] text-[#F6F3EE]/55 transition-colors sm:text-[0.68rem]",
          active && "text-[#F6F3EE]/90"
        )}
      >
        {name}
      </span>
    </button>
  );
}

export function MarketGrowthSection() {
  const [active, setActive] = useState(0);
  const gradId = useId().replace(/:/g, "");
  const selected = TOWERS[active] ?? TOWERS[0];

  return (
    <section className="ul-band-dark relative flex h-[100svh] min-h-[34rem] flex-col overflow-hidden">
      <div className="ul-shell-wide relative flex min-h-0 flex-1 flex-col py-6 md:py-8 lg:py-10">
        {/* Header */}
        <div className="grid shrink-0 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start">
          <h2 className="ul-section-heading text-[clamp(2.4rem,7vw,5.25rem)] leading-[0.88] text-[#F6F3EE]">
            <span className="block">Real growth.</span>
            <span
              className="mt-1 block text-transparent"
              style={{
                WebkitTextStroke: "1.5px #F6F3EE",
              }}
            >
              Real returns.
            </span>
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-[#F6F3EE]/55 lg:justify-self-end lg:pt-2 lg:text-right md:text-[0.95rem]">
            Track how prime communities have appreciated — and what UrbanLuxe clients have typically
            earned on resale and handover.
          </p>
        </div>

        {/* Chart canvas */}
        <div className="relative mt-5 flex min-h-0 flex-1 flex-col md:mt-6">
          <div className="relative min-h-0 flex-1">
            {/* Index line */}
            <svg
              className="pointer-events-none absolute inset-x-0 top-[8%] bottom-[18%] z-0 h-auto w-full"
              viewBox="0 0 1000 320"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <linearGradient id={`ul-line-${gradId}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3DDC97" stopOpacity="0.35" />
                  <stop offset="50%" stopColor="#3DDC97" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3DDC97" stopOpacity="0.85" />
                </linearGradient>
                <filter id={`ul-glow-${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M40 250 C 180 235, 320 200, 480 150 S 780 70, 960 48"
                fill="none"
                stroke={`url(#ul-line-${gradId})`}
                strokeWidth="3"
                strokeLinecap="round"
                filter={`url(#ul-glow-${gradId})`}
              />
              <circle cx="40" cy="250" r="5.5" fill="#3DDC97" />
              <circle cx="960" cy="48" r="5.5" fill="#3DDC97" />
            </svg>

            <p className="pointer-events-none absolute left-0 top-[58%] z-[1] hidden text-[0.65rem] font-medium tracking-wide text-[#3DDC97]/90 sm:block md:top-[62%]">
              2020 index 100
            </p>
            <p className="pointer-events-none absolute right-0 top-[6%] z-[1] hidden text-right text-[0.65rem] font-medium tracking-wide text-[#3DDC97]/90 sm:block">
              2026 index 178
            </p>

            <div className="relative z-[1] flex h-full min-h-[14rem] items-end gap-2 pb-1 pt-8 sm:gap-3 md:min-h-0 md:gap-4 md:pt-10">
              {TOWERS.map((tower, i) => (
                <Tower
                  key={tower.name}
                  {...tower}
                  active={active === i}
                  onFocus={() => setActive(i)}
                />
              ))}
            </div>
          </div>

          <div className="mt-3 flex shrink-0 flex-col gap-1 sm:mt-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-[0.7rem] text-[#F6F3EE]/45 md:text-xs">
              Hover or tab to a tower to read its yearly appreciation.
              <span className="ml-1 text-[#F6F3EE]/75">
                {selected.name}: +{selected.gain}% YoY
              </span>
            </p>
            <p className="max-w-md text-[0.7rem] text-[#F6F3EE]/40 sm:text-right md:text-xs">
              Tower height = appreciation, % year on year. Line = prime Dubai price index (2020 =
              100).
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-5 grid shrink-0 grid-cols-2 gap-y-5 border-t border-[#F6F3EE]/12 pt-5 sm:mt-6 sm:grid-cols-4 sm:gap-0 sm:pt-6 md:mt-8">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "px-0 sm:px-4 md:px-5",
                i > 0 && "sm:border-l sm:border-[#F6F3EE]/12",
                i === 0 && "sm:pl-0",
                i === STATS.length - 1 && "sm:pr-0"
              )}
            >
              <p
                className="text-[clamp(1.35rem,2.8vw,2rem)] font-bold tracking-tight text-[#F6F3EE]"
                style={{ fontFamily: "var(--font-headline), var(--font-poppins), system-ui, sans-serif" }}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#F6F3EE]/85 md:text-sm">{stat.label}</p>
              <p className="mt-0.5 text-[0.68rem] leading-snug text-[#F6F3EE]/40 md:text-xs">
                {stat.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
