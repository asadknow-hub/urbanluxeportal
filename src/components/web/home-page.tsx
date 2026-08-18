import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { COMMUNITIES, featuredListings, IMAGES, KIND_META } from "@/lib/web/listings";
import { HeroSearch } from "@/components/web/hero-search";
import { PropertyCard } from "@/components/web/property-card";
import { Reveal } from "@/components/web/reveal";
import { EnquireForm } from "@/components/web/enquire-form";

export function HomePage() {
  const featured = featuredListings();
  const lead = featured[0];
  const rest = featured.slice(1, 5);
  const ticker = [...COMMUNITIES, ...COMMUNITIES];

  return (
    <>
      <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-[#14110e]">
        <Image
          src={IMAGES.hero}
          alt="Dubai skyline at dusk"
          fill
          preload
          sizes="100vw"
          className="ul-ken object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,17,14,0.35)_0%,rgba(20,17,14,0.15)_35%,rgba(20,17,14,0.78)_100%)]" />
        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-10 pt-32 md:px-10 md:pb-16">
          <p className="ul-kicker text-[#b0893a]">Dubai · Private brokerage</p>
          <h1 className="mt-6 max-w-4xl text-5xl leading-[0.95] text-[#f6f3ee] md:text-7xl lg:text-[5.75rem]">
            The city,
            <br />
            considered.
          </h1>
          <p className="mt-6 max-w-lg text-base font-light leading-relaxed text-[#f6f3ee]/75 md:text-lg">
            Villas, apartments, and off-plan residences placed with the care of a private office — not poured into a
            marketplace.
          </p>
          <div className="mt-10 max-w-3xl">
            <HeroSearch />
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-[#e4d9c8] bg-[#f6f3ee] py-4">
        <div className="ul-marquee-track flex w-max gap-10 whitespace-nowrap px-6 text-[0.7rem] tracking-[0.28em] uppercase text-[#8a8178]">
          {ticker.map((c, i) => (
            <span key={`${c.slug}-${i}`} className="flex items-center gap-10">
              {c.name}
              <span className="inline-block h-1 w-1 rotate-45 bg-[#b0893a]" aria-hidden />
            </span>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
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
        <div className="grid gap-5 lg:grid-cols-12">
          {lead && (
            <Reveal className="lg:col-span-7">
              <PropertyCard listing={lead} featured />
            </Reveal>
          )}
          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            {rest.slice(0, 2).map((listing, i) => (
              <Reveal key={listing.slug} delay={i * 80}>
                <PropertyCard listing={listing} />
              </Reveal>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {rest.slice(2, 4).map((listing, i) => (
            <Reveal key={listing.slug} delay={i * 80}>
              <PropertyCard listing={listing} featured />
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

      <section className="mx-auto grid max-w-[1440px] gap-px bg-[#e4d9c8] px-5 py-20 md:grid-cols-3 md:px-10 md:py-0">
        {(["sale", "rent", "offplan"] as const).map((kind) => {
          const meta = KIND_META[kind];
          return (
            <Link
              key={kind}
              href={meta.path}
              className="group bg-[#f6f3ee] px-8 py-16 transition-colors hover:bg-[#14110e] md:py-24"
            >
              <p className="ul-kicker group-hover:text-[#b0893a]">{meta.eyebrow}</p>
              <h3 className="mt-4 text-3xl group-hover:text-[#f6f3ee]">{meta.title}</h3>
              <p className="mt-4 text-sm font-light leading-relaxed text-[#8a8178] group-hover:text-[#f6f3ee]/65">
                {meta.lede}
              </p>
              <span className="mt-8 inline-flex items-center gap-2 text-[0.7rem] tracking-[0.2em] uppercase text-[#b0893a]">
                Enter <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          );
        })}
      </section>

      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[28rem] lg:min-h-[40rem]">
          <Image src={IMAGES.about} alt="A quiet villa interior" fill sizes="50vw" className="object-cover" />
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

      <section className="border-t border-[#e4d9c8] bg-[#fffcf8]">
        <div className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
          <div className="px-5 py-20 md:px-10 md:py-24">
            <p className="ul-kicker">Begin</p>
            <h2 className="mt-4 text-4xl md:text-5xl">Tell us the brief.</h2>
            <p className="mt-5 max-w-md text-base font-light text-[#8a8178]">
              A community, a view, a number. We will come back with residences — not a newsletter.
            </p>
          </div>
          <div className="px-5 pb-20 md:px-10 md:py-24">
            <EnquireForm />
          </div>
        </div>
      </section>
    </>
  );
}
