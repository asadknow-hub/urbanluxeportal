import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ListPropertyForm } from "@/components/web/list-property-form";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "Valuations",
  description:
    "Request a Dubai property valuation from Urban Luxe: a site visit, real comps, and a clear recommendation.",
};

const POINTS = [
  {
    n: "01",
    title: "On-site reading",
    body: "Light, layout, plot, and condition assessed in person.",
  },
  {
    n: "02",
    title: "Real comps",
    body: "Nearby trades at real terms. Portal asking prices stay secondary.",
  },
  {
    n: "03",
    title: "Clear next step",
    body: "Sell, let, hold, or manage. One recommendation you can act on.",
  },
] as const;

export default function ValuationsPage() {
  return (
    <section className="ul-band-light border-b border-[var(--ul-hair)]">
      <div className="ul-shell-wide py-8 md:py-10 lg:py-12">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(17.5rem,22rem)] lg:gap-10 xl:gap-14">
          <Reveal className="min-w-0">
            <p className="ul-kicker">Valuations</p>
            <h1 className="mt-3 max-w-xl text-[1.75rem] font-extrabold uppercase leading-[1.08] tracking-[-0.03em] text-[var(--ul-primary)] sm:text-4xl">
              A valuation built from the residence and the market.
            </h1>
            <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-[var(--ul-muted)]">
              Share the address. We reply with next steps for a site visit and comps. If timing is
              wrong, we say so.
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
              href="/sell"
              prefetch
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ul-secondary)] hover:text-[#006633]"
            >
              Ready to instruct a sale? <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <Reveal delay={60} className="min-w-0 w-full max-w-[22rem] justify-self-start lg:sticky lg:top-24 lg:justify-self-end">
            <div id="request" className="border border-[var(--ul-hair)] bg-white p-4 sm:p-5">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[var(--ul-secondary)]">
                Request
              </p>
              <h2 className="mt-2 text-lg font-bold text-[var(--ul-primary)]">Book a valuation</h2>
              <div className="mt-4">
                <ListPropertyForm defaultIntent="valuation" />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
