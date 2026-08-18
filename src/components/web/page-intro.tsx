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
    <section className="border-b border-[#e4d9c8] bg-[#14110e] px-5 pb-16 pt-32 text-[#f6f3ee] md:px-10 md:pb-20 md:pt-40">
      <div className="mx-auto max-w-[1440px]">
        <Reveal>
          <p className="ul-kicker">{eyebrow}</p>
          <h1 className="mt-5 max-w-3xl text-4xl leading-[1.1] md:text-6xl">{title}</h1>
          <p className="mt-6 max-w-xl text-base font-light leading-relaxed text-[#f6f3ee]/70 md:text-lg">
            {lede}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
