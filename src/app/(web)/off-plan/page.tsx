import type { Metadata } from "next";
import { Suspense } from "react";
import { listingsFor } from "@/lib/web/listings";
import { OffPlanExplorer } from "@/components/web/off-plan-explorer";

export const metadata: Metadata = {
  title: "Off-plan",
  description: "Forthcoming towers and lagoons in Dubai — payment plans, monthly estimates, and private allocations.",
};

export default function OffPlanPage() {
  const listings = listingsFor("offplan");

  return (
    <div className="min-h-screen bg-[#f7f5f0] pb-16 pt-24">
      <Suspense fallback={<p className="px-8 text-[#8a8178]">Loading off-plan…</p>}>
        <OffPlanExplorer listings={listings} />
      </Suspense>
    </div>
  );
}
