import type { Metadata } from "next";
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

      <section id="calculator" className="bg-white px-5 py-14 md:px-10 md:py-20">
        <div className="mx-auto max-w-[720px]">
          <MortgageCalculator />
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
    </>
  );
}
