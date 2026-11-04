import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ListPropertyForm } from "@/components/web/list-property-form";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "List Your Property",
  description:
    "Instruct Urban Luxe to sell or let a Dubai residence privately, with a valuation built from site visits and real comps.",
};

const POINTS = [
  {
    n: "01",
    title: "Private placement",
    body: "Portal list or quiet placement through the private network.",
  },
  {
    n: "02",
    title: "On-site valuation",
    body: "Light, plot, and nearby trades, discussed at the residence.",
  },
  {
    n: "03",
    title: "One desk through keys",
    body: "Brief, offers, SPA, and handover on the same thread.",
  },
] as const;

export default function SellPage() {
  return (
    <section className="ul-band-light border-b border-[var(--ul-hair)]">
      <div className="ul-shell-wide py-8 md:py-10 lg:py-12">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          <Reveal className="min-w-0">
            <p className="ul-kicker">List your property</p>
            <h1 className="mt-3 max-w-xl text-[1.75rem] font-extrabold uppercase leading-[1.08] tracking-[-0.03em] text-[var(--ul-primary)] sm:text-4xl">
              Sell or let without a board on the street.
            </h1>
            <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-[var(--ul-muted)]">
              Tell us the address and intent. A specialist advises on sale, letting, or both.
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
              href="/contact"
              prefetch
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ul-secondary)] hover:text-[#006633]"
            >
              Prefer to email or call? Contact us <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <Reveal delay={60} className="min-w-0 lg:sticky lg:top-24">
            <div
              id="instruct"
              className="border border-[var(--ul-hair)] bg-white p-5 sm:p-6"
            >
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[var(--ul-secondary)]">
                Instruct us
              </p>
              <h2 className="mt-2 text-xl font-bold text-[var(--ul-primary)]">
                Request a conversation
              </h2>
              <div className="mt-5">
                <ListPropertyForm />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
