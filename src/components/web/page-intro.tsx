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
    <section className="ul-band-dark border-b border-white/10 py-12 sm:py-14 md:py-16">
      <div className="ul-shell-wide grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-end">
        <Reveal className="justify-self-start">
          <p className="ul-kicker">{eyebrow}</p>
          <h1 className="mt-3 max-w-4xl text-[1.85rem] font-extrabold uppercase leading-[1.08] tracking-[-0.03em] text-white sm:mt-4 sm:text-4xl md:text-5xl">
            {title}
          </h1>
        </Reveal>
        <Reveal delay={60} className="lg:justify-self-end lg:text-right">
          <p className="max-w-xl text-[0.9375rem] leading-relaxed text-[#8ba0b8] sm:text-base md:text-lg lg:ml-auto">
            {lede}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
