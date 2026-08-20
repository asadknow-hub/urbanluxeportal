import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IMAGES } from "@/lib/web/listings";
import { PageIntro } from "@/components/web/page-intro";
import { Reveal } from "@/components/web/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Insights",
  description: "Market updates, launches, and expert notes from Urban Luxe Dubai.",
};

const ARTICLES = [
  {
    image: IMAGES.downtown,
    panel: "bg-[var(--ul-primary)] text-white",
    title: "Downtown Dubai market update",
    href: "/insights",
  },
  {
    image: IMAGES.penthouse,
    panel: "bg-[var(--ul-tertiary)] text-[var(--ul-primary)]",
    title: "Villa sales reach new highs",
    href: "/insights",
  },
  {
    image: IMAGES.creek,
    panel: "bg-[var(--ul-secondary)] text-white",
    title: "Off-plan launches this quarter",
    href: "/insights",
  },
] as const;

export default function InsightsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Insights"
        title="Featured notes from the desk."
        lede="Market updates, new launches, and practical guidance for buyers, tenants, and investors in Dubai."
      />
      <section className="bg-white px-5 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-6 md:grid-cols-3">
            {ARTICLES.map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <Link
                  href={item.href}
                  prefetch
                  className="group block overflow-hidden rounded-sm shadow-[0_4px_24px_rgba(11,29,61,0.06)] transition-shadow hover:shadow-[0_8px_32px_rgba(11,29,61,0.1)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[var(--ul-tertiary)]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className={cn("px-6 py-5", item.panel)}>
                    <p className="text-lg font-semibold leading-snug md:text-xl">{item.title}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium opacity-90 transition-all group-hover:gap-2.5">
                      Read more <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
