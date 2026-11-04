import { Suspense } from "react";
import { listingsFor, type ListingKind } from "@/lib/web/listings";
import { ListingsExplorer } from "@/components/web/listings-explorer";

export function ListingsPage({ kind }: { kind: ListingKind }) {
  const listings =
    kind === "sale" ? [...listingsFor("sale"), ...listingsFor("offplan")] : listingsFor(kind);

  const title = kind === "rent" ? "Rent in Dubai" : "Buy in Dubai";
  const lede =
    kind === "rent"
      ? "Annual lets in better buildings, filtered to your brief."
      : "Ready and off-plan residences, filtered to your brief.";

  return (
    <section className="ul-band-light min-h-[60vh] border-b border-[var(--ul-hair)] py-8 md:py-10">
      <div className="ul-shell-wide">
        <header className="mb-6 max-w-2xl md:mb-8">
          <p className="ul-kicker">{kind === "rent" ? "Rent" : "Buy"}</p>
          <h1 className="mt-2 text-[1.75rem] font-extrabold uppercase leading-[1.08] tracking-[-0.03em] text-[var(--ul-primary)] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ul-muted)] sm:text-[0.95rem]">{lede}</p>
        </header>

        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="h-11 animate-pulse bg-[var(--ul-hair)]" />
              <div className="h-10 animate-pulse bg-[var(--ul-hair)]" />
              <div className="h-48 animate-pulse bg-[var(--ul-hair)]" />
            </div>
          }
        >
          <ListingsExplorer listings={listings} kind={kind} />
        </Suspense>
      </div>
    </section>
  );
}
