import { Suspense } from "react";
import { listingsFor, type ListingKind } from "@/lib/web/listings";
import { ListingsExplorer } from "@/components/web/listings-explorer";

export function ListingsPage({ kind }: { kind: ListingKind }) {
  const listings =
    kind === "sale" ? [...listingsFor("sale"), ...listingsFor("offplan")] : listingsFor(kind);

  return (
    <section className="ul-band-light min-h-[60vh] py-6 md:py-8">
      <div className="ul-shell-wide">
        <div className="overflow-hidden rounded-[1.5rem] border border-[var(--ul-hair)] bg-white p-4 shadow-[0_12px_40px_rgba(7,17,31,0.06)] sm:p-5 md:p-6">
          <Suspense
            fallback={
              <div className="space-y-4">
                <div className="h-14 animate-pulse rounded-lg bg-[#e5e7eb]" />
                <div className="h-10 animate-pulse rounded-md bg-[#e5e7eb]" />
                <div className="h-64 animate-pulse rounded-lg bg-[#e5e7eb]" />
              </div>
            }
          >
            <ListingsExplorer listings={listings} kind={kind} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
