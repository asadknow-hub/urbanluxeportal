import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { featuredInsight, latestInsights } from "@/lib/web/insights";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Market updates, community briefs, and buyer guidance from Urban Luxe. Dubai real estate notes from the desk.",
};

const NAV = [
  { label: "Featured", href: "#featured" },
  { label: "Latest", href: "#latest" },
  { label: "Guides", href: "#guides" },
] as const;

const GUIDES = [
  {
    title: "First viewing checklist",
    body: "Light, noise, service charge, and the questions that reveal a rushed listing.",
    href: "/insights/palm-fronds-what-to-check-before-offer",
  },
  {
    title: "Offer strategy in a competitive week",
    body: "When to move fast, when to wait, and how to structure conditions.",
    href: "/insights/villa-sales-reach-new-highs",
  },
  {
    title: "Rent vs buy in Dubai, 2026",
    body: "A clear frame for five-year holds, residency plans, and opportunity cost.",
    href: "/insights/holding-periods-that-actually-pay",
  },
] as const;

function Meta({
  category,
  date,
  readMins,
}: {
  category: string;
  date: string;
  readMins: number;
}) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--ul-muted)]">
      <span className="text-[var(--ul-secondary)]">{category}</span>
      <span aria-hidden>·</span>
      <span>{date}</span>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1 normal-case tracking-normal">
        <Clock3 className="h-3 w-3" />
        {readMins} min
      </span>
    </p>
  );
}

export default function InsightsPage() {
  const featured = featuredInsight();
  const articles = latestInsights(featured.slug);

  return (
    <>
      <section className="ul-band-light border-b border-[var(--ul-hair)]">
        <div className="ul-shell-wide py-8 md:py-10 lg:py-12">
          <Reveal className="max-w-3xl">
            <p className="ul-kicker">Insights</p>
            <h1 className="mt-3 text-[1.75rem] font-extrabold uppercase leading-[1.08] tracking-[-0.03em] text-[var(--ul-primary)] sm:text-4xl md:text-[2.75rem]">
              Notes from the desk
            </h1>
            <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-[var(--ul-muted)] sm:text-base">
              Market, communities, and how to buy well. Short briefs for clients who want signal
              before they view or offer.
            </p>
          </Reveal>

          <nav
            aria-label="Insights sections"
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--ul-hair)] pt-5"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-[var(--ul-primary)] transition-colors hover:text-[var(--ul-secondary)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section id="featured" className="ul-band-light border-b border-[var(--ul-hair)] scroll-mt-24">
        <div className="ul-shell-wide py-10 md:py-12 lg:py-14">
          <Reveal>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="ul-kicker">Featured</p>
                <h2 className="mt-2 text-xl font-bold text-[var(--ul-primary)] md:text-2xl">
                  This month&apos;s brief
                </h2>
              </div>
              <Link
                href="/buy"
                prefetch
                className="hidden text-sm font-semibold text-[var(--ul-secondary)] hover:text-[#006633] sm:inline-flex sm:items-center sm:gap-1.5"
              >
                Browse residences <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          <Reveal>
            <Link
              href={`/insights/${featured.slug}`}
              prefetch
              className="group grid gap-6 border border-[var(--ul-hair)] bg-white lg:grid-cols-2 lg:gap-0"
            >
              <div className="relative min-h-[14rem] sm:min-h-[18rem] lg:min-h-[22rem]">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
                <Meta
                  category={featured.category}
                  date={featured.date}
                  readMins={featured.readMins}
                />
                <h3 className="mt-3 text-2xl font-bold leading-snug text-[var(--ul-primary)] transition-colors group-hover:text-[var(--ul-secondary)] md:text-[1.75rem]">
                  {featured.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ul-muted)] md:text-[0.95rem]">
                  {featured.excerpt}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ul-primary)]">
                  Read the brief <ArrowRight className="h-4 w-4 text-[var(--ul-secondary)]" />
                </span>
              </div>
            </Link>
          </Reveal>
        </div>
      </section>

      <section id="latest" className="ul-band-light border-b border-[var(--ul-hair)] scroll-mt-24">
        <div className="ul-shell-wide py-10 md:py-12 lg:py-14">
          <Reveal className="max-w-2xl">
            <p className="ul-kicker">Latest</p>
            <h2 className="mt-2 text-xl font-bold text-[var(--ul-primary)] md:text-2xl">
              From the desk
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ul-muted)]">
              Community notes, launch filters, and practical pieces for buyers and investors.
            </p>
          </Reveal>

          <ul className="mt-8 divide-y divide-[var(--ul-hair)] border-y border-[var(--ul-hair)]">
            {articles.map((item, i) => (
              <li key={item.slug}>
                <Reveal delay={i * 40}>
                  <Link
                    href={`/insights/${item.slug}`}
                    prefetch
                    className="group grid gap-4 py-5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6 md:grid-cols-[10rem_minmax(0,1fr)_auto] md:items-center md:py-6"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-[var(--ul-paper)] sm:aspect-[4/3]">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <Meta
                        category={item.category}
                        date={item.date}
                        readMins={item.readMins}
                      />
                      <h3 className="mt-2 text-base font-bold leading-snug text-[var(--ul-primary)] transition-colors group-hover:text-[var(--ul-secondary)] md:text-lg">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--ul-muted)]">
                        {item.excerpt}
                      </p>
                    </div>
                    <span className="hidden items-center gap-1.5 text-sm font-semibold text-[var(--ul-secondary)] md:inline-flex">
                      Read <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="guides" className="ul-band-light border-b border-[var(--ul-hair)] scroll-mt-24">
        <div className="ul-shell-wide py-10 md:py-12 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
            <Reveal>
              <p className="ul-kicker">Guides</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--ul-primary)] md:text-2xl">
                Practical papers
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--ul-muted)]">
                Short frameworks we use on viewings and offer calls. The same notes we share with
                clients.
              </p>
              <Link
                href="/contact"
                prefetch
                className="mt-6 inline-flex h-11 items-center justify-center bg-[var(--ul-secondary)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#006633]"
              >
                Request a briefing
              </Link>
            </Reveal>

            <ol className="divide-y divide-[var(--ul-hair)] border-y border-[var(--ul-hair)]">
              {GUIDES.map((guide, i) => (
                <li key={guide.title}>
                  <Reveal delay={i * 40}>
                    <Link
                      href={guide.href}
                      prefetch
                      className="group grid gap-3 py-5 sm:grid-cols-[2.75rem_minmax(0,1fr)_auto] sm:items-start sm:gap-4"
                    >
                      <span className="text-xs font-bold tracking-[0.16em] text-[var(--ul-secondary)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--ul-primary)] transition-colors group-hover:text-[var(--ul-secondary)]">
                          {guide.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--ul-muted)]">
                          {guide.body}
                        </p>
                      </div>
                      <ArrowRight className="mt-1 hidden h-4 w-4 shrink-0 text-[var(--ul-muted)] transition-colors group-hover:text-[var(--ul-secondary)] sm:block" />
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="ul-band-light">
        <div className="ul-shell-wide flex flex-col items-start justify-between gap-6 border-t border-[var(--ul-hair)] py-10 md:flex-row md:items-center md:py-12">
          <Reveal className="max-w-lg">
            <p className="ul-kicker">Stay close</p>
            <h2 className="mt-2 text-xl font-bold text-[var(--ul-primary)] md:text-2xl">
              When the market moves, we write
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ul-muted)]">
              Ask for a private briefing if you want launches and pricing notes tied to your brief.
            </p>
          </Reveal>
          <Reveal delay={40} className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              prefetch
              className="inline-flex h-11 items-center justify-center bg-[var(--ul-secondary)] px-5 text-sm font-semibold text-white hover:bg-[#006633]"
            >
              Get the briefing
            </Link>
            <Link
              href="/buy"
              prefetch
              className="inline-flex h-11 items-center justify-center border border-[var(--ul-hair)] px-5 text-sm font-semibold text-[var(--ul-primary)] hover:border-[var(--ul-primary)]"
            >
              View properties
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
