import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicSharedProperty } from "@/server/public-property-share";
import { getPublicBrand } from "@/server/company-settings";
import { formatAED } from "@/lib/money";
import { formatPropertyType, LISTING_TYPES } from "@/lib/inventory";
import { waLinkFor } from "@/lib/company-brand";
import { EnquireForm } from "@/components/web/enquire-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const property = await getPublicSharedProperty(token);
  if (!property) return { title: "Property" };
  return {
    title: property.label,
    description: `${formatPropertyType(property.property_type)} in ${property.community ?? "Dubai"}`,
    robots: { index: false, follow: false },
  };
}

export default async function SharedPropertyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [property, brand] = await Promise.all([
    getPublicSharedProperty(token),
    getPublicBrand(),
  ]);
  if (!property) notFound();

  const category =
    LISTING_TYPES.find((row) => row.value === property.listing_type)?.label ??
    property.listing_type?.replace(/_/g, " ") ??
    "Property";
  const price = property.asking_price != null ? formatAED(property.asking_price) : null;
  const chatHref = waLinkFor(
    brand.whatsapp,
    `Hi ${brand.name}, I am interested in ${property.label}${price ? ` (${price})` : ""}.`
  );

  return (
    <article className="min-h-screen bg-[#f6f3ee] pb-16 pt-6">
      <div className="mx-auto max-w-[920px] px-4 sm:px-6">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#8a8178]">
          Shared by {brand.name}
        </p>
        <h1
          className="mt-2 font-heading text-[2rem] leading-tight text-[#14110e] sm:text-[2.4rem]"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          {property.label}
        </h1>
        <p className="mt-2 text-sm text-[#5c534c]">
          {category} · {formatPropertyType(property.property_type)}
          {property.bedrooms != null ? ` · ${property.bedrooms} bed` : ""}
          {price ? ` · ${price}` : ""}
        </p>

        {property.photos.length > 0 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {property.photos.slice(0, 6).map((photo, index) => (
              <div
                key={photo.url}
                className={`relative overflow-hidden rounded-[14px] bg-[#e8e0d4] ${index === 0 ? "sm:col-span-2 aspect-[16/9]" : "aspect-[4/3]"}`}
              >
                <Image
                  src={photo.url}
                  alt={photo.caption || property.label}
                  fill
                  className="object-cover"
                  sizes={index === 0 ? "920px" : "450px"}
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[14px] border border-dashed border-[#ddd2c2] bg-white/60 px-6 py-16 text-center text-sm text-[#8a8178]">
            Photos coming soon
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[14px] border border-[#e8dfd2] bg-white p-5">
            <h2 className="font-heading text-lg text-[#14110e]" style={{ fontFamily: "var(--font-display), serif" }}>
              Details
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Community" value={property.community} />
              <Row label="Building" value={property.building_name} />
              <Row label="Unit" value={property.unit_number} />
              <Row label="Beds / baths" value={`${property.bedrooms ?? "—"} / ${property.bathrooms ?? "—"}`} />
              <Row label="Floor" value={property.floor} />
              <Row label="BUA" value={property.bua_sqft ? `${property.bua_sqft} sqft` : null} />
              {property.listing_type === "rent" ? (
                <>
                  <Row label="Rent" value={price} />
                  <Row label="Frequency" value={property.rent_frequency} />
                  <Row label="Furnishing" value={property.furnishing} />
                </>
              ) : null}
              {property.listing_type === "off_plan" ? (
                <>
                  <Row label="Price" value={price} />
                  <Row label="Payment plan" value={property.payment_plan} />
                  <Row label="Handover" value={property.handover_date} />
                </>
              ) : null}
              {property.listing_type === "sale" ? <Row label="Asking price" value={price} /> : null}
            </dl>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[14px] border border-[#e8dfd2] bg-white p-5">
              <p className="text-sm text-[#5c534c]">Speak with {brand.name}</p>
              {price ? (
                <p className="mt-2 font-heading text-2xl text-[#14110e]" style={{ fontFamily: "var(--font-display), serif" }}>
                  {price}
                </p>
              ) : null}
              <a
                href={chatHref}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-[#25D366] text-sm font-semibold text-white hover:bg-[#1ebe5d]"
              >
                WhatsApp us
              </a>
              <a
                href={`tel:${brand.phoneTel}`}
                className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-[12px] border border-[#e8dfd2] text-sm font-semibold text-[#14110e] hover:bg-[#f6f3ee]"
              >
                Call {brand.phoneDisplay}
              </a>
            </div>
            <div className="rounded-[14px] border border-[#e8dfd2] bg-white p-5">
              <h2 className="mb-3 font-heading text-lg" style={{ fontFamily: "var(--font-display), serif" }}>
                Enquire
              </h2>
              <EnquireForm propertyTitle={property.label} />
            </div>
          </aside>
        </div>

        <p className="mt-8 text-center text-xs text-[#8a8178]">
          <Link href="/" className="underline hover:text-[#14110e]">
            {brand.name}
          </Link>
          {" · "}This link was shared privately and is not listed on the public search.
        </p>
      </div>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#f0e8dc] py-1.5 last:border-0">
      <dt className="text-[#8a8178]">{label}</dt>
      <dd className="text-right font-medium capitalize text-[#14110e]">
        {value?.toString().trim() ? value : "—"}
      </dd>
    </div>
  );
}
