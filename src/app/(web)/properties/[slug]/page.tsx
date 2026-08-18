import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bath, BedDouble, Maximize2 } from "lucide-react";
import {
  formatAed,
  listingBySlug,
  LISTINGS,
  similarListings,
} from "@/lib/web/listings";
import { EnquireForm } from "@/components/web/enquire-form";
import { PropertyCard } from "@/components/web/property-card";
import { PropertyGallery } from "@/components/web/property-gallery";

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
  const similar = similarListings(listing);

  return (
    <article className="pt-[4.5rem]">
      <PropertyGallery title={listing.title} images={listing.gallery} />

      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-12 md:px-10 lg:grid-cols-12 lg:py-16">
        <div className="lg:col-span-8">
          <p className="ul-kicker">{listing.community}</p>
          <h1 className="mt-4 text-4xl md:text-5xl">{listing.title}</h1>
          <p className="mt-3 text-lg font-light text-[#8a8178]">{listing.subtitle}</p>
          <p className="mt-6 text-2xl text-[#14110e]">{formatAed(listing.priceAed, listing.kind)}</p>
          <p className="mt-1 text-[0.7rem] tracking-[0.16em] uppercase text-[#8a8178]">Ref {listing.ref}</p>

          <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-[#e4d9c8] py-6">
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
            </p>
          )}

          <h2 className="mt-12 text-2xl">Specified</h2>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {listing.amenities.map((a) => (
              <li key={a} className="border-l border-[#b0893a] pl-4 text-sm font-light">
                {a}
              </li>
            ))}
          </ul>

          <p className="mt-10 text-sm">
            <Link href={`/communities/${listing.communitySlug}`} className="text-[#b0893a] hover:underline">
              More in {listing.community}
            </Link>
          </p>
        </div>

        <aside className="lg:col-span-4">
          <div className="border border-[#e4d9c8] bg-[#fffcf8] p-6 lg:sticky lg:top-24">
            <p className="ul-kicker">Private enquiry</p>
            <h2 className="mt-3 mb-6 text-2xl">Request this residence</h2>
            <EnquireForm propertyTitle={listing.title} compact />
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="border-t border-[#e4d9c8] px-5 py-16 md:px-10">
          <div className="mx-auto max-w-[1440px]">
            <h2 className="mb-8 text-3xl">Also considered</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {similar.map((item) => (
                <PropertyCard key={item.slug} listing={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
