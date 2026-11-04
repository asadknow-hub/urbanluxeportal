import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EnquireForm } from "@/components/web/enquire-form";
import { MortgageCalculator } from "@/components/web/mortgage-calculator";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "Mortgages",
  description:
    "Dubai mortgage guidance from Urban Luxe: indicative calculator and advisor support for buyers.",
};

export default function MortgagesPage() {
  return (
    <section className="ul-band-light border-b border-[var(--ul-hair)]">
      <div className="ul-shell-wide py-8 md:py-10 lg:py-12">
        <div className="mb-8 max-w-2xl md:mb-10">
          <Reveal>
            <p className="ul-kicker">Mortgages</p>
            <h1 className="mt-3 text-[1.75rem] font-extrabold uppercase leading-[1.08] tracking-[-0.03em] text-[var(--ul-primary)] sm:text-4xl">
              Finance the right home with clarity.
            </h1>
            <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-[var(--ul-muted)]">
              Run an indicative repayment, then send a short enquiry. We introduce advisors who
              keep pace with your offer.
            </p>
          </Reveal>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(17.5rem,22rem)] lg:gap-10 xl:gap-12">
          <Reveal className="min-w-0">
            <MortgageCalculator />
            <Link
              href="/buy"
              prefetch
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ul-secondary)] hover:text-[#006633]"
            >
              Browse homes to finance <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <Reveal delay={60} className="min-w-0 w-full max-w-[22rem] justify-self-start lg:sticky lg:top-24 lg:justify-self-end">
            <div className="border border-[var(--ul-hair)] bg-white p-4 sm:p-5">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[var(--ul-secondary)]">
                Speak to us
              </p>
              <h2 className="mt-2 text-lg font-bold text-[var(--ul-primary)]">Mortgage enquiry</h2>
              <div className="mt-4">
                <EnquireForm defaultInterest="buy" />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
