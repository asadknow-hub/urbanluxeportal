import { Suspense } from "react";
import { KIND_META, listingsFor, type ListingKind } from "@/lib/web/listings";
import { ListingsExplorer } from "@/components/web/listings-explorer";
import { PageIntro } from "@/components/web/page-intro";

export function ListingsPage({ kind }: { kind: ListingKind }) {
  const meta = KIND_META[kind];
  const listings = listingsFor(kind);

  return (
    <>
      <PageIntro eyebrow={meta.eyebrow} title={meta.title} lede={meta.lede} />
      <section className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
        <Suspense fallback={<p className="text-[#8a8178]">Loading residences…</p>}>
          <ListingsExplorer listings={listings} kind={kind} />
        </Suspense>
      </section>
    </>
  );
}
