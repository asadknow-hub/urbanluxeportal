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
    <section className="border-b border-[#e5e7eb] bg-[#0B1D3D] px-5 pb-14 pt-12 text-white md:px-10 md:pb-16 md:pt-16">
      <div className="mx-auto max-w-[1440px]">
        <Reveal>
          <p className="ul-kicker text-[#1E7A4A]">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl leading-[1.1] md:text-5xl">{title}</h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
            {lede}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
