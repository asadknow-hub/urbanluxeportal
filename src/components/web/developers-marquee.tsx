import Image from "next/image";

/** Real static logos only — /public/developers */
const DEVELOPERS = [
  { name: "Emaar", src: "/developers/emaar.png" },
  { name: "Sobha", src: "/developers/sobha.jpg" },
  { name: "Damac", src: "/developers/damac.svg" },
  { name: "Nakheel", src: "/developers/nakheel.svg" },
  { name: "Meraas", src: "/developers/meraas.png" },
  { name: "Azizi", src: "/developers/azizi.png" },
  { name: "Aldar", src: "/developers/aldar.png" },
  { name: "Binghatti", src: "/developers/binghatti.jpg" },
  { name: "Danube Properties", src: "/developers/danube.png" },
] as const;

function DeveloperLogo({ name, src }: { name: string; src: string }) {
  return (
    <span className="inline-flex h-16 w-52 shrink-0 items-center justify-center px-10 md:h-[4.5rem] md:w-64 md:px-14">
      <Image
        src={src}
        alt={`${name} logo`}
        width={160}
        height={52}
        unoptimized
        className="h-11 w-auto max-w-[150px] object-contain object-center md:h-12 md:max-w-[170px]"
      />
    </span>
  );
}

export function DevelopersMarquee() {
  // Two copies for seamless loop — wider set + large gaps so it doesn't feel repetitive
  const loop = [...DEVELOPERS, ...DEVELOPERS];

  return (
    <section className="overflow-hidden bg-[var(--ul-tertiary)] py-14 md:py-20">
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        <p className="ul-kicker">Partners</p>
        <h2 className="ul-section-heading mt-3 text-2xl md:text-3xl">
          Developers that work with us
        </h2>
      </div>

      <div className="relative mt-12">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[var(--ul-tertiary)] to-transparent md:w-36"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[var(--ul-tertiary)] to-transparent md:w-36"
          aria-hidden
        />

        <div className="ul-marquee-track ul-marquee-slow flex w-max items-center gap-10 md:gap-16">
          {loop.map((dev, i) => (
            <DeveloperLogo key={`${dev.name}-${i}`} name={dev.name} src={dev.src} />
          ))}
        </div>
      </div>
    </section>
  );
}
