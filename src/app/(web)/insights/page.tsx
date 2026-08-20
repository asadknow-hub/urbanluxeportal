import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, TrendingUp } from "lucide-react";
import { featuredInsight, latestInsights } from "@/lib/web/insights";
import { Reveal } from "@/components/web/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Market updates, community briefs, and buyer guidance from Urban Luxe — Dubai real estate notes from the desk.",
};

const TOPICS = [
  { label: "Market", href: "#featured" },
  { label: "Communities", href: "#latest" },
  { label: "Off-plan", href: "#latest" },
  { label: "Buying guide", href: "#guides" },
  { label: "Investment", href: "#snapshot" },
] as const;

const SNAPSHOT = [
  { label: "Median ready sale lift", value: "+12%", sub: "YoY · select communities" },
  { label: "Avg. days on market", value: "28", sub: "Prime villa stock" },
  { label: "Off-plan share", value: "41%", sub: "Of Q2 enquiries" },
  { label: "Mortgage share", value: "63%", sub: "Of closed buy briefs" },
] as const;

const GUIDES = [
  {
    title: "First viewing checklist",
    body: "Light, noise, service charge, and the three questions that reveal a rushed listing.",
    href: "/insights/palm-fronds-what-to-check-before-offer",
  },
  {
    title: "Offer strategy in a competitive week",
    body: "When to move fast, when to wait, and how to structure conditions without losing the house.",
    href: "/insights/villa-sales-reach-new-highs",
  },
  {
    title: "Rent vs buy in Dubai — 2026 frame",
    body: "A clear model for five-year holds, residency plans, and opportunity cost.",
    href: "/insights/holding-periods-that-actually-pay",
  },
] as const;

function MetaRow({
  category,
  date,
  readMins,
  light = false,
}: {
  category: string;
  date: string;
  readMins: number;
  light?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em]",
        light ? "text-white/70" : "text-[#0B1D3D]/45"
      )}
    >
      <span className="text-[#1E7A4A]">{category}</span>
      <span aria-hidden>·</span>
      <span>{date}</span>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1 normal-case tracking-normal">
        <Clock3 className="h-3 w-3" />
        {readMins} min
      </span>
    </div>
  );
}

export default function InsightsPage() {
  const featured = featuredInsight();
  const articles = latestInsights(featured.slug);

  return (
    <>
      <section className="bg-[#0B1D3D] px-4 pb-10 pt-10 text-white sm:px-5 sm:pb-12 sm:pt-12 md:px-10 md:pb-14 md:pt-16">
        <div className="mx-auto max-w-[1280px]">
          <Reveal>
            <p className="ul-kicker text-[#1E7A4A]">Insights</p>
            <h1 className="mt-3 max-w-3xl text-[1.85rem] leading-[1.12] sm:mt-4 sm:text-3xl md:text-5xl">
              Notes from the desk — market, communities, and how to buy well.
            </h1>
            <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-white/70 sm:text-sm md:text-base">
              Short briefs for clients who want signal over noise: launches worth a private look,
              pricing that moved, and guidance before you write an offer.
            </p>
            <div className="ul-hide-scroll mt-6 flex gap-2 overflow-x-auto pb-1 sm:mt-7 sm:flex-wrap sm:overflow-visible sm:pb-0">
              {TOPICS.map((topic) => (
                <Link
                  key={topic.label}
                  href={topic.href}
                  className="shrink-0 rounded-full border border-white/20 px-3.5 py-2 text-xs font-semibold text-white/85 transition-colors hover:border-white/50 hover:bg-white/10"
                >
                  {topic.label}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="featured" className="bg-white px-4 py-10 sm:px-5 sm:py-12 md:px-10 md:py-16">
        <div className="mx-auto max-w-[1280px]">
          <Reveal>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="ul-kicker">Featured</p>
                <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">This month&apos;s brief</h2>
              </div>
              <Link
                href="/buy"
                prefetch
                className="hidden text-sm font-semibold text-[#1E7A4A] transition-colors hover:text-[#155c38] sm:inline-flex sm:items-center sm:gap-1.5"
              >
                Browse residences <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          <Reveal>
            <Link
              href={`/insights/${featured.slug}`}
              prefetch
              className="group grid overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#F2F2F2] shadow-[0_4px_24px_rgba(11,29,61,0.05)] transition-shadow hover:shadow-[0_10px_36px_rgba(11,29,61,0.1)] lg:grid-cols-2"
            >
              <div className="relative min-h-[240px] lg:min-h-[380px]">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center px-6 py-8 md:px-10 md:py-12">
                <MetaRow
                  category={featured.category}
                  date={featured.date}
                  readMins={featured.readMins}
                />
                <h3 className="mt-4 text-2xl font-bold leading-snug text-[#0B1D3D] transition-colors group-hover:text-[#1E7A4A] md:text-3xl">
                  {featured.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-[#0B1D3D]/70 md:text-base">
                  {featured.excerpt}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B1D3D] transition-all group-hover:gap-2.5">
                  Read the brief <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </Reveal>
        </div>
      </section>

      <section id="snapshot" className="border-y border-[#e5e7eb] bg-[#F2F2F2] px-5 py-10 md:px-10 md:py-12">
        <div className="mx-auto max-w-[1280px]">
          <Reveal>
            <div className="mb-6 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#1E7A4A]" strokeWidth={2.25} />
              <p className="text-sm font-semibold text-[#0B1D3D]">Market snapshot</p>
              <span className="text-xs text-[#0B1D3D]/45">Indicative · Urban Luxe desk</span>
            </div>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SNAPSHOT.map((item, i) => (
              <Reveal key={item.label} delay={i * 40}>
                <div className="rounded-xl border border-[#e5e7eb] bg-white px-5 py-5">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#0B1D3D]/45">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-[#0B1D3D]">{item.value}</p>
                  <p className="mt-1 text-xs text-[#0B1D3D]/55">{item.sub}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="latest" className="bg-white px-5 py-14 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1280px]">
          <Reveal>
            <p className="ul-kicker">Latest</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">From the desk</h2>
            <p className="ul-section-lede mt-3 max-w-xl">
              Community notes, launch filters, and practical pieces for buyers, tenants, and
              investors.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((item, i) => (
              <Reveal key={item.slug} delay={i * 50}>
                <Link
                  href={`/insights/${item.slug}`}
                  prefetch
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_2px_12px_rgba(11,29,61,0.04)] transition-shadow hover:shadow-[0_8px_28px_rgba(11,29,61,0.1)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#F2F2F2]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className={cn("flex flex-1 flex-col px-5 py-5", item.panel)}>
                    <MetaRow
                      category={item.category}
                      date={item.date}
                      readMins={item.readMins}
                      light={!item.panel.includes("tertiary")}
                    />
                    <h3 className="mt-3 text-lg font-bold leading-snug md:text-xl">{item.title}</h3>
                    <p
                      className={cn(
                        "mt-2 flex-1 text-sm leading-relaxed",
                        item.panel.includes("tertiary") ? "text-[#0B1D3D]/70" : "text-white/80"
                      )}
                    >
                      {item.excerpt}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold opacity-95 transition-all group-hover:gap-2.5">
                      Read more <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="guides" className="border-t border-[#e5e7eb] bg-[#F2F2F2] px-5 py-14 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <p className="ul-kicker">Guides</p>
            <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">
              Practical papers for serious clients
            </h2>
            <p className="ul-section-lede mt-3">
              Not marketing decks — short frameworks we use on viewings and offer calls.
            </p>
            <Link
              href="/contact"
              prefetch
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#0B1D3D] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0a172e]"
            >
              Request a briefing
            </Link>
          </Reveal>

          <div className="space-y-3">
            {GUIDES.map((guide, i) => (
              <Reveal key={guide.title} delay={i * 50}>
                <Link
                  href={guide.href}
                  prefetch
                  className="group flex items-start justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white px-5 py-5 transition-colors hover:border-[#0B1D3D]/25"
                >
                  <div>
                    <p className="font-semibold text-[#0B1D3D] group-hover:text-[#1E7A4A]">
                      {guide.title}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#0B1D3D]/65">{guide.body}</p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#0B1D3D]/35 transition-transform group-hover:translate-x-0.5 group-hover:text-[#1E7A4A]" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0B1D3D] px-5 py-14 md:px-10 md:py-16">
        <Reveal className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1E7A4A]">
              Stay informed
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
              Keep up with what&apos;s happening
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70 md:text-base">
              Market updates, new launches, and expert notes — when something moves that matters to
              your brief, we write.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/contact"
              prefetch
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#0B1D3D] transition-colors hover:bg-[#F2F2F2]"
            >
              Get the briefing
            </Link>
            <Link
              href="/buy"
              prefetch
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/35 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              View properties
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
