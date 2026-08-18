import type { Metadata } from "next";
import { EnquireForm } from "@/components/web/enquire-form";
import { PageIntro } from "@/components/web/page-intro";

export const metadata: Metadata = {
  title: "Sell",
  description: "Instruct UrbanLuxe to sell or let a Dubai residence — privately.",
};

export default function SellPage() {
  return (
    <>
      <PageIntro
        eyebrow="Instruct us"
        title="Sell without a board on the street."
        lede="We can list, or we can place. Many of our sales never appear on the public portals. Tell us the address."
      />
      <section className="mx-auto grid max-w-[1440px] gap-12 px-5 py-16 md:px-10 lg:grid-cols-2">
        <div className="space-y-8 text-base font-light leading-relaxed text-[#8a8178]">
          <p>
            A valuation is a conversation about light, plot, and what sold last season — not a PDF generated from a
            postcode. If the residence is not ready for the market, we will say so.
          </p>
          <p>
            For landlords: we let to occupants who will treat the house as a house. Annual contracts, references, and
            a handover that is photographed.
          </p>
        </div>
        <div className="border border-[#e4d9c8] bg-[#fffcf8] p-6 md:p-10">
          <h2 className="mb-6 text-2xl">Request a conversation</h2>
          <EnquireForm />
        </div>
      </section>
    </>
  );
}
