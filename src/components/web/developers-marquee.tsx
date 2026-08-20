"use client";

import Image from "next/image";

const DEVELOPERS = [
  { name: "Emaar", src: "/developers/emaar.svg" },
  { name: "Sobha", src: "/developers/sobha.jpg" },
  { name: "Damac", src: "/developers/damac.svg" },
  { name: "Nakheel", src: "/developers/nakheel.svg" },
  { name: "Meraas", src: "/developers/meraas.svg" },
  { name: "Dubai Properties", src: "/developers/dubai-properties.svg" },
  { name: "Azizi", src: "/developers/azizi.svg" },
  { name: "Ellington", src: "/developers/ellington.svg" },
  { name: "Omniyat", src: "/developers/omniyat.svg" },
  { name: "Select Group", src: "/developers/select.svg" },
  { name: "Aldar", src: "/developers/aldar.svg" },
  { name: "Binghatti", src: "/developers/binghatti.svg" },
] as const;

function DeveloperLogo({ name, src }: { name: string; src: string }) {
  return (
    <span className="inline-flex h-16 w-44 shrink-0 items-center justify-center px-6 md:h-20 md:w-52 md:px-8">
      <Image
        src={src}
        alt={`${name} logo`}
        width={180}
        height={56}
        className="max-h-10 w-auto max-w-[160px] object-contain opacity-90 transition-opacity duration-300 hover:opacity-100 md:max-h-12 md:max-w-[180px]"
      />
    </span>
  );
}

export function DevelopersMarquee() {
  const loop = [...DEVELOPERS, ...DEVELOPERS];

  return (
    <section className="overflow-hidden bg-[var(--ul-tertiary)] py-14 md:py-20">
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        <p className="ul-kicker">Partners</p>
        <h2 className="ul-section-heading mt-3 text-2xl md:text-3xl">
          Developers that work with us
        </h2>
      </div>

      <div className="relative mt-10">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[var(--ul-tertiary)] to-transparent md:w-28"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--ul-tertiary)] to-transparent md:w-28"
          aria-hidden
        />

        <div className="ul-marquee-track flex w-max items-center">
          {loop.map((dev, i) => (
            <span key={`${dev.name}-${i}`} className="flex items-center">
              <DeveloperLogo name={dev.name} src={dev.src} />
              <span
                className="mx-1 h-1 w-1 shrink-0 rounded-full bg-[var(--ul-secondary)]/40"
                aria-hidden
              />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
