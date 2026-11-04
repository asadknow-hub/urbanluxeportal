const STEPS = [
  {
    n: "01",
    title: "Tell us the brief",
    body: "Budget, community, and lifestyle. We lock the criteria before we show you a home.",
  },
  {
    n: "02",
    title: "Private shortlist",
    body: "A curated set for buy, rent, or off-plan, including quiet stock when it fits.",
  },
  {
    n: "03",
    title: "Close with clarity",
    body: "Negotiation, paperwork, and handover on one thread with a dedicated advisor.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--ul-primary)] py-14 text-[#F6F3EE] md:py-20 lg:py-24">
      <div className="ul-shell-wide relative">
        <header className="max-w-3xl">
          <h2
            className="text-[clamp(2.4rem,6vw,4.75rem)] font-bold uppercase leading-[0.88] tracking-[-0.03em] text-[#F6F3EE]"
            style={{ fontFamily: "var(--font-headline), var(--font-poppins), system-ui, sans-serif" }}
          >
            <span className="block">A clear path</span>
            <span className="mt-1 block">from brief to keys.</span>
          </h2>
          <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-[#F6F3EE]/70">
            Three steps. One dedicated advisor from first call through handover.
          </p>
        </header>

        <ol className="mt-12 grid gap-0 border-t border-[#F6F3EE]/14 md:mt-16 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.n}
              className={
                i === 0
                  ? "border-[#F6F3EE]/14 py-8 md:border-r md:pr-8 md:pt-10"
                  : i === STEPS.length - 1
                    ? "border-t border-[#F6F3EE]/14 py-8 md:border-t-0 md:pl-8 md:pt-10"
                    : "border-t border-[#F6F3EE]/14 py-8 md:border-r md:border-t-0 md:px-8 md:pt-10"
              }
            >
              <span
                className="text-xs font-bold tracking-[0.16em] text-[var(--ul-secondary)]"
                style={{ fontFamily: "var(--font-headline), var(--font-poppins), system-ui, sans-serif" }}
              >
                {step.n}
              </span>
              <h3
                className="mt-4 text-[clamp(1.05rem,1.6vw,1.35rem)] font-bold uppercase tracking-[0.04em] text-[#F6F3EE]"
                style={{ fontFamily: "var(--font-headline), var(--font-poppins), system-ui, sans-serif" }}
              >
                {step.title}
              </h3>
              <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-[#F6F3EE]/55">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
