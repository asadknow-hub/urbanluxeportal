import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { COMMUNITIES, featuredListings, IMAGES, KIND_META } from "@/lib/web/listings";
import { HeroSearch } from "@/components/web/hero-search";
import { PropertyCard } from "@/components/web/property-card";
import { Reveal } from "@/components/web/reveal";
import { EnquireForm } from "@/components/web/enquire-form";

const INTENT_ART = {
  sale: IMAGES.villa,
  rent: IMAGES.living,
  offplan: IMAGES.creek,
} as const;

export function HomePage() {
  const featured = featuredListings().slice(0, 6);
  const lead = featured[0];
  const stack = featured.slice(1, 3);
  const row = featured.slice(3, 6);
  const ticker = [...COMMUNITIES, ...COMMUNITIES];

  return (
    <>
      <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-[#14110e]">
        <Image
          src={IMAGES.hero}
          alt="Aerial view of Palm Jumeirah, Dubai"
          fill
          preload
          sizes="100vw"
          className="ul-ken object-cover object-[center_45%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,17,14,0.42)_0%,rgba(20,17,14,0.12)_38%,rgba(20,17,14,0.78)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(20,17,14,0.28)_100%)]" />

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-12 pt-32 md:px-10 md:pb-16">
          <p className="ul-kicker text-[#b0893a]">Dubai · Palm Jumeirah</p>
          <h1 className="mt-6 max-w-4xl text-5xl leading-[0.95] text-[#f6f3ee] md:text-7xl lg:text-[5.75rem]">
            The city,
            <br />
            considered.
          </h1>
          <p className="mt-6 max-w-lg text-base font-light leading-relaxed text-[#f6f3ee]/80 md:text-lg">
            Villas, apartments, and off-plan residences placed with the care of a private office — not poured into a
            marketplace.
          </p>
          <div className="mt-10 max-w-3xl">
            <HeroSearch />
          </div>
          <dl className="mt-8 hidden gap-10 text-[#f6f3ee]/75 sm:flex">
            {[
              ["Coast to creek", "Palm · Downtown · Hills"],
              ["Private viewings", "Arranged within a day"],
              ["The house", "DIFC · Dubai"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[0.62rem] tracking-[0.22em] uppercase text-[#b0893a]">{k}</dt>
                <dd className="mt-1 text-sm font-light">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <a
          href="#residences"
          className="absolute bottom-8 right-6 z-10 hidden flex-col items-center gap-2 text-[#f6f3ee]/70 md:flex"
        >
          <span className="text-[0.6rem] tracking-[0.28em] uppercase">Scroll</span>
          <span className="ul-scroll-cue h-14 w-px bg-[#b0893a]" aria-hidden />
          <ArrowDown className="h-3.5 w-3.5 text-[#b0893a]" />
        </a>
      </section>

      <div className="overflow-hidden border-y border-[#e4d9c8] bg-[#14110e] py-4">
        <div className="ul-marquee-track flex w-max gap-10 whitespace-nowrap px-6 text-[0.7rem] tracking-[0.28em] uppercase text-[#f6f3ee]/55">
          {ticker.map((c, i) => (
            <span key={`${c.slug}-${i}`} className="flex items-center gap-10">
              {c.name}
              <span className="inline-block h-1.5 w-1.5 rotate-45 bg-[#b0893a]" aria-hidden />
            </span>
          ))}
        </div>
      </div>

      <section id="residences" className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
        <Reveal>
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="ul-kicker">Selected residences</p>
              <h2 className="mt-4 max-w-xl text-4xl md:text-5xl">Not everything is shown. These are.</h2>
            </div>
            <Link
              href="/buy"
              className="inline-flex items-center gap-2 text-[0.72rem] font-semibold tracking-[0.2em] uppercase text-[#14110e] hover:text-[#b0893a]"
            >
              All for sale <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-2 lg:grid-rows-2 lg:h-[42rem]">
          {lead && (
            <Reveal className="h-full min-h-[22rem] lg:row-span-2">
              <PropertyCard listing={lead} layout="fill" />
            </Reveal>
          )}
          {stack.map((listing, i) => (
            <Reveal key={listing.slug} className="h-full min-h-[16rem]" delay={i * 80}>
              <PropertyCard listing={listing} layout="fill" />
            </Reveal>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {row.map((listing, i) => (
            <Reveal key={listing.slug} delay={i * 70}>
              <PropertyCard listing={listing} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-[#14110e] py-20 text-[#f6f3ee] md:py-28">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <Reveal>
            <div className="mb-10 flex items-end justify-between gap-6">
              <div>
                <p className="ul-kicker">The map</p>
                <h2 className="mt-4 text-4xl md:text-5xl">Communities we keep returning to</h2>
              </div>
              <Link
                href="/communities"
                className="hidden text-[0.72rem] font-semibold tracking-[0.2em] uppercase text-[#b0893a] md:inline-flex"
              >
                All communities
              </Link>
            </div>
          </Reveal>
        </div>
        <div className="ul-hide-scroll flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:px-10">
          {COMMUNITIES.map((c) => (
            <Link
              key={c.slug}
              href={`/communities/${c.slug}`}
              className="group relative h-[28rem] w-[78vw] shrink-0 snap-start overflow-hidden sm:w-[22rem]"
            >
              <Image
                src={c.image}
                alt={c.name}
                fill
                sizes="360px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14110e] via-[#14110e]/20 to-transparent" />
              <div className="absolute inset-x-5 bottom-6">
                <p className="text-[0.65rem] tracking-[0.24em] uppercase text-[#b0893a]">{c.region}</p>
                <h3 className="mt-1 text-2xl">{c.name}</h3>
                <p className="mt-2 text-sm font-light text-[#f6f3ee]/70">{c.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-3">
        {(["sale", "rent", "offplan"] as const).map((kind) => {
          const meta = KIND_META[kind];
          return (
            <Link key={kind} href={meta.path} className="group relative min-h-[22rem] overflow-hidden md:min-h-[28rem]">
              <Image
                src={INTENT_ART[kind]}
                alt=""
                fill
                sizes="33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[#14110e]/55 transition-colors duration-500 group-hover:bg-[#14110e]/40" />
              <div className="relative z-10 flex h-full flex-col justify-end px-8 py-12">
                <p className="ul-kicker">{meta.eyebrow}</p>
                <h3 className="mt-3 text-3xl text-[#f6f3ee]">{meta.title}</h3>
                <p className="mt-3 max-w-xs text-sm font-light leading-relaxed text-[#f6f3ee]/70">{meta.lede}</p>
                <span className="mt-8 inline-flex items-center gap-2 text-[0.7rem] tracking-[0.2em] uppercase text-[#b0893a]">
                  Enter <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[28rem] overflow-hidden lg:min-h-[40rem]">
          <Image
            src={IMAGES.downtown}
            alt="Burj Khalifa, Downtown Dubai"
            fill
            sizes="50vw"
            className="object-cover transition-transform duration-[1200ms] hover:scale-105"
          />
        </div>
        <div className="flex flex-col justify-center bg-[#f6f3ee] px-8 py-20 md:px-16">
          <Reveal>
            <p className="ul-kicker">The house</p>
            <h2 className="mt-4 text-4xl md:text-5xl">Fewer introductions. Better ones.</h2>
            <p className="mt-6 max-w-md text-base font-light leading-relaxed text-[#8a8178]">
              UrbanLuxe is a private brokerage. We do not flood the city with boards. We match a small number of
              residences to clients who already know what they are looking for — or who trust us to find it before it
              is advertised.
            </p>
            <Link
              href="/about"
              className="mt-10 inline-flex h-12 items-center border border-[#14110e] px-6 text-[0.72rem] font-semibold tracking-[0.2em] uppercase text-[#14110e] transition-colors hover:bg-[#14110e] hover:text-[#f6f3ee]"
            >
              How we work
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
        <Reveal>
          <p className="ul-kicker">In their words</p>
          <h2 className="mt-4 mb-12 text-4xl md:text-5xl">Quietly recommended</h2>
        </Reveal>
        <div className="grid gap-10 md:grid-cols-3">
          {[
            {
              quote:
                "They never sent a catalogue. They sent three addresses, and one of them was the house.",
              name: "A. Al Hashimi",
              role: "Palm Jumeirah",
            },
            {
              quote:
                "The off-plan allocation arrived before the launch deck. That is the difference.",
              name: "J. Rahman",
              role: "Creek Harbour",
            },
            {
              quote: "Discreet, exact, and unhurried — which, in this market, is rare.",
              name: "M. Laurent",
              role: "Emirates Hills",
            },
          ].map((t, i) => (
            <Reveal key={t.name} delay={i * 90}>
              <blockquote className="border-t border-[#b0893a] pt-8">
                <p className="text-lg font-light leading-relaxed text-[#14110e]">“{t.quote}”</p>
                <footer className="mt-6 text-[0.7rem] tracking-[0.18em] uppercase text-[#8a8178]">
                  {t.name} · {t.role}
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-[#e4d9c8] bg-[#14110e]">
        <Image
          src={IMAGES.downtown}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div className="relative mx-auto grid max-w-[1440px] lg:grid-cols-2">
          <div className="px-5 py-20 md:px-10 md:py-24">
            <p className="ul-kicker">Begin</p>
            <h2 className="mt-4 text-4xl text-[#f6f3ee] md:text-5xl">Tell us the brief.</h2>
            <p className="mt-5 max-w-md text-base font-light text-[#f6f3ee]/65">
              A community, a view, a number. We will come back with residences — not a newsletter.
            </p>
          </div>
          <div className="px-5 pb-20 md:px-10 md:py-24">
            <div className="border border-[#f6f3ee]/15 bg-[#f6f3ee] p-6 md:p-8">
              <EnquireForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
