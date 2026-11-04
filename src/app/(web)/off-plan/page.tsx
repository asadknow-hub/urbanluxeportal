import type { Metadata } from "next";
import { Suspense } from "react";
import { listingsFor } from "@/lib/web/listings";
import { OffPlanExplorer } from "@/components/web/off-plan-explorer";

export const metadata: Metadata = {
  title: "Off-plan",
  description:
    "Forthcoming towers and lagoons in Dubai: payment plans, monthly estimates, and private allocations.",
};

export default function OffPlanPage() {
  const listings = listingsFor("offplan");

  return (
    <section className="ul-band-light min-h-[60vh] border-b border-[var(--ul-hair)] py-8 md:py-10">
      <div className="ul-shell-wide">
        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="h-11 animate-pulse bg-[var(--ul-hair)]" />
              <div className="h-48 animate-pulse bg-[var(--ul-hair)]" />
            </div>
          }
        >
          <OffPlanExplorer listings={listings} />
        </Suspense>
      </div>
    </section>
  );
}
