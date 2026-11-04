import type { Metadata } from "next";
import Image from "next/image";
import { IMAGES } from "@/lib/web/listings";
import { PageIntro } from "@/components/web/page-intro";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "The house",
  description: "UrbanLuxe is a private Dubai brokerage for serious buyers and sellers across Palm, Downtown, Hills, and Creek.",
};

export default function AboutPage() {
  return (
    <>
      <PageIntro
        layout="stack"
        eyebrow="The house"
        title="A private office for a public city."
        lede="UrbanLuxe is a quiet desk for serious buyers and sellers. We buy, sell, let, and allocate with discretion."
      />
      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[22rem] lg:min-h-[36rem]">
          <Image src={IMAGES.interior} alt="Interior of a Dubai residence" fill sizes="50vw" className="object-cover" />
        </div>
        <div className="flex flex-col justify-center px-5 py-12 sm:px-8 sm:py-16 md:px-16">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl md:text-4xl">How we work</h2>
            <ul className="mt-8 space-y-6 text-base font-light leading-relaxed text-[var(--ul-muted)]">
              <li>
                <span className="block text-[0.7rem] tracking-[0.2em] uppercase text-[#008040]">01 · Brief</span>
                We start with a conversation: community, light, number, timing.
              </li>
              <li>
                <span className="block text-[0.7rem] tracking-[0.2em] uppercase text-[#008040]">02 · Edit</span>
                Three to five residences. If none fit, we wait until the right one appears.
              </li>
              <li>
                <span className="block text-[0.7rem] tracking-[0.2em] uppercase text-[#008040]">03 · Close</span>
                Viewings, papers, and the unglamorous work between offer and keys. Then we disappear until you need us.
              </li>
            </ul>
          </Reveal>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1440px] gap-px border-y border-[var(--ul-hair)] bg-[var(--ul-hair)] md:grid-cols-3">
        {[
          { k: "Desk", v: "Dubai brokerage" },
          { k: "Focus", v: "Palm · Downtown · Hills · Creek" },
          { k: "Reply", v: "Within a working day" },
        ].map((s) => (
          <div key={s.k} className="bg-[var(--ul-paper)] px-8 py-14">
            <p className="ul-kicker">{s.k}</p>
            <p className="mt-3 text-2xl">{s.v}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-3xl px-5 py-20 text-center md:py-28">
        <p className="text-xl font-light leading-relaxed text-[#0A1630] md:text-2xl">
          Our house system lives with the team. This site is for the city.
        </p>
      </section>
    </>
  );
}
