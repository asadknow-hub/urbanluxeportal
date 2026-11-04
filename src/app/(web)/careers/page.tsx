import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";
import { IMAGES } from "@/lib/web/listings";
import { CareersApplicationForm } from "@/components/web/careers-application-form";
import { PageIntro } from "@/components/web/page-intro";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join Urban Luxe in Dubai: sales, leasing, coordination, and specialist roles for people who take the brief seriously.",
};

const VALUES = [
  {
    title: "Client over volume",
    body: "We would rather place three residences well than chase twenty that do not fit.",
  },
  {
    title: "Hyper-local desks",
    body: "Advisors own communities: Palm, Downtown, Hills, Marina. Briefs stay on the streets you know.",
  },
  {
    title: "A real house",
    body: "Small team, clear standards, and mentorship from people who still take viewings.",
  },
  {
    title: "Craft & pace",
    body: "High standards on communication and presentation, with the speed Dubai expects.",
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
    blurb: "Annual lets in better buildings, with tenants briefed before the viewing.",
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
  "Clear progression and stable desks on one brokerage team",
] as const;

export default function CareersPage() {
  return (
    <>
      <PageIntro
        tone="light"
        layout="stack"
        eyebrow="Careers"
        title="Build a career on a serious desk."
        lede="We hire advisors, coordinators, and specialists who care about the brief as much as the close. If that sounds like you, tell us which role fits."
        primaryCta={{ href: "#roles", label: "View open roles" }}
        secondaryCta={{ href: "#apply", label: "Apply now" }}
      />

      <section id="roles" className="ul-band-light px-5 py-14 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <Reveal>
            <p className="ul-kicker">How we work</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">What we look for</h2>
            <div className="mt-8 space-y-6 border-l-2 border-[#008040]/30 pl-5">
              {VALUES.map((item) => (
                <div key={item.title}>
                  <p className="font-semibold text-[#0A1630]">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#0A1630]/65">{item.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={60}>
            <p className="ul-kicker">Open roles</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">Current openings</h2>
            <p className="ul-section-lede mt-3">
              Don&apos;t see your title? Send an open application. We hire for fit as much as for
              function.
            </p>
            <div className="mt-6 space-y-3">
              {OPEN_ROLES.map((role) => (
                <div
                  key={role.title}
                  className="flex flex-col gap-3 rounded-xl border border-[var(--ul-hair)] bg-[#F6F3EE] p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Briefcase className="h-4 w-4 text-[#008040]" strokeWidth={2} />
                      <h3 className="text-lg font-semibold text-[#0A1630]">{role.title}</h3>
                    </div>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[#0A1630]/45">
                      {role.type}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[#0A1630]/70">{role.blurb}</p>
                  </div>
                  <Link
                    href="#apply"
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#0A1630] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#081226]"
                  >
                    Apply
                  </Link>
                </div>
              ))}
            </div>
            <Link
              href="#apply"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#008040] hover:text-[#006633]"
            >
              Jump to application <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="bg-[var(--ul-secondary)] px-4 py-12 sm:px-5 sm:py-14 md:px-10 md:py-20">
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
              serious stock, and a team that keeps the inventory short on purpose.
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

      <section id="apply" className="border-t border-[var(--ul-hair)] bg-[#F6F3EE] px-5 py-14 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <p className="ul-kicker">Apply</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">
              Send your application
            </h2>
            <p className="ul-section-lede mt-3">
              Tell us the role, your experience, and why this house. We read every application.
              No buy/rent dropdowns required.
            </p>
            <p className="mt-6 text-sm text-[#0A1630]/65">
              A coordinator on the desk reads every application. Expect a reply within a few
              working days when there is a fit.
            </p>
          </Reveal>
          <Reveal delay={60}>
            <div className="rounded-xl border border-[var(--ul-hair)] bg-[#F6F3EE] p-6 md:p-8">
              <CareersApplicationForm />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#0A1630] px-5 py-12 md:px-10 md:py-14">
        <Reveal className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#008040]">
              Not sure yet?
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white md:text-2xl">
              Ask a question before you apply
            </h2>
          </div>
          <Link
            href="/contact"
            prefetch
            className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#0A1630] transition-colors hover:bg-[#F6F3EE]"
          >
            Contact the team
          </Link>
        </Reveal>
      </section>
    </>
  );
}
