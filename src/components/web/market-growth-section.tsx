"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Editorial community focus, no invented YoY % or client-return claims. */
const COMMUNITIES = [
  {
    name: "Palm Jumeirah",
    focus: "Villa and apartment stock with waterfront views and limited plot supply.",
    height: 92,
  },
  {
    name: "Downtown",
    focus: "Prime towers and branded residences around the Boulevard and Opera district.",
    height: 78,
  },
  {
    name: "Hills Estate",
    focus: "Family villas and quiet streets with strong school catchments.",
    height: 64,
  },
  {
    name: "Creek Harbour",
    focus: "Newer waterfront towers and longer hold profiles for investors.",
    height: 70,
  },
  {
    name: "Marina",
    focus: "Liquid apartment stock and annual letting demand near the walk.",
    height: 58,
  },
] as const;

function Tower({
  name,
  height,
  active,
  onFocus,
}: {
  name: string;
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
      aria-label={name}
    >
      <span
        className={cn(
          "relative w-[78%] max-w-[7rem] overflow-hidden transition-opacity duration-300 sm:w-[72%] md:max-w-[8.5rem] lg:max-w-[9.5rem]",
          active ? "opacity-100" : "opacity-75 group-hover:opacity-90"
        )}
        style={{ height: `${height}%` }}
        aria-hidden
      >
        <span
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(246,243,238,0.55) 0 1px, transparent 1px 5px)",
            backgroundColor: "rgba(10, 22, 48, 0.35)",
            boxShadow: active
              ? "inset 0 0 0 1px rgba(246,243,238,0.2)"
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
  const [active, setActive] = useState(0);
  const selected = COMMUNITIES[active] ?? COMMUNITIES[0];

  return (
    <section className="relative flex min-h-[32rem] flex-col overflow-hidden bg-[var(--ul-primary)] py-14 text-[#F6F3EE] md:min-h-[36rem] md:py-16 lg:py-20">
      <div className="ul-shell-wide relative flex min-h-0 flex-1 flex-col">
        <header className="grid shrink-0 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end lg:gap-10">
          <h2
            className="text-[clamp(2.4rem,6vw,4.75rem)] font-bold uppercase leading-[0.88] tracking-[-0.03em] text-[#F6F3EE]"
            style={{ fontFamily: "var(--font-headline), var(--font-poppins), system-ui, sans-serif" }}
          >
            <span className="block">Communities</span>
            <span className="mt-1 block text-[var(--ul-secondary)]">we return to.</span>
          </h2>
          <p className="max-w-md text-[0.9rem] leading-relaxed text-[#F6F3EE]/72 lg:justify-self-end lg:text-right md:text-[0.95rem]">
            We keep a tight map: Palm, Downtown, Hills, Creek, and Marina. Tower height here is
            editorial weight for our desk, how often we trade and advise in each place.
          </p>
        </header>

        <div className="relative mt-10 flex min-h-0 flex-1 flex-col md:mt-12">
          <div className="relative min-h-[14rem] flex-1 md:min-h-[18rem]">
            <div className="relative z-[1] flex h-full items-end gap-3 px-[2%] pb-1 sm:gap-4 md:gap-5">
              {COMMUNITIES.map((tower, i) => (
                <Tower
                  key={tower.name}
                  name={tower.name}
                  height={tower.height}
                  active={active === i}
                  onFocus={() => setActive(i)}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-[#F6F3EE]/14 pt-5 sm:mt-8 sm:pt-6">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[var(--ul-secondary)]">
              {selected.name}
            </p>
            <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-[#F6F3EE]/78">
              {selected.focus}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
