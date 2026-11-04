import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EnquireForm } from "@/components/web/enquire-form";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "Property Management",
  description:
    "Urban Luxe property management in Dubai: tenant care, maintenance coordination, and reporting for landlords who want the house looked after.",
};

const POINTS = [
  {
    n: "01",
    title: "Tenant placement",
    body: "Qualified occupants, photographed handovers, renewals before the scramble.",
  },
  {
    n: "02",
    title: "Maintenance",
    body: "Trusted vendors, clear approvals, updates you can read without a site visit.",
  },
  {
    n: "03",
    title: "One landlord desk",
    body: "Rent follow-up, notices, and building liaison on a single thread.",
  },
] as const;

export default function PropertyManagementPage() {
  return (
    <section className="ul-band-light border-b border-[var(--ul-hair)]">
      <div className="ul-shell-wide py-8 md:py-10 lg:py-12">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          <Reveal className="min-w-0">
            <p className="ul-kicker">Property management</p>
            <h1 className="mt-3 max-w-xl text-[1.75rem] font-extrabold uppercase leading-[1.08] tracking-[-0.03em] text-[var(--ul-primary)] sm:text-4xl">
              Management that treats the house as a house.
            </h1>
            <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-[var(--ul-muted)]">
              For landlords who want orderly maintenance and a desk that picks up the phone.
            </p>

            <ol className="mt-8 space-y-4 border-t border-[var(--ul-hair)] pt-7">
              {POINTS.map((item) => (
                <li key={item.n} className="grid gap-1 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-3">
                  <span className="text-xs font-bold tracking-[0.16em] text-[var(--ul-secondary)]">
                    {item.n}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ul-primary)]">{item.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-[var(--ul-muted)]">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Link
              href="/valuations"
              prefetch
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ul-secondary)] hover:text-[#006633]"
            >
              Need a valuation first? <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <Reveal delay={60} className="min-w-0 lg:sticky lg:top-24">
            <div id="enquire" className="border border-[var(--ul-hair)] bg-white p-5 sm:p-6">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[var(--ul-secondary)]">
                Enquire
              </p>
              <h2 className="mt-2 text-xl font-bold text-[var(--ul-primary)]">
                Tell us about the property
              </h2>
              <div className="mt-5">
                <EnquireForm compact defaultInterest="sell" />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
