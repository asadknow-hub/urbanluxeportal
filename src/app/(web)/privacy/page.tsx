import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/web/page-intro";
import { getPublicBrand } from "@/server/company-settings";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Urban Luxe collects, uses, and protects personal information.",
};

export default async function PrivacyPage() {
  const brand = await getPublicBrand();

  return (
    <>
      <PageIntro
        eyebrow="Legal"
        title="Privacy Policy"
        lede="How we handle personal data submitted through our website, WhatsApp, and office."
      />
      <article className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-[0.9375rem] leading-relaxed text-[#0B1D3D]/80 sm:px-5 sm:py-16 md:px-10">
        <p>
          {brand.name} (&quot;we&quot;, &quot;us&quot;) is a Dubai real estate brokerage. This notice
          explains what we collect when you enquire, list a property, apply for a role, or subscribe
          to updates.
        </p>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0B1D3D]">What we collect</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Identity and contact details (name, email, phone / WhatsApp).</li>
            <li>Enquiry context (interest, property reference, preferred areas, messages).</li>
            <li>Seller / landlord briefs and valuation requests.</li>
            <li>Career applications, including optional CV uploads and portfolio links.</li>
            <li>Technical data such as cookie preferences and basic analytics events.</li>
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0B1D3D]">How we use it</h2>
          <p>
            We use your information to respond to enquiries, arrange viewings, instruct sales or
            lettings, process applications, and improve our services. We do not sell personal data.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0B1D3D]">Sharing</h2>
          <p>
            Data may be shared with assigned advisors inside {brand.name}, with service providers
            who host our CRM and email, and with regulators when required by UAE law (including RERA
            processes). Property counterparties only receive what is needed to progress a transaction.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0B1D3D]">Retention</h2>
          <p>
            We keep enquiry and transaction records for as long as needed for legal, accounting, and
            client-service purposes, then delete or anonymise them where practicable.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0B1D3D]">Your choices</h2>
          <p>
            You may request access, correction, or deletion of personal data we hold, subject to
            legal retention duties. Contact{" "}
            <a className="font-medium text-[#1E7A4A] hover:underline" href={`mailto:${brand.email}`}>
              {brand.email}
            </a>{" "}
            or call {brand.phoneDisplay}.
          </p>
        </section>
        <p className="text-sm text-[#0B1D3D]/55">
          Related: <Link href="/terms" className="underline-offset-2 hover:underline">Terms of use</Link>
          . Office: {brand.address}. {brand.rera}.
        </p>
      </article>
    </>
  );
}
