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
    body: "List on portals or place quietly through the private network.",
  },
  {
    n: "02",
    title: "On-site valuation",
    body: "Light, plot, and nearby trades, discussed at the residence.",
  },
  {
    n: "03",
    title: "One desk through keys",
    body: "Brief, strategy, offers, SPA, and handover on the same thread.",
  },
] as const;

export default function SellPage() {
  return (
    <section className="ul-band-light border-b border-[var(--ul-hair)]">
      <div className="ul-shell-wide py-10 md:py-14 lg:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 xl:gap-20">
          <Reveal className="min-w-0">
            <p className="ul-kicker">List your property</p>
            <h1 className="mt-3 max-w-xl text-[1.85rem] font-extrabold uppercase leading-[1.08] tracking-[-0.03em] text-[var(--ul-primary)] sm:text-4xl md:text-[2.75rem]">
              Sell or let without a board on the street.
            </h1>
            <p className="mt-4 max-w-lg text-[0.95rem] leading-relaxed text-[var(--ul-muted)] sm:text-base">
              Tell us the address and intent. A specialist will advise on sale, letting, or both,
              then stay on the thread through keys.
            </p>

            <ol className="mt-10 space-y-6 border-t border-[var(--ul-hair)] pt-8">
              {POINTS.map((item) => (
                <li key={item.n} className="grid gap-1 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-4">
                  <span className="text-xs font-bold tracking-[0.16em] text-[var(--ul-secondary)]">
                    {item.n}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ul-primary)]">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--ul-muted)]">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Link
              href="/contact"
              prefetch
              className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ul-secondary)] hover:text-[#006633]"
            >
              Prefer to email or call? Contact us <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <Reveal delay={60} className="min-w-0 lg:sticky lg:top-24">
            <div
              id="instruct"
              className="border border-[var(--ul-hair)] bg-white p-5 sm:p-6 md:p-8"
            >
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[var(--ul-secondary)]">
                Instruct us
              </p>
              <h2 className="mt-2 text-xl font-bold text-[var(--ul-primary)] md:text-2xl">
                Request a conversation
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ul-muted)]">
                Address, intent, and how to reach you. We reply with next steps.
              </p>
              <div className="mt-6">
                <ListPropertyForm />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
