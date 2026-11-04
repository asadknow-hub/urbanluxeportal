import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroSearch } from "@/components/web/hero-search";
import { IMAGES } from "@/lib/web/listings";

const HERO_VIDEO = "/b57b94922dc9e0dcee448d0ac5381a4a.mp4";

export function HeroSection() {
  return (
    <section className="relative flex h-[100svh] min-h-[36rem] flex-col overflow-hidden bg-[var(--ul-primary)]">
      <div className="absolute inset-0">
        <video
          className="absolute inset-0 h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={IMAGES.heroRefined}
          aria-hidden
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--ul-primary)]/70 via-[var(--ul-primary)]/35 to-[var(--ul-primary)]/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ul-primary)]/75 via-transparent to-[var(--ul-primary)]/25" />
      </div>

      <div className="ul-shell-wide relative flex min-h-0 flex-1 flex-col justify-end gap-8 pb-10 pt-[calc(4.75rem+var(--ul-safe-top,0px))] sm:pb-12 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,27rem)] lg:items-end lg:gap-14 xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,28rem)] xl:gap-16">
        <div className="max-w-none lg:max-w-[44rem] lg:justify-self-start">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--ul-secondary)]">
            Private Dubai brokerage
          </p>

          <h1
            className="mt-4 text-[clamp(2.75rem,8vw,6rem)] font-bold uppercase leading-[0.86] tracking-[-0.035em] text-[#F6F3EE]"
            style={{ fontFamily: "var(--font-headline), var(--font-poppins), system-ui, sans-serif" }}
          >
            <span className="block">Find your</span>
            <span className="mt-1 block text-[var(--ul-secondary)]">refined life.</span>
          </h1>

          <p className="mt-5 max-w-lg text-[0.95rem] leading-relaxed text-[#F6F3EE]/72 sm:text-base">
            Villas, apartments, and off-plan residences. A short private shortlist and one advisor
            through keys.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/buy" prefetch className="ul-btn-primary">
              Browse homes <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/sell" prefetch className="ul-btn-outline-light">
              List your property
            </Link>
          </div>
        </div>

        <div className="w-full border border-[#F6F3EE]/15 bg-[#F6F3EE] p-4 sm:p-5 lg:justify-self-end">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[var(--ul-secondary)]">
            Search Dubai
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--ul-primary)]">
            Buy, rent, or off-plan matched to your brief.
          </p>
          <div className="mt-3">
            <HeroSearch />
          </div>
        </div>
      </div>
    </section>
  );
}
