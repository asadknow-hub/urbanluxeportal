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
    <article className="bg-[#f6f3ee] pt-24 pb-20">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <nav className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8rem] text-[#8a8178]" aria-label="Breadcrumb">
          <Link href={kindMeta.path} className="hover:text-[#2dd4bf]">
            Back to search
          </Link>
          <span className="text-[#e4d9c8]">|</span>
          <Link href="/" className="hover:text-[#2dd4bf]">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={kindMeta.path} className="hover:text-[#2dd4bf]">
            {kindLabel}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/communities/${listing.communitySlug}`} className="hover:text-[#2dd4bf]">
            {listing.community}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#14110e]">
            {listing.beds} Bedroom · {listing.type}
          </span>
        </nav>

        <PropertyGallery listing={listing} />

        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="ul-kicker">{listing.community}</p>
            <h1 className="mt-3 text-3xl md:text-5xl">{listing.title}</h1>
            <p className="mt-3 text-lg font-light text-[#8a8178]">{listing.subtitle}</p>
            <p className="mt-5 text-2xl text-[#14110e]">{formatAed(listing.priceAed, listing.kind)}</p>
            <p className="mt-1 text-[0.7rem] tracking-[0.16em] uppercase text-[#8a8178]">Ref {listing.ref}</p>

            <dl className="mt-8 grid grid-cols-3 gap-4 rounded-2xl border border-[#e4d9c8] bg-[#fffcf8] px-5 py-6">
              <div>
                <dt className="flex items-center gap-2 text-[0.65rem] tracking-[0.2em] uppercase text-[#8a8178]">
                  <BedDouble className="h-4 w-4" /> Beds
                </dt>
                <dd className="mt-1 text-xl">{listing.beds}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-[0.65rem] tracking-[0.2em] uppercase text-[#8a8178]">
                  <Bath className="h-4 w-4" /> Baths
                </dt>
                <dd className="mt-1 text-xl">{listing.baths}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-[0.65rem] tracking-[0.2em] uppercase text-[#8a8178]">
                  <Maximize2 className="h-4 w-4" /> Area
                </dt>
                <dd className="mt-1 text-xl">{listing.sqft.toLocaleString()} sq.ft</dd>
              </div>
            </dl>

            <p className="mt-10 max-w-2xl text-base font-light leading-relaxed text-[#14110e]/80">
              {listing.description}
            </p>

            {listing.handover && (
              <p className="mt-6 text-sm text-[#8a8178]">
                Handover <span className="text-[#14110e]">{listing.handover}</span>
                {listing.developer ? ` · ${listing.developer}` : ""}
              </p>
            )}

            <h2 className="mt-12 text-2xl">Specified</h2>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {listing.amenities.map((a) => (
                <li key={a} className="rounded-lg border border-[#e4d9c8] bg-[#fffcf8] px-4 py-3 text-sm font-light">
                  {a}
                </li>
              ))}
            </ul>

            <p className="mt-10 text-sm">
              <Link href={`/communities/${listing.communitySlug}`} className="text-[#2dd4bf] hover:underline">
                More in {listing.community}
              </Link>
            </p>
          </div>

          <aside className="lg:col-span-4">
            <div className="rounded-2xl border border-[#e4d9c8] bg-[#fffcf8] p-6 shadow-[0_12px_40px_rgba(20,17,14,0.06)] lg:sticky lg:top-24">
              <p className="ul-kicker">Private enquiry</p>
              <h2 className="mt-3 mb-6 text-2xl">Request this residence</h2>
              <EnquireForm propertyTitle={listing.title} compact />
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-16 border-t border-[#e4d9c8] pt-12">
            <h2 className="mb-8 text-3xl">Also considered</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {similar.map((item) => (
                <PropertyCard key={item.slug} listing={item} />
              ))}
            </div>
          </section>
        )}
      </div>

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
