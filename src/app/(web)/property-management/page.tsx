import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  KeyRound,
  Wrench,
} from "lucide-react";
import { IMAGES } from "@/lib/web/listings";
import { EnquireForm } from "@/components/web/enquire-form";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "Property Management",
  description:
    "Urban Luxe property management in Dubai — tenant care, maintenance coordination, and reporting for landlords who want the house looked after.",
};

const SERVICES = [
  {
    icon: KeyRound,
    title: "Tenant placement & renewals",
    body: "Qualified tenants, photographed handovers, and renewals handled before the scramble.",
  },
  {
    icon: Wrench,
    title: "Maintenance coordination",
    body: "Trusted vendors, clear approvals, and updates you can read without a site visit.",
  },
  {
    icon: ClipboardCheck,
    title: "Inspections & reporting",
    body: "Move-in / move-out records and periodic condition notes for peace of mind.",
  },
  {
    icon: Building2,
    title: "Landlord liaison",
    body: "One desk for rent collection follow-up, notices, and building management contact.",
  },
] as const;

const STEPS = [
  { n: "01", title: "Brief", body: "Property, tenancy status, and how hands-on you want to be." },
  { n: "02", title: "Setup", body: "Access, utilities context, and vendor preferences locked in." },
  { n: "03", title: "Manage", body: "Day-to-day coordination with clear escalation rules." },
  { n: "04", title: "Report", body: "Simple updates — what happened, what it cost, what is next." },
] as const;

export default function PropertyManagementPage() {
  return (
    <>
      <section className="bg-[#0B1D3D] px-5 pb-12 pt-12 text-white md:px-10 md:pb-14 md:pt-16">
        <div className="mx-auto max-w-[1280px]">
          <Reveal>
            <p className="ul-kicker text-[#1E7A4A]">Services</p>
            <h1 className="mt-4 max-w-3xl text-3xl leading-[1.12] md:text-5xl">
              Property management that treats the house as a house.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
              For landlords who want qualified occupants, orderly maintenance, and a desk that
              answers — not a portal ticket queue.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#enquire"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#1E7A4A] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#155c38]"
              >
                Talk to management
              </Link>
              <Link
                href="/sell"
                prefetch
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/35 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Also listing? Instruct us
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
                src={IMAGES.living}
                alt="Managed residence"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <p className="ul-kicker">What we cover</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">
              Care for the asset — and the people in it
            </h2>
            <p className="ul-section-lede mt-3">
              We manage select residences with the same standard we use for private sales: fewer
              excuses, clearer communication.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {SERVICES.map((item) => (
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
            <p className="ul-kicker">Process</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">How engagement works</h2>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 40}>
                <div className="h-full rounded-xl border border-[#e5e7eb] bg-white p-5">
                  <p className="text-xs font-bold tracking-[0.16em] text-[#1E7A4A]">{step.n}</p>
                  <h3 className="mt-3 font-semibold text-[#0B1D3D]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#0B1D3D]/65">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="enquire" className="bg-white px-5 py-14 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="ul-kicker">Enquire</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">
              Tell us about the property
            </h2>
            <p className="ul-section-lede mt-3">
              Location, current tenancy, and what you need handled. We will confirm whether we are
              the right fit before anything is signed.
            </p>
            <Link
              href="/valuations"
              prefetch
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1E7A4A] hover:text-[#155c38]"
            >
              Need a valuation first? <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <Reveal delay={60}>
            <div className="rounded-xl border border-[#e5e7eb] bg-[#F2F2F2] p-6 md:p-8">
              <EnquireForm compact />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
