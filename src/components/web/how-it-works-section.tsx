const STEPS = [
  {
    n: "01",
    title: "Tell us the brief",
    body: "Budget, community and lifestyle. We lock the criteria before we show you a single home.",
    icon: "brief" as const,
  },
  {
    n: "02",
    title: "Private shortlist",
    body: "Curated buy, rent and off-plan options, including quiet listings that never reach the open portals.",
    icon: "shortlist" as const,
  },
  {
    n: "03",
    title: "Close with clarity",
    body: "Negotiation, paperwork and handover, handled end to end by one dedicated advisor.",
    icon: "keys" as const,
  },
] as const;

function BriefIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 md:h-16 md:w-16" fill="none" aria-hidden>
      <rect x="16" y="10" width="32" height="42" rx="3" stroke="#F6F3EE" strokeWidth="2" />
      <path d="M24 22h16M24 30h16M24 38h10" stroke="#F6F3EE" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="46" r="8" fill="#0A1630" stroke="#008040" strokeWidth="2" />
      <path
        d="M36.5 46.2l2.4 2.4 4.6-5"
        stroke="#008040"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShortlistIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 md:h-16 md:w-16" fill="none" aria-hidden>
      <rect x="12" y="34" width="10" height="18" rx="1.5" stroke="#F6F3EE" strokeWidth="2" />
      <rect x="27" y="18" width="10" height="34" rx="1.5" fill="#13203a" stroke="#F6F3EE" strokeWidth="2" />
      <rect x="42" y="26" width="10" height="26" rx="1.5" stroke="#F6F3EE" strokeWidth="2" />
      <circle cx="32" cy="12" r="3.5" fill="#008040" />
    </svg>
  );
}

function KeysIcon() {
  return (
    <span className="relative inline-flex h-14 w-14 items-center justify-center md:h-16 md:w-16">
      <span
        className="absolute inset-[-18%] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0,128,64,0.55) 0%, rgba(0,128,64,0.12) 45%, transparent 70%)",
          filter: "blur(2px)",
        }}
        aria-hidden
      />
      <svg viewBox="0 0 64 64" className="relative h-full w-full" fill="none" aria-hidden>
        <circle cx="24" cy="24" r="10" stroke="#F6F3EE" strokeWidth="2.25" />
        <circle cx="24" cy="24" r="3.5" fill="#008040" />
        <path
          d="M32 28 L52 48 M46 42 l6 0 M44 50 l0 -6"
          stroke="#F6F3EE"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function StepIcon({ kind }: { kind: (typeof STEPS)[number]["icon"] }) {
  if (kind === "brief") return <BriefIcon />;
  if (kind === "shortlist") return <ShortlistIcon />;
  return <KeysIcon />;
}

export function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--ul-primary)] py-14 text-[#F6F3EE] md:py-20 lg:py-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 55% at 50% 100%, rgba(0,128,64,0.16), transparent 58%), radial-gradient(55% 40% at 80% 0%, rgba(246,243,238,0.04), transparent 50%)",
        }}
      />

      <div className="ul-shell-wide relative">
        <header className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end lg:gap-12">
          <h2
            className="text-[clamp(2.4rem,6vw,4.75rem)] font-bold uppercase leading-[0.88] tracking-[-0.03em]"
            style={{ fontFamily: "var(--font-headline), var(--font-poppins), system-ui, sans-serif" }}
          >
            <span className="block text-[#F6F3EE]">A clear path</span>
            <span
              className="mt-1 block"
              style={{
                color: "transparent",
                WebkitTextStroke: "2px #F6F3EE",
              }}
            >
              from brief to keys.
            </span>
          </h2>
          <p className="max-w-md text-[0.95rem] leading-relaxed text-[#F6F3EE]/70 lg:justify-self-end lg:pb-2 lg:text-right">
            Three steps, one dedicated advisor. No open portals to trawl and no paperwork to chase.
          </p>
        </header>

        {/* Desktop / tablet process */}
        <div className="relative mt-14 hidden md:mt-20 md:block lg:mt-24">
          {/* Icons row */}
          <div className="grid grid-cols-3 gap-8 lg:gap-12">
            {STEPS.map((step) => (
              <div key={step.n} className="flex justify-center">
                <StepIcon kind={step.icon} />
              </div>
            ))}
          </div>

          {/* Wave + nodes */}
          <div className="relative my-2 h-16 lg:my-3 lg:h-[4.5rem]">
            <svg
              className="absolute inset-0 h-full w-full overflow-visible"
              viewBox="0 0 1200 80"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <filter id="ul-how-glow" x="-20%" y="-80%" width="140%" height="260%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Soft under-stroke */}
              <path
                d="M 40 28 C 180 28, 220 58, 300 58 S 420 28, 500 28 S 620 62, 700 62 S 820 28, 900 28 S 1040 52, 1160 36"
                fill="none"
                stroke="rgba(0,0,0,0.35)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M 40 26 C 180 26, 220 54, 300 54 S 420 26, 500 26 S 620 58, 700 58 S 820 26, 900 26 S 1040 48, 1160 34"
                fill="none"
                stroke="#008040"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#ul-how-glow)"
              />
            </svg>

            <div className="absolute inset-0 grid grid-cols-3 gap-8 lg:gap-12">
              {STEPS.map((step, i) => {
                const yNudge = i === 0 ? "translate-y-3" : i === 1 ? "translate-y-6" : "translate-y-2";
                return (
                  <div key={step.n} className={`flex items-start justify-center ${yNudge}`}>
                    <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#008040] bg-[var(--ul-primary)] shadow-[0_0_24px_rgba(0,128,64,0.35)] lg:h-14 lg:w-14">
                      <span
                        className="text-sm font-bold tabular-nums tracking-wide text-[#F6F3EE] lg:text-base"
                        style={{
                          fontFamily: "var(--font-headline), var(--font-poppins), system-ui, sans-serif",
                        }}
                      >
                        {step.n}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Copy row */}
          <div className="grid grid-cols-3 gap-8 lg:gap-12">
            {STEPS.map((step) => (
              <div key={step.n} className="mx-auto max-w-[16.5rem] text-center">
                <h3
                  className="text-[clamp(1.05rem,1.6vw,1.35rem)] font-bold uppercase tracking-[0.04em] text-[#F6F3EE]"
                  style={{ fontFamily: "var(--font-headline), var(--font-poppins), system-ui, sans-serif" }}
                >
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#F6F3EE]/55">{step.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile stack */}
        <ol className="relative mt-12 space-y-10 md:hidden">
          <span
            className="absolute bottom-6 left-[1.35rem] top-6 w-px bg-[#008040]/70"
            aria-hidden
          />
          {STEPS.map((step) => (
            <li key={step.n} className="relative grid grid-cols-[2.75rem_1fr] gap-4">
              <span className="relative z-[1] grid h-11 w-11 place-items-center rounded-full border-2 border-[#008040] bg-[var(--ul-primary)]">
                <span
                  className="text-xs font-bold tabular-nums text-[#F6F3EE]"
                  style={{ fontFamily: "var(--font-headline), var(--font-poppins), system-ui, sans-serif" }}
                >
                  {step.n}
                </span>
              </span>
              <div>
                <div className="mb-3">
                  <StepIcon kind={step.icon} />
                </div>
                <h3
                  className="text-lg font-bold uppercase tracking-[0.04em] text-[#F6F3EE]"
                  style={{ fontFamily: "var(--font-headline), var(--font-poppins), system-ui, sans-serif" }}
                >
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#F6F3EE]/55">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
