import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/web/listings";
import { EnquireForm } from "@/components/web/enquire-form";
import { PageIntro } from "@/components/web/page-intro";
import { Reveal } from "@/components/web/reveal";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the Urban Luxe team in Dubai — advisors, ops, and growth roles.",
};

export default function CareersPage() {
  return (
    <>
      <PageIntro
        eyebrow="Careers"
        title="See what you&apos;re missing out on."
        lede="We are always accepting applications. Dubai awaits — are you ready to take the leap?"
      />
      <section className="bg-[var(--ul-secondary)] px-5 py-16 md:px-10 md:py-24">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--ul-primary)]/20 md:aspect-[5/4]">
              <Image
                src={IMAGES.careers}
                alt="Urban Luxe team"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <p className="text-sm font-medium text-white/80">Interested in joining us?</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-white md:text-4xl">
              Build a career in Dubai real estate
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/85">
              Advisors, coordinators, and specialists who care about the brief as much as the close.
              Tell us what you do best.
            </p>
            <Link
              href="#apply"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-[var(--ul-primary)] px-8 text-sm font-semibold text-white transition-colors hover:bg-[color-mix(in_srgb,var(--ul-primary)_88%,black)]"
            >
              Apply now
            </Link>
          </Reveal>
        </div>
      </section>
      <section id="apply" className="mx-auto max-w-[720px] px-5 py-16 md:px-10 md:py-20">
        <Reveal>
          <h2 className="text-2xl font-semibold text-[#0B1D3D] md:text-3xl">Send your application</h2>
          <p className="mt-3 text-base text-[#0B1D3D]/70">
            Include the role you&apos;re after and a short note — we read every enquiry.
          </p>
          <div className="mt-8 border border-[#e5e7eb] bg-white p-6 md:p-10">
            <EnquireForm />
          </div>
        </Reveal>
      </section>
    </>
  );
}
