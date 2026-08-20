const DEVELOPERS = [
  "Emaar",
  "Sobha",
  "Damac",
  "Nakheel",
  "Meraas",
  "Dubai Properties",
  "Azizi",
  "Ellington",
  "Omniyat",
  "Select Group",
  "Aldar",
  "Binghatti",
] as const;

function DeveloperMark({ name }: { name: string }) {
  return (
    <span className="inline-flex shrink-0 items-center px-8 md:px-12">
      <span className="whitespace-nowrap text-lg font-semibold tracking-[0.08em] text-white/90 md:text-xl">
        {name.toUpperCase()}
      </span>
    </span>
  );
}

export function DevelopersMarquee() {
  const loop = [...DEVELOPERS, ...DEVELOPERS];

  return (
    <section className="overflow-hidden bg-[var(--ul-primary)] py-14 md:py-20">
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">
          Developers that work with us
        </h2>
      </div>

      <div className="relative mt-10">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[var(--ul-primary)] to-transparent md:w-24"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--ul-primary)] to-transparent md:w-24"
          aria-hidden
        />

        <div className="ul-marquee-track flex w-max items-center">
          {loop.map((name, i) => (
            <span key={`${name}-${i}`} className="flex items-center">
              <DeveloperMark name={name} />
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ul-secondary)]"
                aria-hidden
              />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
