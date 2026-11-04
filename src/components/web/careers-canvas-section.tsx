import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/web/reveal";
import { cn } from "@/lib/utils";

/** Editorial / documentary frames — avoid staged “team laughing at laptop” stock. */
const PETALS = [
  {
    src: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80",
    alt: "House keys handed at closing",
    className: "md:col-start-1 md:row-start-1 md:rotate-[-3deg]",
  },
  {
    src: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80",
    alt: "Floor plans spread across a worktable",
    className: "md:col-start-2 md:row-start-1 md:translate-y-2 md:rotate-[2deg]",
  },
  {
    src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1100&q=80",
    alt: "Glass tower facade in Dubai light",
    className: "md:col-start-3 md:col-span-2 md:row-start-1 md:rotate-[1deg]",
  },
  {
    src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
    alt: "Advisor reviewing figures at a desk",
    className: "md:col-start-1 md:row-start-2 md:-rotate-[2deg]",
  },
  {
    src: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80",
    alt: "Handshake after a closed deal",
    className: "md:col-start-4 md:row-start-2 md:rotate-[3deg]",
  },
  {
    src: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
    alt: "Quiet modern workspace",
    className: "md:col-start-1 md:col-span-2 md:row-start-3 md:rotate-[1.5deg]",
  },
  {
    src: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=900&q=80",
    alt: "Focused conversation over a brief",
    className: "md:col-start-3 md:row-start-3 md:-translate-y-1 md:-rotate-[2deg]",
  },
  {
    src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
    alt: "Residence interior prepared for a viewing",
    className: "md:col-start-4 md:row-start-3 md:rotate-[2.5deg]",
  },
] as const;

function Petal({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-[0_18px_40px_rgba(0,0,0,0.35)] md:aspect-auto md:min-h-[9.5rem] lg:min-h-[11rem]",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover opacity-90 saturate-[0.88] transition-transform duration-500 motion-safe:hover:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--ul-primary)]/35 via-transparent to-transparent" />
    </div>
  );
}

export function CareersCanvasSection() {
  return (
    <section className="ul-band-dark overflow-hidden py-10 md:py-14 lg:py-16">
      <div className="ul-shell-wide">
        <Reveal>
          <div className="relative grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:grid-rows-3 md:gap-4 lg:gap-5">
            {PETALS.map((petal) => (
              <Petal key={petal.src} {...petal} />
            ))}

            {/* Flower center — sits over the middle of the canvas on desktop */}
            <div className="col-span-2 flex flex-col items-center justify-center px-4 py-8 text-center sm:px-6 md:absolute md:inset-0 md:z-10 md:pointer-events-none md:py-0">
              <div className="pointer-events-auto max-w-md rounded-2xl border border-white/10 bg-[var(--ul-primary)]/80 px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-md sm:px-8 sm:py-10">
                <p className="ul-kicker">Careers</p>
                <h2 className="ul-section-heading mt-3 text-[clamp(1.65rem,3.6vw,2.75rem)] text-white">
                  Join the desk
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-[#8ba0b8] sm:text-base">
                  Craft-led hiring for advisors who prepare briefs, walk sites, and close with
                  clarity. See open roles and how we work.
                </p>
                <Link href="/careers" prefetch className="ul-btn-primary mt-7 rounded-full">
                  View careers
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
