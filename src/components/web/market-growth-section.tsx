"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

const TOWERS = [
  { name: "Hills Estate", gain: 12.5, height: 38 },
  { name: "Marina", gain: 14.2, height: 48 },
  { name: "Downtown", gain: 16.9, height: 60 },
  { name: "Creek Harbour", gain: 19.6, height: 74 },
  { name: "Palm Jumeirah", gain: 21.4, height: 90 },
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

function formatGain(gain: number) {
  return Number.isInteger(gain) ? `${gain}` : gain.toFixed(1);
}

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
      aria-label={`${name}: +${formatGain(gain)}% year on year`}
    >
      <span
        className={cn(
          "mb-2.5 text-[clamp(1.05rem,2.4vw,1.65rem)] font-bold tabular-nums tracking-tight text-[#F6F3EE] transition-opacity",
          active ? "opacity-100" : "opacity-75"
        )}
        style={{ fontFamily: "var(--font-headline), var(--font-poppins), system-ui, sans-serif" }}
      >
        +{formatGain(gain)}%
      </span>

      <span
        className={cn(
          "relative w-[78%] max-w-[7rem] overflow-hidden transition-[filter,opacity,transform] duration-300 sm:w-[72%] md:max-w-[8.5rem] lg:max-w-[9.5rem]",
          active ? "opacity-100" : "opacity-80 group-hover:opacity-95"
        )}
        style={{ height: `${height}%` }}
        aria-hidden
      >
        <span
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(246,243,238,0.62) 0 1px, transparent 1px 5px)",
            backgroundColor: "rgba(10, 22, 48, 0.35)",
            boxShadow: active
              ? "inset 0 0 0 1px rgba(246,243,238,0.18)"
              : "inset 0 0 0 1px rgba(246,243,238,0.08)",
          }}
        />
      </span>

      <span
        className={cn(
          "mt-3 max-w-[7.5rem] text-center text-[0.64rem] font-semibold uppercase leading-tight tracking-[0.1em] text-[#F6F3EE]/45 transition-colors sm:text-[0.7rem]",
          active && "text-[#F6F3EE]/85"
        )}
      >
        {name}
      </span>
    </button>
  );
}

export function MarketGrowthSection() {
  const [active, setActive] = useState(2);
  const gradId = useId().replace(/:/g, "");
  const selected = TOWERS[active] ?? TOWERS[2];

  return (
    <section className="relative flex h-[100svh] min-h-[36rem] flex-col overflow-hidden bg-[var(--ul-primary)] text-[#F6F3EE]">
      {/* Soft wash — matches design depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 55% at 12% 88%, rgba(246,243,238,0.04), transparent 50%)",
        }}
      />

      <div className="ul-shell-wide relative flex min-h-0 flex-1 flex-col pb-6 pt-[calc(3.75rem+var(--ul-safe-top,0px))] md:pb-8 lg:pb-10">
        {/* Header */}
        <header className="grid shrink-0 gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-start lg:gap-10">
          <h2
            className="text-[clamp(2.6rem,6.8vw,5.5rem)] font-bold uppercase leading-[0.86] tracking-[-0.03em] text-[#F6F3EE]"
            style={{ fontFamily: "var(--font-headline), var(--font-poppins), system-ui, sans-serif" }}
          >
            <span className="block">Real growth.</span>
            <span className="mt-1 block text-[#F6F3EE]">Real returns.</span>
          </h2>
          <p className="max-w-md text-[0.9rem] leading-relaxed text-[#F6F3EE]/78 lg:justify-self-end lg:pt-3 lg:text-right md:text-[0.95rem]">
            Prime Dubai has climbed every year since 2020. Here is how its communities have
            appreciated, and what UrbanLuxe clients have typically earned at resale and handover.
          </p>
        </header>

        {/* Chart */}
        <div className="relative mt-4 flex min-h-0 flex-1 flex-col md:mt-5 lg:mt-6">
          <div className="relative min-h-0 flex-1">
            <svg
              className="pointer-events-none absolute inset-0 z-0 h-full w-full"
              viewBox="0 0 1000 420"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <linearGradient id={`ul-line-${gradId}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#008040" stopOpacity="0.25" />
                  <stop offset="35%" stopColor="#008040" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#008040" stopOpacity="1" />
                </linearGradient>
              </defs>
              {/* Curve sits mid-canvas so it threads the towers */}
              <path
                d="M 28 318 C 160 300, 280 268, 420 210 S 700 110, 920 72"
                fill="none"
                stroke={`url(#ul-line-${gradId})`}
                strokeWidth="3.25"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx="28" cy="318" r="6" fill="#008040" />
              <circle cx="920" cy="72" r="6" fill="#008040" />
            </svg>

            <p className="pointer-events-none absolute left-0 top-[68%] z-[2] hidden -translate-y-1/2 text-[0.68rem] font-medium tracking-[0.02em] text-[#008040] sm:block md:text-[0.72rem]">
              2020 index 100
            </p>
            <p className="pointer-events-none absolute right-0 top-[2%] z-[2] hidden text-right text-[0.68rem] font-semibold tracking-[0.02em] text-[#008040] sm:block md:text-[0.72rem]">
              2026 index 178
            </p>

            <div className="relative z-[1] flex h-full min-h-[15rem] items-end gap-3 px-[4%] pb-1 pt-10 sm:gap-4 sm:px-[3%] md:min-h-0 md:gap-5 md:pt-12">
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

          <div className="mt-3 flex shrink-0 flex-col gap-1.5 sm:mt-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <p className="text-[0.72rem] text-[#F6F3EE]/42 md:text-[0.78rem]">
              Hover or tab to a tower to read its yearly appreciation.{" "}
              <span className="text-[#F6F3EE]/78">
                {selected.name}: +{formatGain(selected.gain)}% YoY
              </span>
            </p>
            <p className="max-w-sm text-[0.72rem] font-medium leading-snug text-[var(--ul-secondary)] sm:text-right md:text-[0.78rem]">
              Tower height = appreciation, % year on year. Line = prime Dubai price index (2020 =
              100).
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid shrink-0 grid-cols-2 gap-x-4 gap-y-5 border-t border-[#F6F3EE]/14 pt-5 sm:mt-6 sm:grid-cols-4 sm:gap-0 sm:pt-6 md:mt-7">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "min-w-0 sm:px-5 md:px-6",
                i > 0 && "sm:border-l sm:border-[#F6F3EE]/14",
                i === 0 && "sm:pl-0",
                i === STATS.length - 1 && "sm:pr-0"
              )}
            >
              <p
                className="text-[clamp(1.45rem,2.9vw,2.15rem)] font-bold tracking-tight text-[#F6F3EE]"
                style={{ fontFamily: "var(--font-headline), var(--font-poppins), system-ui, sans-serif" }}
              >
                {stat.value}
              </p>
              <p className="mt-1.5 text-[0.8rem] font-semibold text-[#F6F3EE]/82 md:text-[0.88rem]">
                {stat.label}
              </p>
              <p className="mt-0.5 text-[0.68rem] leading-snug text-[#F6F3EE]/38 md:text-[0.75rem]">
                {stat.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
