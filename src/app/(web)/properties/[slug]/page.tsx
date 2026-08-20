import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bath, BedDouble, ChevronRight, Maximize2 } from "lucide-react";
import {
  formatAed,
  KIND_META,
  listingBySlug,
  LISTINGS,
  similarListings,
} from "@/lib/web/listings";
import { EnquireForm } from "@/components/web/enquire-form";
import { PropertyCard } from "@/components/web/property-card";
import { PropertyGallery } from "@/components/web/property-gallery";
import { PropertyMobileBar } from "@/components/web/property-mobile-bar";
import { PriceText } from "@/components/web/price-text";
import { waLinkFor } from "@/lib/company-brand";
import { getPublicBrand } from "@/server/company-settings";

export function generateStaticParams() {
  return LISTINGS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = listingBySlug(slug);
  if (!listing) return { title: "Residence" };
  return {
    title: listing.title,
    description: listing.subtitle,
  };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = listingBySlug(slug);
  if (!listing) notFound();
  const brand = await getPublicBrand();
  const similar = similarListings(listing);
  const kindMeta = KIND_META[listing.kind];
  const chatHref = waLinkFor(
    brand.whatsapp,
    `Interested in ${listing.title} at ${formatAed(listing.priceAed, listing.kind)}?`
  );
  const kindLabel =
    listing.kind === "rent" ? "Property to rent in Dubai" : listing.kind === "offplan" ? "Off-plan in Dubai" : "Property for sale in Dubai";

  return (
    <article className="bg-[#f6f3ee] pb-8 pt-4 sm:pt-6 lg:pb-20 lg:pt-8">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-5 md:px-8">
        <nav className="ul-hide-scroll mb-4 flex items-center gap-x-2 overflow-x-auto whitespace-nowrap pb-1 text-[0.75rem] text-[#8a8178] sm:mb-5 sm:flex-wrap sm:gap-y-1 sm:overflow-visible sm:whitespace-normal sm:pb-0 sm:text-[0.8rem]" aria-label="Breadcrumb">
          <Link href={kindMeta.path} className="hover:text-[#2dd4bf]">
            Back to search
          </Link>
          <span className="text-[#e4d9c8]">|</span>
          <Link href="/" className="hover:text-[#2dd4bf]">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link href={kindMeta.path} className="hover:text-[#2dd4bf]">
            {kindLabel}
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link href={`/communities/${listing.communitySlug}`} className="hover:text-[#2dd4bf]">
            {listing.community}
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-[#14110e]">
            {listing.beds} Bedroom · {listing.type}
          </span>
        </nav>

        <PropertyGallery listing={listing} />

        <div className="mt-8 grid gap-8 sm:mt-10 sm:gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="ul-kicker">{listing.community}</p>
            <h1 className="mt-2 text-[1.65rem] leading-tight sm:mt-3 sm:text-3xl md:text-5xl">{listing.title}</h1>
            <p className="mt-2 text-base font-light text-[#8a8178] sm:mt-3 sm:text-lg">{listing.subtitle}</p>
            <p className="mt-4 text-xl text-[#14110e] sm:mt-5 sm:text-2xl">
              <PriceText amountAed={listing.priceAed} kind={listing.kind} />
            </p>
            <p className="mt-1 text-[0.7rem] tracking-[0.16em] uppercase text-[#8a8178]">Ref {listing.ref}</p>

            <dl className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-[#e4d9c8] bg-[#fffcf8] px-3 py-4 sm:mt-8 sm:gap-4 sm:px-5 sm:py-6">
              <div>
                <dt className="flex items-center gap-1.5 text-[0.6rem] tracking-[0.16em] uppercase text-[#8a8178] sm:gap-2 sm:text-[0.65rem] sm:tracking-[0.2em]">
                  <BedDouble className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Beds
                </dt>
                <dd className="mt-1 text-lg sm:text-xl">{listing.beds}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-[0.6rem] tracking-[0.16em] uppercase text-[#8a8178] sm:gap-2 sm:text-[0.65rem] sm:tracking-[0.2em]">
                  <Bath className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Baths
                </dt>
                <dd className="mt-1 text-lg sm:text-xl">{listing.baths}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-[0.6rem] tracking-[0.16em] uppercase text-[#8a8178] sm:gap-2 sm:text-[0.65rem] sm:tracking-[0.2em]">
                  <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Area
                </dt>
                <dd className="mt-1 text-base sm:text-xl">{listing.sqft.toLocaleString()} <span className="text-sm font-normal text-[#8a8178]">sq.ft</span></dd>
              </div>
            </dl>

            <p className="mt-8 max-w-2xl text-[0.9375rem] font-light leading-relaxed text-[#14110e]/80 sm:mt-10 sm:text-base">
              {listing.description}
            </p>

            {listing.handover && (
              <p className="mt-6 text-sm text-[#8a8178]">
                Handover <span className="text-[#14110e]">{listing.handover}</span>
                {listing.developer ? ` · ${listing.developer}` : ""}
              </p>
            )}

            <h2 className="mt-10 text-xl sm:mt-12 sm:text-2xl">Specified</h2>
            <ul className="mt-4 grid gap-2 sm:mt-5 sm:grid-cols-2">
              {listing.amenities.map((a) => (
                <li key={a} className="rounded-lg border border-[#e4d9c8] bg-[#fffcf8] px-4 py-3 text-sm font-light">
                  {a}
                </li>
              ))}
            </ul>

            <p className="mt-8 text-sm sm:mt-10">
              <Link href={`/communities/${listing.communitySlug}`} className="text-[#2dd4bf] hover:underline">
                More in {listing.community}
              </Link>
            </p>
          </div>

          <aside id="enquire" className="scroll-mt-24 lg:col-span-4">
            <div className="rounded-2xl border border-[#e4d9c8] bg-[#fffcf8] p-5 shadow-[0_12px_40px_rgba(20,17,14,0.06)] sm:p-6 lg:sticky lg:top-24">
              <p className="ul-kicker">Private enquiry</p>
              <h2 className="mt-3 mb-5 text-xl sm:mb-6 sm:text-2xl">Request this residence</h2>
              <EnquireForm propertyTitle={listing.title} compact />
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-12 border-t border-[#e4d9c8] pt-10 sm:mt-16 sm:pt-12">
            <h2 className="mb-6 text-2xl sm:mb-8 sm:text-3xl">Also considered</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {similar.map((item) => (
                <PropertyCard key={item.slug} listing={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      <PropertyMobileBar title={listing.title} community={listing.community} />

      <a
        href={chatHref}
        target="_blank"
        rel="noreferrer"
        className="pointer-events-none fixed bottom-24 right-5 z-40 hidden max-w-[16rem] rounded-2xl bg-white p-3 text-left text-xs leading-relaxed text-[#14110e] shadow-[0_12px_40px_rgba(20,17,14,0.18)] md:pointer-events-auto md:block"
      >
        Interested in this {listing.beds} bed in {listing.community}? Chat with our team — we can arrange a viewing.
      </a>
    </article>
  );
}
