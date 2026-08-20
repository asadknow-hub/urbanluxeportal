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
    <section className="border-b border-[#e5e7eb] bg-[#0B1D3D] px-4 pb-10 pt-10 text-white sm:px-5 sm:pb-14 sm:pt-12 md:px-10 md:pb-16 md:pt-16">
      <div className="mx-auto max-w-[1440px]">
        <Reveal>
          <p className="ul-kicker text-[#1E7A4A]">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-[1.85rem] leading-[1.12] sm:mt-4 sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-white/70 sm:mt-5 sm:text-base md:text-lg">
            {lede}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
