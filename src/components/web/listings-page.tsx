import { Suspense } from "react";
import { listingsFor, type ListingKind } from "@/lib/web/listings";
import { ListingsExplorer } from "@/components/web/listings-explorer";

export function ListingsPage({ kind }: { kind: ListingKind }) {
  const listings =
    kind === "sale" ? [...listingsFor("sale"), ...listingsFor("offplan")] : listingsFor(kind);

  return (
    <section className="min-h-[70vh] bg-[var(--ul-primary)] py-6 md:py-8">
      <div className="ul-shell">
        <div className="ul-panel-light overflow-hidden p-4 sm:p-5 md:p-6">
          <Suspense
            fallback={
              <div className="space-y-4">
                <div className="h-14 animate-pulse rounded-lg bg-[#e2e8f0]" />
                <div className="h-10 animate-pulse rounded-md bg-[#e2e8f0]" />
                <div className="h-64 animate-pulse rounded-lg bg-[#e2e8f0]" />
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
