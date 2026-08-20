import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, CircleHelp, Handshake } from "lucide-react";
import { MortgageCalculator } from "@/components/web/mortgage-calculator";
import { MortgageFaq } from "@/components/web/mortgage-faq";
import { PageIntro } from "@/components/web/page-intro";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "Mortgages",
  description:
    "Dubai mortgage guidance from Urban Luxe — FAQs, an indicative calculator, and advisor support for buyers.",
};

export default function MortgagesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Mortgages"
        title="Finance the right home — with clarity."
        lede="Indicative calculations, straight answers on Dubai lending, and introductions to advisors who move at the pace of your offer."
      />

      <section className="border-b border-[#e5e7eb] bg-[#F2F2F2] px-5 py-10 md:px-10">
        <div className="mx-auto grid max-w-[1280px] gap-4 sm:grid-cols-3">
          {[
            {
              icon: Calculator,
              title: "Calculator",
              body: "Model price, deposit, rate, and term before you view.",
            },
            {
              icon: CircleHelp,
              title: "Clear FAQs",
              body: "Resident, non-resident, off-plan, and cost questions answered.",
            },
            {
              icon: Handshake,
              title: "Advisor path",
              body: "We connect you with mortgage specialists when you are ready.",
            },
          ].map((item) => (
            <Reveal key={item.title}>
              <div className="flex gap-3 rounded-xl border border-[#e5e7eb] bg-white p-5">
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#1E7A4A]" strokeWidth={2} />
                <div>
                  <p className="font-semibold text-[#0B1D3D]">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#0B1D3D]/65">{item.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="calculator" className="bg-white px-5 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1280px]">
          <Reveal>
            <p className="ul-kicker">Calculator</p>
            <h2 className="ul-section-heading mt-3 text-3xl md:text-4xl">
              Estimate your monthly payment
            </h2>
            <p className="ul-section-lede mt-3 max-w-2xl">
              Adjust the inputs to see an indicative repayment. Rates and eligibility are set by
              lenders — use this as a planning guide, then speak with an advisor.
            </p>
          </Reveal>
          <div className="mt-10">
            <MortgageCalculator />
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-[#e5e7eb] bg-[#F2F2F2] px-5 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-[880px]">
          <Reveal>
            <p className="ul-kicker">FAQs</p>
            <h2 className="ul-section-heading mt-3 text-3xl md:text-4xl">
              Mortgage questions, answered
            </h2>
            <p className="ul-section-lede mt-3">
              Practical guidance for buyers financing property in Dubai.
            </p>
          </Reveal>
          <div className="mt-10">
            <MortgageFaq />
          </div>
        </div>
      </section>

      <section className="bg-[var(--ul-primary)] px-5 py-16 md:px-10 md:py-20">
        <Reveal className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1E7A4A]">
              Next step
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
              Ready to structure your finance?
            </h2>
            <p className="mt-3 max-w-xl text-base text-white/70">
              Tell us the property or budget — we will align mortgage introductions with your search.
            </p>
          </div>
          <Link
            href="/contact"
            prefetch
            className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-semibold text-[#0B1D3D] transition-colors hover:bg-[#F2F2F2]"
          >
            Speak to us
          </Link>
        </Reveal>
      </section>
    </>
  );
}
