import { Suspense } from "react";
import { listingsFor, type ListingKind } from "@/lib/web/listings";
import { ListingsExplorer } from "@/components/web/listings-explorer";

export function ListingsPage({ kind }: { kind: ListingKind }) {
  const listings =
    kind === "sale" ? [...listingsFor("sale"), ...listingsFor("offplan")] : listingsFor(kind);

  return (
    <section className="min-h-[70vh] bg-white">
      <div className="mx-auto max-w-[1440px] px-4 py-5 md:px-8 md:py-7 lg:px-10">
        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="h-14 animate-pulse rounded-lg bg-[#F2F2F2]" />
              <div className="h-10 animate-pulse rounded-md bg-[#F2F2F2]" />
              <div className="h-64 animate-pulse rounded-lg bg-[#F2F2F2]" />
            </div>
          }
        >
          <ListingsExplorer listings={listings} kind={kind} />
        </Suspense>
      </div>
    </section>
  );
}
