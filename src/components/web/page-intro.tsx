import { Reveal } from "@/components/web/reveal";

export function PageIntro({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede: string;
}) {
  return (
    <section className="border-b border-white/10 bg-[var(--ul-primary)] py-12 text-white sm:py-14 md:py-16">
      <div className="ul-shell grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
        <Reveal>
          <p className="ul-kicker">{eyebrow}</p>
          <h1 className="mt-3 max-w-4xl text-[1.85rem] font-extrabold uppercase leading-[1.08] tracking-[-0.03em] sm:mt-4 sm:text-4xl md:text-5xl">
            {title}
          </h1>
        </Reveal>
        <Reveal delay={60}>
          <p className="max-w-xl text-[0.9375rem] leading-relaxed text-[var(--ul-muted)] sm:text-base md:justify-self-end md:text-right md:text-lg">
            {lede}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
