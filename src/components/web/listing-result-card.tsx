import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, Camera, MapPin, Maximize2, Phone } from "lucide-react";
import { formatAedPlain, type Listing } from "@/lib/web/listings";
import { SITE, waLink } from "@/lib/web/site";
import { cn } from "@/lib/utils";

const AGENTS = [
  {
    name: "Michael Wilson",
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Sara Al Mazrouei",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "James Okonkwo",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Layla Hassan",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
  },
] as const;

function agentFor(listing: Listing) {
  let hash = 0;
  for (let i = 0; i < listing.slug.length; i++) hash = (hash + listing.slug.charCodeAt(i)) % AGENTS.length;
  return AGENTS[hash]!;
}

function headlineFor(listing: Listing) {
  const bedLabel =
    listing.beds === 0 ? "Studio" : `${listing.beds} Bedroom${listing.beds === 1 ? "" : "s"}`;
  const tags = [bedLabel, ...listing.amenities.slice(0, 2)];
  return tags.join(" | ");
}

function typeLabel(type: Listing["type"]) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-1.99.522.522-1.94-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 6.045L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-sm bg-[#0B1D3D]/85 text-[0.65rem] font-bold tracking-tight text-white",
        className
      )}
      aria-hidden
    >
      UL
    </span>
  );
}

export function ListingResultCard({ listing }: { listing: Listing }) {
  const agent = agentFor(listing);
  const gallery = [listing.image, ...listing.gallery.filter((g) => g !== listing.image)].slice(0, 4);
  while (gallery.length < 4) gallery.push(gallery[gallery.length - 1] ?? listing.image);
  const [main, ...thumbs] = gallery;
  const photoCount = Math.max(listing.gallery.length, 4);
  const price =
    listing.kind === "rent"
      ? `${formatAedPlain(listing.priceAed)} / year`
      : formatAedPlain(listing.priceAed);
  const wa = waLink(
    `Hi Urban Luxe — I'm interested in ${listing.title} (${listing.ref}) in ${listing.community}.`
  );

  return (
    <article className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_3px_rgba(11,29,61,0.04)] transition-shadow hover:shadow-[0_8px_28px_rgba(11,29,61,0.08)]">
      <div className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Link
          href={`/properties/${listing.slug}`}
          prefetch
          className="relative block min-h-[240px] sm:min-h-[280px] md:min-h-[300px]"
        >
          <div className="absolute inset-0 grid grid-cols-[1fr_6rem] gap-1.5 p-2 sm:grid-cols-[1fr_7rem] md:gap-2 md:p-2.5">
            <div className="relative overflow-hidden rounded-lg bg-[#F2F2F2]">
              <Image
                src={main!}
                alt={listing.title}
                fill
                sizes="(max-width: 768px) 70vw, 40vw"
                className="object-cover"
              />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-black/55 px-2.5 py-1 text-[0.7rem] font-medium text-white backdrop-blur-[2px]">
                <Camera className="h-3.5 w-3.5" strokeWidth={2} />
                {photoCount}
              </span>
              <BrandMark />
            </div>
            <div className="grid grid-rows-3 gap-1.5 md:gap-2">
              {thumbs.slice(0, 3).map((src, i) => (
                <div key={`${listing.slug}-t${i}`} className="relative overflow-hidden rounded-lg bg-[#F2F2F2]">
                  <Image src={src} alt="" fill sizes="112px" className="object-cover" />
                  {i === 2 ? <BrandMark className="h-6 w-6 text-[0.55rem]" /> : null}
                </div>
              ))}
            </div>
          </div>
        </Link>

        <div className="flex flex-col px-6 py-6 md:px-8 md:py-8">
          <Link href={`/properties/${listing.slug}`} prefetch className="group flex-1">
            <p className="text-2xl font-bold tracking-tight text-[#0B1D3D] md:text-[1.85rem]">
              {price}
            </p>
            <h2 className="mt-3 text-base font-bold leading-snug text-[#0B1D3D] transition-colors group-hover:text-[#1E7A4A] md:text-[1.0625rem]">
              {headlineFor(listing)}
            </h2>
            <p className="mt-3.5 flex items-start gap-1.5 text-sm leading-relaxed text-[#0B1D3D]/65">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0B1D3D]/45" strokeWidth={2} />
              <span>
                {listing.title}, {listing.community}.
              </span>
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#0B1D3D]/75">
              <span className="font-medium">{typeLabel(listing.type)}</span>
              <span className="text-[#0B1D3D]/25" aria-hidden>
                |
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BedDouble className="h-3.5 w-3.5 text-[#0B1D3D]/45" />
                {listing.beds}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bath className="h-3.5 w-3.5 text-[#0B1D3D]/45" />
                {listing.baths}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Maximize2 className="h-3.5 w-3.5 text-[#0B1D3D]/45" />
                {listing.sqft.toLocaleString()} sq.ft
              </span>
            </div>
          </Link>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#eee] pt-5">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-full bg-[#F2F2F2]">
                <Image src={agent.photo} alt="" fill sizes="44px" className="object-cover" />
              </div>
              <p className="text-sm font-semibold text-[#0B1D3D]">{agent.name}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <a
                href={`tel:${SITE.phoneTel}`}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#0B1D3D]/25 px-4 text-sm font-semibold text-[#0B1D3D] transition-colors hover:border-[#0B1D3D] hover:bg-[#F2F2F2]"
              >
                <Phone className="h-3.5 w-3.5" strokeWidth={2.25} />
                Call
              </a>
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#25D366]/40 px-4 text-sm font-semibold text-[#0B1D3D] transition-colors hover:border-[#25D366] hover:bg-[#25D366]/08"
              >
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
