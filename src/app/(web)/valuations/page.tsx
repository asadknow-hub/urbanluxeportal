import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, Eye, FileSearch, Ruler } from "lucide-react";
import { IMAGES } from "@/lib/web/listings";
import { ListPropertyForm } from "@/components/web/list-property-form";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "Valuations",
  description:
    "Request a Dubai property valuation from Urban Luxe — a conversation about light, plot, and what actually sold, not a postcode PDF.",
};

const PILLARS = [
  {
    icon: Ruler,
    title: "On-site reading",
    body: "Light, layout, plot, and condition — seen in person, not inferred from a listing photo.",
  },
  {
    icon: BarChart3,
    title: "Real comps",
    body: "What traded nearby, at what terms — asking prices online are noise until proven.",
  },
  {
    icon: Eye,
    title: "Market position",
    body: "Whether to list, place privately, wait, or improve before going to market.",
  },
  {
    icon: FileSearch,
    title: "Clear next step",
    body: "A recommendation you can act on: sell, let, hold, or instruct management.",
  },
] as const;

export default function ValuationsPage() {
  return (
    <>
      <section className="bg-[#0B1D3D] px-5 pb-12 pt-12 text-white md:px-10 md:pb-14 md:pt-16">
        <div className="mx-auto max-w-[1280px]">
          <Reveal>
            <p className="ul-kicker text-[#1E7A4A]">Services</p>
            <h1 className="mt-4 max-w-3xl text-3xl leading-[1.12] md:text-5xl">
              A valuation that is a conversation — not a postcode PDF.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
              We look at what sold last season, how your residence actually lives, and whether the
              market is ready for it. If it is not, we will say so.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#request"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#1E7A4A] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#155c38]"
              >
                Request a valuation
              </Link>
              <Link
                href="/sell"
                prefetch
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/35 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Ready to instruct a sale
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white px-5 py-14 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#F2F2F2]">
              <Image
                src={IMAGES.villa}
                alt="Residence for valuation"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
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
              and a patient one. We price the residence you have — not a spreadsheet average.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {PILLARS.map((item) => (
                <div key={item.title} className="rounded-xl border border-[#e5e7eb] bg-[#F2F2F2] p-4">
                  <item.icon className="h-5 w-5 text-[#1E7A4A]" strokeWidth={2} />
                  <p className="mt-3 text-sm font-semibold text-[#0B1D3D]">{item.title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#0B1D3D]/65">{item.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-[#e5e7eb] bg-[#F2F2F2] px-5 py-14 md:px-10 md:py-16">
        <div className="mx-auto max-w-[880px] text-center">
          <Reveal>
            <p className="ul-kicker">Also useful</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">
              After the number — a decision
            </h2>
            <p className="ul-section-lede mx-auto mt-3 max-w-xl">
              Valuation often leads to listing, letting, or management. We keep those paths on the
              same desk so you are not handed off mid-conversation.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/sell"
                prefetch
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#0B1D3D] px-6 text-sm font-semibold text-white hover:bg-[#0a172e]"
              >
                List your property
              </Link>
              <Link
                href="/property-management"
                prefetch
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#0B1D3D] px-6 text-sm font-semibold text-[#0B1D3D] hover:bg-white"
              >
                Property management <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="request" className="bg-white px-5 py-14 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="ul-kicker">Request</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">
              Book a valuation conversation
            </h2>
            <p className="ul-section-lede mt-3">
              Share the address and intent. Select “Valuation only” if you are not ready to instruct
              a sale or letting yet.
            </p>
          </Reveal>
          <Reveal delay={60}>
            <div className="rounded-xl border border-[#e5e7eb] bg-[#F2F2F2] p-6 md:p-8">
              <ListPropertyForm defaultIntent="valuation" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
