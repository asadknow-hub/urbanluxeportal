import type { Metadata } from "next";
import { EnquireForm } from "@/components/web/enquire-form";
import { Reveal } from "@/components/web/reveal";
import { getPublicBrand } from "@/server/company-settings";

export const metadata: Metadata = {
  title: "Contact",
  description: "Enquire with Urban Luxe in Dubai.",
};

export default async function ContactPage() {
  const brand = await getPublicBrand();

  return (
    <section className="ul-band-light border-b border-[var(--ul-hair)]">
      <div className="ul-shell-wide py-8 md:py-10 lg:py-12">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          <Reveal className="min-w-0">
            <p className="ul-kicker">Contact</p>
            <h1 className="mt-3 max-w-xl text-[1.75rem] font-extrabold uppercase leading-[1.08] tracking-[-0.03em] text-[var(--ul-primary)] sm:text-4xl">
              Write, call, or walk in.
            </h1>
            <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-[var(--ul-muted)]">
              Every enquiry goes to a specialist on the desk. Add a reference in the note if you
              have one.
            </p>

            <dl className="mt-8 space-y-5 border-t border-[var(--ul-hair)] pt-7">
              <div>
                <dt className="ul-kicker">Telephone</dt>
                <dd className="mt-1.5">
                  <a
                    href={`tel:${brand.phoneTel}`}
                    className="text-base font-medium text-[var(--ul-primary)] hover:text-[var(--ul-secondary)]"
                  >
                    {brand.phoneDisplay}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="ul-kicker">Email</dt>
                <dd className="mt-1.5">
                  <a
                    href={`mailto:${brand.email}`}
                    className="text-base font-medium text-[var(--ul-primary)] hover:text-[var(--ul-secondary)]"
                  >
                    {brand.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="ul-kicker">Office</dt>
                <dd className="mt-1.5 max-w-sm text-sm leading-relaxed text-[var(--ul-muted)]">
                  {brand.address}
                </dd>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={60} className="min-w-0 lg:sticky lg:top-24">
            <div className="border border-[var(--ul-hair)] bg-white p-5 sm:p-6">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[var(--ul-secondary)]">
                Enquiry
              </p>
              <h2 className="mt-2 text-xl font-bold text-[var(--ul-primary)]">Send a message</h2>
              <div className="mt-5">
                <EnquireForm />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
