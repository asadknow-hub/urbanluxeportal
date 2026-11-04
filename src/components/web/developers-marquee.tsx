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

export function DevelopersMarquee() {
  return (
    <section className="ul-band-light py-10 md:py-14">
      <div className="ul-shell-wide">
        <p className="ul-kicker">Developers</p>
        <h2 className="ul-section-heading mt-3 text-2xl md:text-3xl">Projects we know well</h2>

        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-[var(--ul-hair)] pt-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {DEVELOPERS.map((dev) => (
            <li key={dev.name} className="flex h-14 items-center justify-center sm:h-16">
              <Image
                src={dev.src}
                alt={`${dev.name} logo`}
                width={140}
                height={44}
                unoptimized
                className="h-9 w-auto max-w-[7.5rem] object-contain object-center opacity-80 sm:h-10 sm:max-w-[8.5rem]"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
