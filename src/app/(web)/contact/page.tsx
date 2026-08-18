import type { Metadata } from "next";
import { SITE } from "@/lib/web/site";
import { EnquireForm } from "@/components/web/enquire-form";
import { PageIntro } from "@/components/web/page-intro";

export const metadata: Metadata = {
  title: "Contact",
  description: "Enquire with UrbanLuxe — DIFC, Dubai.",
};

export default function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Write, call, or walk in."
        lede="Enquiries are read by people, not a queue. If you already have a reference, put it in the message."
      />
      <section className="mx-auto grid max-w-[1440px] gap-12 px-5 py-16 md:px-10 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl">The office</h2>
          <p className="mt-5 max-w-sm text-base font-light leading-relaxed text-[#8a8178]">{SITE.address}</p>
          <dl className="mt-10 space-y-5">
            <div>
              <dt className="ul-kicker">Telephone</dt>
              <dd className="mt-2">
                <a href={`tel:${SITE.phoneTel}`} className="text-lg hover:text-[#b0893a]">
                  {SITE.phoneDisplay}
                </a>
              </dd>
            </div>
            <div>
              <dt className="ul-kicker">Email</dt>
              <dd className="mt-2">
                <a href={`mailto:${SITE.email}`} className="text-lg hover:text-[#b0893a]">
                  {SITE.email}
                </a>
              </dd>
            </div>
          </dl>
        </div>
        <div className="border border-[#e4d9c8] bg-[#fffcf8] p-6 md:p-10">
          <h2 className="mb-6 text-2xl">Enquiry</h2>
          <EnquireForm />
        </div>
      </section>
    </>
  );
}
