import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/web/listings";
import { Reveal } from "@/components/web/reveal";

export function CareersCanvasSection() {
  return (
    <section className="ul-band-dark py-12 md:py-16 lg:py-20">
      <div className="ul-shell-wide">
        <Reveal>
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
            <div className="relative aspect-[4/5] overflow-hidden bg-[var(--ul-tertiary)] sm:aspect-[5/6] md:aspect-[4/5]">
              <Image
                src={IMAGES.interior}
                alt="UrbanLuxe workspace and residence context"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="max-w-md md:justify-self-start">
              <p className="ul-kicker">Careers</p>
              <h2 className="ul-section-heading mt-3 text-[clamp(1.85rem,3.8vw,3rem)] text-white">
                Join the desk
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#8ba0b8] sm:text-base">
                We hire advisors, coordinators, and specialists who prepare briefs, walk sites, and
                close with clarity.
              </p>
              <Link href="/careers" prefetch className="ul-btn-primary mt-8 rounded-full">
                View open roles
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
