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
    <ul className="flex items-center gap-8 pr-8 sm:gap-12 sm:pr-12">
      {DEVELOPERS.map((dev) => (
        <li key={dev.name} className="flex h-9 shrink-0 items-center justify-center sm:h-10">
          <Image
            src={dev.src}
            alt={`${dev.name} logo`}
            width={120}
            height={36}
            unoptimized
            className="h-6 w-auto max-w-[5.5rem] object-contain object-center opacity-70 sm:h-7 sm:max-w-[6.5rem]"
          />
        </li>
      ))}
    </ul>
  );
}

export function DevelopersMarquee() {
  return (
    <section className="ul-band-light overflow-hidden border-t border-[var(--ul-hair)] py-7 md:py-9">
      <div className="ul-shell-wide">
        <p className="ul-kicker">Partners</p>
        <h2 className="ul-section-heading mt-1.5 text-2xl md:text-3xl">Developers we know well</h2>
      </div>

      <div className="relative mt-5 border-y border-[var(--ul-hair)] py-4">
        <div className="ul-marquee-track">
          <LogoRow />
          <LogoRow />
        </div>
      </div>
    </section>
  );
}
