import Image from "next/image";

/** Real static logos only, files under /public/developers */
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

function LogoRow() {
  return (
    <ul className="flex items-center gap-10 pr-10 sm:gap-14 sm:pr-14">
      {DEVELOPERS.map((dev) => (
        <li key={dev.name} className="flex h-12 shrink-0 items-center justify-center sm:h-14">
          <Image
            src={dev.src}
            alt={`${dev.name} logo`}
            width={140}
            height={44}
            unoptimized
            className="h-8 w-auto max-w-[7rem] object-contain object-center opacity-75 sm:h-9 sm:max-w-[8rem]"
          />
        </li>
      ))}
    </ul>
  );
}

export function DevelopersMarquee() {
  return (
    <section className="ul-band-light overflow-hidden py-10 md:py-14">
      <div className="ul-shell-wide">
        <p className="ul-kicker">Partners</p>
        <h2 className="ul-section-heading mt-3 text-2xl md:text-3xl">Developers we know well</h2>
      </div>

      <div className="relative mt-8 border-y border-[var(--ul-hair)] py-6">
        <div className="ul-marquee-track" aria-hidden={false}>
          <LogoRow />
          <LogoRow />
        </div>
      </div>
    </section>
  );
}
