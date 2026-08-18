import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  COMMUNITIES,
  communityBySlug,
  listingsFor,
} from "@/lib/web/listings";
import { PropertyCard } from "@/components/web/property-card";

export function generateStaticParams() {
  return COMMUNITIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const community = communityBySlug(slug);
  if (!community) return { title: "Community" };
  return { title: community.name, description: community.blurb };
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const community = communityBySlug(slug);
  if (!community) notFound();
  const listings = listingsFor(undefined, community.slug);

  return (
    <article>
      <section className="relative flex min-h-[70vh] items-end overflow-hidden bg-[#14110e]">
        <Image src={community.image} alt={community.name} fill preload sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14110e] via-[#14110e]/30 to-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-16 pt-32 md:px-10">
          <p className="ul-kicker">{community.region}</p>
          <h1 className="mt-4 text-5xl text-[#f6f3ee] md:text-7xl">{community.name}</h1>
          <p className="mt-5 max-w-xl text-lg font-light text-[#f6f3ee]/75">{community.blurb}</p>
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10">
        <h2 className="mb-8 text-3xl">Residences here</h2>
        {listings.length === 0 ? (
          <p className="text-[#8a8178]">Nothing in the brochure yet. Enquire and we will look.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <PropertyCard key={listing.slug} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
