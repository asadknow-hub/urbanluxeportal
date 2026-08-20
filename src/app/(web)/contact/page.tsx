import type { Metadata } from "next";
import { EnquireForm } from "@/components/web/enquire-form";
import { PageIntro } from "@/components/web/page-intro";
import { getPublicBrand } from "@/server/company-settings";

export const metadata: Metadata = {
  title: "Contact",
  description: "Enquire with Urban Luxe — Dubai.",
};

export default async function ContactPage() {
  const brand = await getPublicBrand();

  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Write, call, or walk in."
        lede="Enquiries are read by people, not a queue. If you already have a reference, put it in the message."
      />
      <section className="mx-auto grid max-w-[1440px] gap-12 px-5 py-16 md:px-10 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl text-[#0B1D3D]">The office</h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-[#0B1D3D]/65">
            {brand.address}
          </p>
          <dl className="mt-10 space-y-5">
            <div>
              <dt className="ul-kicker">Telephone</dt>
              <dd className="mt-2">
                <a
                  href={`tel:${brand.phoneTel}`}
                  className="text-lg text-[#0B1D3D] hover:text-[#1E7A4A]"
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
                  className="text-lg text-[#0B1D3D] hover:text-[#1E7A4A]"
                >
                  {brand.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="ul-kicker">RERA</dt>
              <dd className="mt-2 text-lg text-[#0B1D3D]">{brand.rera}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-[#e5e7eb] bg-[#F2F2F2] p-6 md:p-10">
          <h2 className="mb-6 text-2xl font-semibold text-[#0B1D3D]">Enquiry</h2>
          <EnquireForm />
        </div>
      </section>
    </>
  );
}
