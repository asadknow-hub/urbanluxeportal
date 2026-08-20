import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/web/page-intro";
import { getPublicBrand } from "@/server/company-settings";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms governing use of the Urban Luxe public website and enquiries.",
};

export default async function TermsPage() {
  const brand = await getPublicBrand();

  return (
    <>
      <PageIntro
        eyebrow="Legal"
        title="Terms of Use"
        lede="The rules for using this website and submitting enquiries to our brokerage."
      />
      <article className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-[0.9375rem] leading-relaxed text-[#0B1D3D]/80 sm:px-5 sm:py-16 md:px-10">
        <p>
          By using {brand.name}&apos;s website you agree to these terms. If you do not agree, please
          do not use the site.
        </p>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0B1D3D]">Information only</h2>
          <p>
            Listings, prices, payment plans, mortgage estimates, and market commentary are indicative
            and may change without notice. Nothing on this site is an offer, valuation certificate,
            or financial advice unless confirmed in writing by an authorised advisor.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0B1D3D]">Enquiries</h2>
          <p>
            Submitting a form creates a lead in our CRM so we can respond. You confirm the details
            you provide are accurate and that we may contact you by phone, email, or WhatsApp about
            your request.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0B1D3D]">Intellectual property</h2>
          <p>
            Site content, branding, and photography remain the property of {brand.name} or their
            respective owners. You may not copy or redistribute materials without permission.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0B1D3D]">Liability</h2>
          <p>
            To the fullest extent permitted by UAE law, we are not liable for losses arising from
            reliance on website content alone. Property transactions are governed by separate
            contracts and RERA requirements.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0B1D3D]">Governing law</h2>
          <p>
            These terms are governed by the laws of the United Arab Emirates as applicable in Dubai.
          </p>
        </section>
        <p className="text-sm text-[#0B1D3D]/55">
          See also our{" "}
          <Link href="/privacy" className="underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          . Contact{" "}
          <a className="font-medium text-[#1E7A4A] hover:underline" href={`mailto:${brand.email}`}>
            {brand.email}
          </a>
          .
        </p>
      </article>
    </>
  );
}
