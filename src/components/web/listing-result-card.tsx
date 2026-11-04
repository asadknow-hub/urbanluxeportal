import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, Camera, MapPin, Maximize2, Phone } from "lucide-react";
import { type Listing } from "@/lib/web/listings";
import { useBrand, useWaLink } from "@/components/brand/brand-provider";
import { useCurrency } from "@/components/web/currency-provider";
import { usePublicAgents } from "@/components/web/public-agents-provider";

const FALLBACK_AGENTS = [
  {
    name: "Urban Luxe Advisor",
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80",
  },
] as const;

function agentFor(
  listing: Listing,
  team: { name: string; photo: string | null }[]
) {
  const pool =
    team.length > 0
      ? team.map((a) => ({ name: a.name, photo: a.photo || FALLBACK_AGENTS[0].photo }))
      : [...FALLBACK_AGENTS];
  let hash = 0;
  for (let i = 0; i < listing.slug.length; i++) hash = (hash + listing.slug.charCodeAt(i)) % pool.length;
  return pool[hash]!;
}

function headlineFor(listing: Listing) {
  const bedLabel =
    listing.beds === 0 ? "Studio" : `${listing.beds} Bedroom${listing.beds === 1 ? "" : "s"}`;
  const tags = [bedLabel, ...listing.amenities.slice(0, 2)];
  return tags.join(" · ");
}

function typeLabel(type: Listing["type"]) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12.04 2C6.58 2 2.15 6.37 2.15 11.76c0 1.92.57 3.72 1.56 5.24L2 22l5.18-1.66a10.1 10.1 0 0 0 4.86 1.24h.01c5.46 0 9.89-4.37 9.89-9.76C21.94 6.37 17.5 2 12.04 2zm5.75 13.85c-.24.67-1.4 1.23-1.93 1.31-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.66-.61-2.92-1.26-4.82-4.2-4.97-4.39-.14-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.45.27-.29.59-.36.79-.36h.57c.18 0 .43-.07.67.51.24.6.82 2.07.89 2.22.07.15.12.32.02.51-.1.2-.15.32-.3.49-.14.17-.3.38-.43.51-.14.14-.29.29-.12.56.16.27.73 1.2 1.56 1.94 1.08.96 1.98 1.26 2.26 1.4.27.14.43.12.59-.07.16-.2.68-.79.86-1.06.18-.27.36-.22.61-.13.24.09 1.55.73 1.82.86.27.14.45.2.51.31.07.11.07.64-.17 1.31z" />
    </svg>
  );
}

export function ListingResultCard({ listing }: { listing: Listing }) {
  const brand = useBrand();
  const team = usePublicAgents();
  const { format } = useCurrency();
  const agent = agentFor(listing, team);
  const gallery = [listing.image, ...listing.gallery.filter((g) => g !== listing.image)].slice(0, 4);
  while (gallery.length < 4) gallery.push(gallery[gallery.length - 1] ?? listing.image);
  const [main, ...thumbs] = gallery;
  const photoCount = Math.max(listing.gallery.length, 4);
  const price = format(listing.priceAed, {
    kind: listing.kind === "rent" ? "rent" : listing.kind,
  });
  const wa = useWaLink(
    `Hi ${brand.name}, I'm interested in ${listing.title} (${listing.ref}) in ${listing.community}.`
  );

  return (
    <article className="border border-[var(--ul-hair)] bg-white">
      <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Link
          href={`/properties/${listing.slug}`}
          prefetch
          className="relative block min-h-[14rem] sm:min-h-[16rem] md:min-h-full"
        >
          <div className="absolute inset-0 grid grid-cols-1 gap-px bg-[var(--ul-hair)] sm:grid-cols-[1fr_5.5rem] md:grid-cols-[1fr_6.25rem]">
            <div className="relative bg-[var(--ul-paper)]">
              <Image
                src={main!}
                alt={listing.title}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
              />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 bg-black/55 px-2 py-1 text-[0.7rem] font-medium text-white">
                <Camera className="h-3.5 w-3.5" strokeWidth={2} />
                {photoCount}
              </span>
            </div>
            <div className="hidden grid-rows-3 gap-px sm:grid">
              {thumbs.slice(0, 3).map((src, i) => (
                <div key={`${listing.slug}-t${i}`} className="relative bg-[var(--ul-paper)]">
                  <Image src={src} alt="" fill sizes="100px" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </Link>

        <div className="flex flex-col px-4 py-5 sm:px-6 sm:py-6">
          <Link href={`/properties/${listing.slug}`} prefetch className="group flex-1">
            <p className="text-xl font-bold tracking-tight text-[var(--ul-primary)] sm:text-2xl">
              {price}
            </p>
            <h2 className="mt-2 text-sm font-bold leading-snug text-[var(--ul-primary)] transition-colors group-hover:text-[var(--ul-secondary)] sm:text-base">
              {headlineFor(listing)}
            </h2>
            <p className="mt-3 flex items-start gap-1.5 text-sm leading-relaxed text-[var(--ul-muted)]">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span>
                {listing.title}, {listing.community}.
              </span>
            </p>
            <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--ul-primary)]/75">
              <span className="font-medium">{typeLabel(listing.type)}</span>
              <span className="text-[var(--ul-hair)]" aria-hidden>
                |
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BedDouble className="h-3.5 w-3.5 text-[var(--ul-muted)]" />
                {listing.beds}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bath className="h-3.5 w-3.5 text-[var(--ul-muted)]" />
                {listing.baths}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Maximize2 className="h-3.5 w-3.5 text-[var(--ul-muted)]" />
                {listing.sqft.toLocaleString()} sq.ft
              </span>
            </div>
          </Link>

          <div className="mt-5 flex flex-col gap-3 border-t border-[var(--ul-hair)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden bg-[var(--ul-paper)]">
                <Image src={agent.photo} alt="" fill sizes="36px" className="object-cover" />
              </div>
              <p className="text-sm font-semibold text-[var(--ul-primary)]">{agent.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <a
                href={`tel:${brand.phoneTel}`}
                className="inline-flex h-10 items-center justify-center gap-1.5 border border-[var(--ul-hair)] px-3.5 text-sm font-semibold text-[var(--ul-primary)] transition-colors hover:border-[var(--ul-primary)]"
              >
                <Phone className="h-3.5 w-3.5" strokeWidth={2.25} />
                Call
              </a>
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-1.5 border border-[#25D366]/35 px-3.5 text-sm font-semibold text-[var(--ul-primary)] transition-colors hover:border-[#25D366]"
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
