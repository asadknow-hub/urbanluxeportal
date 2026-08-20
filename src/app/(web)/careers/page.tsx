import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Handshake,
  MapPinned,
  Sparkles,
  Users,
} from "lucide-react";
import { IMAGES } from "@/lib/web/listings";
import { CareersApplicationForm } from "@/components/web/careers-application-form";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join Urban Luxe in Dubai — sales, leasing, coordination, and specialist roles for people who take the brief seriously.",
};

const VALUES = [
  {
    icon: Handshake,
    title: "Client over volume",
    body: "We would rather place three residences well than chase twenty that do not fit.",
  },
  {
    icon: MapPinned,
    title: "Hyper-local desks",
    body: "Advisors own communities — Palm, Downtown, Hills, Marina — not generic city-wide lists.",
  },
  {
    icon: Users,
    title: "A real house",
    body: "Small team, clear standards, and mentorship from people who still take viewings.",
  },
  {
    icon: Sparkles,
    title: "Craft & pace",
    body: "High standards on communication and presentation — with the speed Dubai expects.",
  },
] as const;

const OPEN_ROLES = [
  {
    title: "Sales Advisor",
    type: "Full-time · Dubai",
    blurb: "Primary residences and investor stock. RERA licence preferred; strong brief discipline required.",
    tags: ["Sales", "RERA"],
  },
  {
    title: "Leasing Advisor",
    type: "Full-time · Dubai",
    blurb: "Annual lets in better buildings. Relationship-led, not portal spam.",
    tags: ["Leasing"],
  },
  {
    title: "Client Coordinator",
    type: "Full-time · Dubai",
    blurb: "Viewing logistics, paperwork, and the unglamorous work between offer and keys.",
    tags: ["Operations"],
  },
  {
    title: "Marketing Specialist",
    type: "Full-time · Dubai",
    blurb: "Content, campaigns, and private listing assets that match the house tone.",
    tags: ["Marketing"],
  },
] as const;

const PERKS = [
  "Competitive commission & base structures",
  "Training on communities, SPA process, and client care",
  "Modern DIFC-adjacent office culture",
  "Clear progression — not a revolving door of cold desks",
] as const;

export default function CareersPage() {
  return (
    <>
      <section className="bg-[#0B1D3D] px-5 pb-12 pt-12 text-white md:px-10 md:pb-14 md:pt-16">
        <div className="mx-auto max-w-[1280px]">
          <Reveal>
            <p className="ul-kicker text-[#1E7A4A]">Careers</p>
            <h1 className="mt-4 max-w-3xl text-3xl leading-[1.12] md:text-5xl">
              See what you&apos;re missing out on.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
              We hire advisors, coordinators, and specialists who care about the brief as much as
              the close. Dubai awaits — take the leap.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="#roles"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#1E7A4A] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#155c38]"
              >
                View open roles
              </Link>
              <Link
                href="#apply"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/35 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Apply now
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-[var(--ul-secondary)] px-5 py-14 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--ul-primary)]/20 md:aspect-[5/4]">
              <Image
                src={IMAGES.careers}
                alt="Urban Luxe team"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <p className="text-sm font-medium text-white/80">Life at Urban Luxe</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-white md:text-4xl">
              Build a career in Dubai real estate
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/85">
              A private brokerage with public-city energy. You will work with serious clients,
              serious stock, and a team that does not pad lists to look busy.
            </p>
            <ul className="mt-6 space-y-2.5">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-sm text-white/90">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" aria-hidden />
                  {perk}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="bg-white px-5 py-14 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1280px]">
          <Reveal>
            <p className="ul-kicker">How we work</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">What we look for</h2>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((item, i) => (
              <Reveal key={item.title} delay={i * 50}>
                <div className="h-full rounded-xl border border-[#e5e7eb] bg-[#F2F2F2] p-5">
                  <item.icon className="h-5 w-5 text-[#1E7A4A]" strokeWidth={2} />
                  <p className="mt-4 font-semibold text-[#0B1D3D]">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#0B1D3D]/65">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="border-t border-[#e5e7eb] bg-[#F2F2F2] px-5 py-14 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1280px]">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="ul-kicker">Open roles</p>
                <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">Current openings</h2>
                <p className="ul-section-lede mt-3 max-w-xl">
                  Don&apos;t see your title? Send an open application — we hire for fit as much as
                  for function.
                </p>
              </div>
              <Link
                href="#apply"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1E7A4A] hover:text-[#155c38]"
              >
                Jump to application <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          <div className="mt-8 space-y-3">
            {OPEN_ROLES.map((role, i) => (
              <Reveal key={role.title} delay={i * 40}>
                <div className="flex flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Briefcase className="h-4 w-4 text-[#1E7A4A]" strokeWidth={2} />
                      <h3 className="text-lg font-semibold text-[#0B1D3D]">{role.title}</h3>
                    </div>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[#0B1D3D]/45">
                      {role.type}
                    </p>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#0B1D3D]/70">
                      {role.blurb}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {role.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#F2F2F2] px-2.5 py-1 text-[0.7rem] font-semibold text-[#0B1D3D]/7"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link
                    href={`#apply`}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#0B1D3D] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0a172e]"
                  >
                    Apply
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="apply" className="bg-white px-5 py-14 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <p className="ul-kicker">Apply</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">
              Send your application
            </h2>
            <p className="ul-section-lede mt-3">
              Tell us the role, your experience, and why this house. We read every application —
              no buy/rent dropdowns required.
            </p>
            <p className="mt-6 text-sm text-[#0B1D3D]/65">
              Hiring is handled by people, not a queue bot. Expect a reply within a few working
              days if there is a fit.
            </p>
          </Reveal>
          <Reveal delay={60}>
            <div className="rounded-xl border border-[#e5e7eb] bg-[#F2F2F2] p-6 md:p-8">
              <CareersApplicationForm />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#0B1D3D] px-5 py-12 md:px-10 md:py-14">
        <Reveal className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1E7A4A]">
              Not sure yet?
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white md:text-2xl">
              Ask a question before you apply
            </h2>
          </div>
          <Link
            href="/contact"
            prefetch
            className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#0B1D3D] transition-colors hover:bg-[#F2F2F2]"
          >
            Contact the team
          </Link>
        </Reveal>
      </section>
    </>
  );
}
