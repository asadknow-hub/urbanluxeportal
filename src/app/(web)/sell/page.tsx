import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  EyeOff,
  FileCheck2,
  Home,
  KeyRound,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { IMAGES } from "@/lib/web/listings";
import { ListPropertyForm } from "@/components/web/list-property-form";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "List Your Property",
  description:
    "Instruct Urban Luxe to sell or let a Dubai residence — privately, with a valuation that is a conversation, not a postcode PDF.",
};

const REASONS = [
  {
    icon: EyeOff,
    title: "Private placement",
    body: "Many of our sales never appear on public portals. We can list loudly — or place quietly.",
  },
  {
    icon: Scale,
    title: "Honest valuation",
    body: "A conversation about light, plot, and what sold last season — not a PDF from a postcode.",
  },
  {
    icon: ShieldCheck,
    title: "Qualified buyers & tenants",
    body: "We brief before we book. Viewings are intentional; handovers are photographed.",
  },
  {
    icon: FileCheck2,
    title: "Paperwork that closes",
    body: "From offer to SPA and keys — coordination that does not leave you chasing updates.",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Brief",
    body: "Address, timing, and whether you want to sell, let, or hear both paths.",
  },
  {
    n: "02",
    title: "Value",
    body: "We walk the residence and compare it to what actually traded — not asking prices online.",
  },
  {
    n: "03",
    title: "Strategy",
    body: "Portal list, private network, or both. Pricing and presentation that match the house.",
  },
  {
    n: "04",
    title: "Close",
    body: "Offers, negotiation, contracts, and handover — then we stay available if you need us.",
  },
] as const;

const PATHS = [
  {
    icon: Home,
    title: "Sell",
    body: "Primary homes and investor stock. We edit the brief, qualify demand, and protect your asking narrative.",
    href: "#instruct",
    cta: "Instruct a sale",
  },
  {
    icon: KeyRound,
    title: "Let",
    body: "Annual contracts to occupants who will treat the house as a house. References and a proper handover.",
    href: "#instruct",
    cta: "Instruct a letting",
  },
] as const;

export default function SellPage() {
  return (
    <>
      <section className="bg-[#0B1D3D] px-4 pb-10 pt-10 text-white sm:px-5 sm:pb-12 sm:pt-12 md:px-10 md:pb-14 md:pt-16">
        <div className="mx-auto max-w-[1280px]">
          <Reveal>
            <p className="ul-kicker text-[#1E7A4A]">List your property</p>
            <h1 className="mt-3 max-w-3xl text-[1.85rem] leading-[1.12] sm:mt-4 sm:text-3xl md:text-5xl">
              Sell without a board on the street.
            </h1>
            <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-white/70 sm:text-sm md:text-base">
              We can list, or we can place. Tell us the address — a specialist will advise on sale,
              letting, or both.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:items-center">
              <Link
                href="#instruct"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#1E7A4A] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#155c38] sm:h-11"
              >
                Request a conversation
              </Link>
              <Link
                href="#how"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/35 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:h-11"
              >
                How it works
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white px-4 py-12 sm:px-5 sm:py-14 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#F2F2F2] md:aspect-[5/4]">
              <Image
                src={IMAGES.interior}
                alt="Dubai residence interior"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <p className="ul-kicker">Why instruct Urban Luxe</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">
              Placement with the care of a private office
            </h2>
            <p className="ul-section-lede mt-3">
              If the residence is not ready for the market, we will say so. If it is, we will not
              waste your time with unqualified viewings.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {REASONS.map((item) => (
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
        <div className="mx-auto max-w-[1280px]">
          <Reveal>
            <p className="ul-kicker">Paths</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">Sell or let — your choice</h2>
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {PATHS.map((path, i) => (
              <Reveal key={path.title} delay={i * 50}>
                <div className="flex h-full flex-col rounded-xl border border-[#e5e7eb] bg-white p-6 md:p-8">
                  <path.icon className="h-6 w-6 text-[#1E7A4A]" strokeWidth={2} />
                  <h3 className="mt-4 text-xl font-semibold text-[#0B1D3D]">{path.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[#0B1D3D]/70">{path.body}</p>
                  <Link
                    href={path.href}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1E7A4A] hover:text-[#155c38]"
                  >
                    {path.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-white px-5 py-14 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1280px]">
          <Reveal>
            <p className="ul-kicker">Process</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">How it works</h2>
            <p className="ul-section-lede mt-3 max-w-xl">
              Four clear steps from first call to keys — without the noise of a high-street board.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 40}>
                <div className="h-full rounded-xl border border-[#e5e7eb] bg-[#F2F2F2] p-5">
                  <p className="text-xs font-bold tracking-[0.16em] text-[#1E7A4A]">{step.n}</p>
                  <h3 className="mt-3 text-lg font-semibold text-[#0B1D3D]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#0B1D3D]/65">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="instruct"
        className="border-t border-[#e5e7eb] bg-[#F2F2F2] px-5 py-14 md:px-10 md:py-20"
      >
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <Reveal>
            <p className="ul-kicker">Instruct us</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">
              Request a conversation
            </h2>
            <p className="ul-section-lede mt-3">
              Share the address and your intent. We will reply with next steps for valuation and
              strategy — not a generic brochure pack.
            </p>
            <div className="mt-8 space-y-4 text-sm leading-relaxed text-[#0B1D3D]/70">
              <p>
                A valuation is a conversation about light, plot, and what sold last season. If the
                residence is not ready for the market, we will say so.
              </p>
              <p>
                For landlords: annual contracts, references, and a handover that is photographed.
              </p>
            </div>
            <Link
              href="/contact"
              prefetch
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1E7A4A] hover:text-[#155c38]"
            >
              Prefer to email or call? Contact us <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <Reveal delay={60}>
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_4px_24px_rgba(11,29,61,0.05)] md:p-8">
              <ListPropertyForm />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0B1D3D] px-5 py-14 md:px-10 md:py-16">
        <div className="absolute inset-0 opacity-30">
          <Image src={IMAGES.skyline} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[#0B1D3D]/75" />
        </div>
        <Reveal className="relative mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1E7A4A]">
              Ready when you are
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white md:text-2xl">
              Your residence. Your terms. Our desk.
            </h2>
          </div>
          <Link
            href="#instruct"
            className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#0B1D3D] transition-colors hover:bg-[#F2F2F2]"
          >
            List your property
          </Link>
        </Reveal>
      </section>
    </>
  );
}
