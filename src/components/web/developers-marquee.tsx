import Image from "next/image";

/** Only developers with real static logo files in /public/developers */
const DEVELOPERS = [
  { name: "Emaar", src: "/developers/emaar.png" },
  { name: "Sobha", src: "/developers/sobha.jpg" },
  { name: "Damac", src: "/developers/damac.svg" },
  { name: "Nakheel", src: "/developers/nakheel.svg" },
  { name: "Meraas", src: "/developers/meraas.png" },
  { name: "Azizi", src: "/developers/azizi.png" },
  { name: "Aldar", src: "/developers/aldar.png" },
] as const;

function DeveloperLogo({ name, src }: { name: string; src: string }) {
  return (
    <span className="inline-flex h-14 w-36 shrink-0 items-center justify-center px-4 md:h-16 md:w-40">
      <Image
        src={src}
        alt={`${name} logo`}
        width={140}
        height={48}
        unoptimized
        className="h-10 w-auto max-w-[132px] object-contain object-center md:h-11 md:max-w-[148px]"
      />
    </span>
  );
}

export function DevelopersMarquee() {
  const loop = [...DEVELOPERS, ...DEVELOPERS, ...DEVELOPERS];

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

        <div className="ul-marquee-track flex w-max items-center gap-2">
          {loop.map((dev, i) => (
            <DeveloperLogo key={`${dev.name}-${i}`} name={dev.name} src={dev.src} />
          ))}
        </div>
      </div>
    </section>
  );
}
