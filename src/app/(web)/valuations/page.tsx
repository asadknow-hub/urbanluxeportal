import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IMAGES } from "@/lib/web/listings";
import { ListPropertyForm } from "@/components/web/list-property-form";
import { PageIntro } from "@/components/web/page-intro";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "Valuations",
  description:
    "Request a Dubai property valuation from Urban Luxe: a site visit, real comps, and a clear recommendation.",
};

const PILLARS = [
  {
    title: "On-site reading",
    body: "Light, layout, plot, and condition assessed in person on the day of the visit.",
  },
  {
    title: "Real comps",
    body: "What traded nearby, at what terms. Portal asking prices stay secondary until verified.",
  },
  {
    title: "Market position",
    body: "Whether to list, place privately, wait, or improve before going to market.",
  },
  {
    title: "Clear next step",
    body: "A recommendation you can act on: sell, let, hold, or instruct management.",
  },
] as const;

export default function ValuationsPage() {
  return (
    <>
      <PageIntro
        tone="dark"
        className="py-10 sm:py-12 md:py-14"
        eyebrow="Services"
        title="A valuation built from the residence and the market."
        lede="We look at what sold last season, how your residence actually lives, and whether the market is ready for it. If timing is wrong, we will say so plainly."
        primaryCta={{ href: "#request", label: "Request a valuation" }}
        secondaryCta={{ href: "/sell", label: "Ready to instruct a sale", prefetch: true }}
      />

      <section id="request" className="ul-band-light px-5 py-14 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <Reveal>
            <p className="ul-kicker">Request</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">
              Book a valuation conversation
            </h2>
            <p className="ul-section-lede mt-3">
              Share the address and intent. Select “Valuation only” if you are not ready to instruct
              a sale or letting yet.
            </p>
            <ol className="mt-8 space-y-4">
              {PILLARS.map((item, i) => (
                <li key={item.title} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F6F3EE] text-xs font-bold text-[#008040]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#0A1630]">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#0A1630]/65">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={60}>
            <div className="rounded-xl border border-[#e5e7eb] bg-[#F6F3EE] p-6 md:p-8">
              <ListPropertyForm defaultIntent="valuation" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-[#e5e7eb] bg-[#F6F3EE] px-5 py-14 md:px-10 md:py-16">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white">
              <Image
                src={IMAGES.villa}
                alt="Residence for valuation"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <p className="ul-kicker">Our approach</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">
              Numbers with context
            </h2>
            <p className="ul-section-lede mt-3">
              Automated estimates miss privacy, light, and the difference between a rushed seller
              and a patient one. We price the residence in front of us, grounded in recent trades.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="ul-band-light px-5 py-14 md:px-10 md:py-16">
        <div className="mx-auto max-w-[880px] text-center">
          <Reveal>
            <p className="ul-kicker">Also useful</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">
              After the number, a decision
            </h2>
            <p className="ul-section-lede mx-auto mt-3 max-w-xl">
              Valuation often leads to listing, letting, or management. We keep those paths on the
              same desk so you are not handed off mid-conversation.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/sell"
                prefetch
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#0A1630] px-6 text-sm font-semibold text-white hover:bg-[#081226]"
              >
                List your property
              </Link>
              <Link
                href="/property-management"
                prefetch
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#0A1630] px-6 text-sm font-semibold text-[#0A1630] hover:bg-white"
              >
                Property management <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
