import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EnquireForm } from "@/components/web/enquire-form";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "Mortgages",
  description:
    "Dubai mortgage guidance from Urban Luxe: advisor support for buyers financing a residence.",
};

const POINTS = [
  {
    n: "01",
    title: "Clear lending path",
    body: "Resident, non-resident, and off-plan questions answered before you offer.",
  },
  {
    n: "02",
    title: "Advisor introductions",
    body: "We connect you with mortgage specialists who move at offer pace.",
  },
  {
    n: "03",
    title: "Aligned to the brief",
    body: "Budget, deposit, and term framed around the home you actually want.",
  },
] as const;

export default function MortgagesPage() {
  return (
    <section className="ul-band-light border-b border-[var(--ul-hair)]">
      <div className="ul-shell-wide py-8 md:py-10 lg:py-12">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          <Reveal className="min-w-0">
            <p className="ul-kicker">Mortgages</p>
            <h1 className="mt-3 max-w-xl text-[1.75rem] font-extrabold uppercase leading-[1.08] tracking-[-0.03em] text-[var(--ul-primary)] sm:text-4xl">
              Finance the right home with clarity.
            </h1>
            <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-[var(--ul-muted)]">
              Straight answers on Dubai lending and introductions to advisors who keep pace with
              your offer.
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
              href="/buy"
              prefetch
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ul-secondary)] hover:text-[#006633]"
            >
              Browse homes to finance <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <Reveal delay={60} className="min-w-0 lg:sticky lg:top-24">
            <div className="border border-[var(--ul-hair)] bg-white p-5 sm:p-6">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[var(--ul-secondary)]">
                Speak to us
              </p>
              <h2 className="mt-2 text-xl font-bold text-[var(--ul-primary)]">
                Mortgage enquiry
              </h2>
              <div className="mt-5">
                <EnquireForm defaultInterest="buy" />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
