import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { COMMUNITIES } from "@/lib/web/listings";
import { PageIntro } from "@/components/web/page-intro";

export const metadata: Metadata = {
  title: "Communities",
  description: "Palm, Downtown, Hills, Creek, Marina — the Dubai addresses we return to.",
};

export default function CommunitiesPage() {
  return (
    <>
      <PageIntro
        eyebrow="The map"
        title="Communities"
        lede="We do not cover every postcode. These are the addresses we know by plot, by stack, and by the light at four in the afternoon."
      />
      <section className="mx-auto grid max-w-[1440px] gap-5 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 md:px-10 md:py-20">
        {COMMUNITIES.map((c) => (
          <Link key={c.slug} href={`/communities/${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden">
            <Image
              src={c.image}
              alt={c.name}
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#14110e] via-transparent to-transparent" />
            <div className="absolute inset-x-5 bottom-6 text-[#f6f3ee]">
              <p className="text-[0.65rem] tracking-[0.24em] uppercase text-[#2dd4bf]">{c.region}</p>
              <h2 className="mt-1 text-2xl">{c.name}</h2>
            </div>
          </Link>
        ))}
      </section>
    </>
  );
}
