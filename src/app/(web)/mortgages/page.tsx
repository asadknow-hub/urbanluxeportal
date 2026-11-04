import type { Metadata } from "next";
import Link from "next/link";
import { MortgageCalculator } from "@/components/web/mortgage-calculator";
import { MortgageFaq } from "@/components/web/mortgage-faq";
import { PageIntro } from "@/components/web/page-intro";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "Mortgages",
  description:
    "Dubai mortgage guidance from Urban Luxe: FAQs, an indicative calculator, and advisor support for buyers.",
};

export default function MortgagesPage() {
  return (
    <>
      <PageIntro
        tone="dark"
        layout="compact"
        eyebrow="Mortgages"
        title="Finance the right home with clarity."
        lede="Indicative calculations, straight answers on Dubai lending, and introductions to advisors who move at the pace of your offer."
        primaryCta={{ href: "#calculator", label: "Calculate repayments" }}
        secondaryCta={{ href: "/contact", label: "Speak to an advisor", prefetch: true }}
      />

      <section id="calculator" className="border-b border-[var(--ul-hair)] bg-[#F6F3EE] px-5 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-[960px]">
          <MortgageCalculator />
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[var(--ul-hair)] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
            <p className="text-sm font-semibold text-[#0A1630]">
              Need help or ready to proceed?
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link
                href="/contact"
                prefetch
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#0A1630] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#081226]"
              >
                Start Mortgage Approval
              </Link>
              <Link
                href="/contact"
                prefetch
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#0A1630] px-5 text-sm font-semibold text-[#0A1630] transition-colors hover:bg-[#F6F3EE]"
              >
                Speak to our team
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="ul-band-light px-5 py-14 md:px-10 md:py-20">
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
          <div className="mt-8">
            <MortgageFaq />
          </div>
          <Reveal className="mt-10 flex flex-col items-start justify-between gap-5 rounded-xl border border-[var(--ul-hair)] bg-[#F6F3EE] p-6 sm:flex-row sm:items-center md:p-8">
            <div>
              <p className="text-lg font-semibold text-[#0A1630]">Still have questions?</p>
              <p className="mt-1 text-sm text-[#0A1630]/65">
                We&apos;ll match your budget and timeline with the right lending path.
              </p>
            </div>
            <Link
              href="/contact"
              prefetch
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#0A1630] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#081226]"
            >
              Book a consultation
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
