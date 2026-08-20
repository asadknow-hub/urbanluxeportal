import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, CircleHelp, Handshake } from "lucide-react";
import { MortgageCalculator } from "@/components/web/mortgage-calculator";
import { MortgageFaq } from "@/components/web/mortgage-faq";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "Mortgages",
  description:
    "Dubai mortgage guidance from Urban Luxe — FAQs, an indicative calculator, and advisor support for buyers.",
};

const HIGHLIGHTS = [
  {
    icon: Calculator,
    title: "Calculator",
    body: "Model price, deposit, rate, and term before you view.",
    href: "#calculator",
  },
  {
    icon: CircleHelp,
    title: "Clear FAQs",
    body: "Resident, non-resident, off-plan, and cost questions answered.",
    href: "#faq",
  },
  {
    icon: Handshake,
    title: "Advisor path",
    body: "We connect you with mortgage specialists when you are ready.",
    href: "/contact",
  },
] as const;

export default function MortgagesPage() {
  return (
    <>
      <section className="bg-[#0B1D3D] px-4 pb-8 pt-10 text-white sm:px-5 sm:pb-10 sm:pt-12 md:px-10 md:pb-12 md:pt-16">
        <div className="mx-auto max-w-[1280px]">
          <Reveal>
            <p className="ul-kicker text-[#1E7A4A]">Mortgages</p>
            <h1 className="mt-3 max-w-3xl text-[1.85rem] leading-[1.12] sm:mt-4 sm:text-3xl md:text-5xl">
              Finance the right home — with clarity.
            </h1>
            <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-white/70 sm:text-sm md:text-base">
              Indicative calculations, straight answers on Dubai lending, and introductions to
              advisors who move at the pace of your offer.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="#calculator"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#1E7A4A] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#155c38] sm:h-11"
              >
                Calculate repayments
              </Link>
              <Link
                href="/contact"
                prefetch
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/35 bg-transparent px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:h-11"
              >
                Speak to an advisor
              </Link>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-3 sm:grid-cols-3 md:mt-10 md:gap-4">
            {HIGHLIGHTS.map((item) => (
              <Reveal key={item.title}>
                <Link
                  href={item.href}
                  prefetch={item.href.startsWith("/")}
                  className="flex h-full gap-3 rounded-xl border border-white/10 bg-white/95 p-4 text-[#0B1D3D] transition-colors hover:bg-white"
                >
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#1E7A4A]" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#0B1D3D]/65">{item.body}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="calculator" className="border-b border-[#e5e7eb] bg-[#F2F2F2] px-5 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-[960px]">
          <MortgageCalculator />
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
            <p className="text-sm font-semibold text-[#0B1D3D]">
              Need help or ready to proceed?
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link
                href="/contact"
                prefetch
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#0B1D3D] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0a172e]"
              >
                Start Mortgage Approval
              </Link>
              <Link
                href="/contact"
                prefetch
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#0B1D3D] px-5 text-sm font-semibold text-[#0B1D3D] transition-colors hover:bg-[#F2F2F2]"
              >
                Speak to our team
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white px-5 py-14 md:px-10 md:py-20">
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
          <Reveal className="mt-10 flex flex-col items-start justify-between gap-5 rounded-xl border border-[#e5e7eb] bg-[#F2F2F2] p-6 sm:flex-row sm:items-center md:p-8">
            <div>
              <p className="text-lg font-semibold text-[#0B1D3D]">Still have questions?</p>
              <p className="mt-1 text-sm text-[#0B1D3D]/65">
                We&apos;ll match your budget and timeline with the right lending path.
              </p>
            </div>
            <Link
              href="/contact"
              prefetch
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#0B1D3D] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0a172e]"
            >
              Book a consultation
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
