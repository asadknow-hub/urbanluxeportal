import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/web/listings";
import { Reveal } from "@/components/web/reveal";

const POINTS = [
  {
    n: "01",
    title: "Community depth",
    body: "Advisors work Palm, Marina, Hills, and Creek every week. Briefs stay tied to streets they know.",
  },
  {
    n: "02",
    title: "Vetted desk standards",
    body: "Background checks and house service standards before anyone represents your brief.",
  },
  {
    n: "03",
    title: "Same-day viewings",
    body: "Private tours within hours when timing matters, including evenings and weekends.",
  },
  {
    n: "04",
    title: "Negotiation with clarity",
    body: "Offer strategy, SPA clauses, and handover detail handled on the same thread.",
  },
  {
    n: "05",
    title: "One advisor",
    body: "Your contact stays with you from enquiry through keys. No call-centre handoffs.",
  },
  {
    n: "06",
    title: "Quiet stock",
    body: "Off-market listings and developer allocations before they hit open portals.",
  },
] as const;

export function WhyAgentsSection() {
  return (
    <section className="ul-band-light py-11 md:py-16 lg:py-[4.25rem]">
      <div className="ul-shell-wide">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:gap-14 xl:gap-20">
          <Reveal className="min-w-0">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[var(--ul-tertiary)] sm:aspect-[5/6] lg:sticky lg:top-24 lg:aspect-auto lg:min-h-[32rem]">
              <Image
                src={IMAGES.penthouse}
                alt="Advisor preparing a Dubai viewing brief"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          <div className="min-w-0">
            <Reveal delay={40}>
              <p className="ul-kicker">Our people</p>
              <h2 className="ul-section-heading mt-3 text-3xl md:text-4xl">
                Why our agents are right for you
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--ul-muted)]">
                Market craft and private-office care on the same desk. Specialists who prepare
                briefs, walk sites, and close with clarity.
              </p>
            </Reveal>

            <ol className="mt-10 space-y-7 border-t border-[var(--ul-hair)] pt-8">
              {POINTS.map((item, i) => (
                <Reveal key={item.n} delay={60 + i * 40}>
                  <li className="grid gap-3 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-5">
                    <span className="text-xs font-bold tracking-[0.16em] text-[var(--ul-secondary)]">
                      {item.n}
                    </span>
                    <div>
                      <h3 className="text-base font-bold uppercase tracking-wide text-[var(--ul-primary)]">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-[var(--ul-muted)]">
                        {item.body}
                      </p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>

            <Reveal delay={280} className="mt-10">
              <Link href="/contact" prefetch className="ul-btn-primary rounded-full">
                Speak with an agent
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
