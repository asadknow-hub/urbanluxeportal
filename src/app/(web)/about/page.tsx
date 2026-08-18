import type { Metadata } from "next";
import Image from "next/image";
import { IMAGES } from "@/lib/web/listings";
import { PageIntro } from "@/components/web/page-intro";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "The house",
  description: "UrbanLuxe is a private Dubai brokerage. Fewer introductions. Better ones.",
};

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="The house"
        title="A private office for a public city."
        lede="UrbanLuxe exists for clients who would rather not be on a mailing list. We buy, sell, let, and allocate — quietly."
      />
      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[22rem] lg:min-h-[36rem]">
          <Image src={IMAGES.interior} alt="Interior of a Dubai residence" fill sizes="50vw" className="object-cover" />
        </div>
        <div className="flex flex-col justify-center px-8 py-16 md:px-16">
          <Reveal>
            <h2 className="text-3xl md:text-4xl">How we work</h2>
            <ul className="mt-8 space-y-6 text-base font-light leading-relaxed text-[#8a8178]">
              <li>
                <span className="block text-[0.7rem] tracking-[0.2em] uppercase text-[#b0893a]">01 — Brief</span>
                A conversation, not a form with forty fields. Community, light, number, timing.
              </li>
              <li>
                <span className="block text-[0.7rem] tracking-[0.2em] uppercase text-[#b0893a]">02 — Edit</span>
                Three to five residences. If none fit, we wait — we do not pad the list.
              </li>
              <li>
                <span className="block text-[0.7rem] tracking-[0.2em] uppercase text-[#b0893a]">03 — Close</span>
                Viewings, papers, and the unglamorous work between offer and keys. Then we disappear until you need us.
              </li>
            </ul>
          </Reveal>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1440px] gap-px border-y border-[#e4d9c8] bg-[#e4d9c8] md:grid-cols-3">
        {[
          { k: "RERA", v: "Registered brokerage" },
          { k: "Focus", v: "Palm · Downtown · Hills · Creek" },
          { k: "Reply", v: "Within a working day" },
        ].map((s) => (
          <div key={s.k} className="bg-[#f6f3ee] px-8 py-14">
            <p className="ul-kicker">{s.k}</p>
            <p className="mt-3 text-2xl">{s.v}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-3xl px-5 py-20 text-center md:py-28">
        <p className="text-xl font-light leading-relaxed text-[#14110e] md:text-2xl">
          The portal you may have heard of — our house system — lives with the team. This site is for the city.
        </p>
      </section>
    </>
  );
}
