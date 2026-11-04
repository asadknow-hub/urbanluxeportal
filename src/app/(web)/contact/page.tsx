import type { Metadata } from "next";
import { EnquireForm } from "@/components/web/enquire-form";
import { PageIntro } from "@/components/web/page-intro";
import { getPublicBrand } from "@/server/company-settings";

export const metadata: Metadata = {
  title: "Contact",
  description: "Enquire with Urban Luxe in Dubai.",
};

export default async function ContactPage() {
  const brand = await getPublicBrand();

  return (
    <>
      <PageIntro
        layout="stack"
        eyebrow="Contact"
        title="Write, call, or walk in."
        lede="Every enquiry goes to a specialist on the desk. If you already have a reference, put it in the message."
      />
      <section className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 sm:gap-12 sm:px-5 sm:py-16 md:px-10 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl text-[#0A1630] sm:text-3xl">The office</h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-[#0A1630]/65">
            {brand.address}
          </p>
          <dl className="mt-10 space-y-5">
            <div>
              <dt className="ul-kicker">Telephone</dt>
              <dd className="mt-2">
                <a
                  href={`tel:${brand.phoneTel}`}
                  className="text-lg text-[#0A1630] hover:text-[#008040]"
                >
                  {brand.phoneDisplay}
                </a>
              </dd>
            </div>
            <div>
              <dt className="ul-kicker">Email</dt>
              <dd className="mt-2">
                <a
                  href={`mailto:${brand.email}`}
                  className="text-lg text-[#0A1630] hover:text-[#008040]"
                >
                  {brand.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="ul-kicker">RERA</dt>
              <dd className="mt-2 text-lg text-[#0A1630]">{brand.rera}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-[var(--ul-hair)] bg-[#F6F3EE] p-6 md:p-10">
          <h2 className="mb-6 text-2xl font-semibold text-[#0A1630]">Enquiry</h2>
          <EnquireForm />
        </div>
      </section>
    </>
  );
}
