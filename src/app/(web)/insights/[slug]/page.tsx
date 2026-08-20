import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import {
  featuredInsight,
  INSIGHT_ARTICLES,
  insightBySlug,
  latestInsights,
} from "@/lib/web/insights";
import { Reveal } from "@/components/web/reveal";

export function generateStaticParams() {
  return INSIGHT_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = insightBySlug(slug);
  if (!article) return { title: "Insight" };
  return {
    title: article.title,
    description: article.excerpt,
  };
}

export default async function InsightArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = insightBySlug(slug);
  if (!article) notFound();

  const related = latestInsights(article.slug).slice(0, 3);
  const featured = featuredInsight();

  return (
    <>
      <article>
        <section className="bg-[#0B1D3D] px-5 pb-10 pt-10 text-white md:px-10 md:pb-12 md:pt-14">
          <div className="mx-auto max-w-[800px]">
            <Link
              href="/insights"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Insights
            </Link>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-[#1E7A4A]">
              {article.category}
            </p>
            <h1 className="mt-3 text-3xl leading-[1.15] md:text-4xl lg:text-[2.75rem]">
              {article.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60">
              <span>{article.date}</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {article.readMins} min read
              </span>
            </div>
          </div>
        </section>

        <div className="relative mx-auto -mt-2 max-w-[960px] px-5 md:px-10">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-[#F2F2F2] shadow-[0_8px_32px_rgba(11,29,61,0.12)]">
            <Image
              src={article.image}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 960px) 100vw, 960px"
              className="object-cover"
            />
          </div>
        </div>

        <div className="mx-auto max-w-[720px] px-5 py-12 md:px-10 md:py-16">
          <p className="text-lg font-medium leading-relaxed text-[#0B1D3D]/80 md:text-xl">
            {article.excerpt}
          </p>
          <div className="mt-8 space-y-5 text-base leading-relaxed text-[#0B1D3D]/75 md:text-[1.0625rem]">
            {article.body.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-[#e5e7eb] pt-8 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/insights"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B1D3D] hover:text-[#1E7A4A]"
            >
              <ArrowLeft className="h-4 w-4" />
              All insights
            </Link>
            <Link
              href="/contact"
              prefetch
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#0B1D3D] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0a172e]"
            >
              Talk to the desk
            </Link>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-[#e5e7eb] bg-[#F2F2F2] px-5 py-14 md:px-10 md:py-16">
          <div className="mx-auto max-w-[1280px]">
            <Reveal>
              <p className="ul-kicker">Keep reading</p>
              <h2 className="ul-section-heading mt-2 text-2xl md:text-3xl">Related notes</h2>
            </Reveal>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/insights/${item.slug}`}
                  prefetch
                  className="group overflow-hidden rounded-xl border border-[#e5e7eb] bg-white transition-shadow hover:shadow-[0_8px_28px_rgba(11,29,61,0.08)]"
                >
                  <div className="relative aspect-[16/10] bg-[#F2F2F2]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1E7A4A]">
                      {item.category}
                    </p>
                    <h3 className="mt-2 font-semibold leading-snug text-[#0B1D3D] group-hover:text-[#1E7A4A]">
                      {item.title}
                    </h3>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B1D3D]/7">
                      Read <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            {featured.slug !== article.slug && (
              <p className="mt-8 text-center text-sm text-[#0B1D3D]/55">
                Featured this month:{" "}
                <Link
                  href={`/insights/${featured.slug}`}
                  className="font-semibold text-[#1E7A4A] hover:underline"
                >
                  {featured.title}
                </Link>
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
