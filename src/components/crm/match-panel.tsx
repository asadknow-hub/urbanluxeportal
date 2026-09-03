"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { propertyLabel } from "@/lib/inventory";
import { formatAED } from "@/lib/money";
import type { InventoryMatch } from "@/lib/match-inventory";
import { addDealProperty, addLeadProperty } from "@/server/inventory";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

export function MatchPanel({
  matches,
  leadId,
  dealId,
  canEdit,
}: {
  matches: InventoryMatch[];
  leadId?: string | null;
  dealId?: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const top = useMemo(() => matches.slice(0, 5), [matches]);
  if (top.length === 0) return null;

  function handleShortlist(propertyId: string) {
    if (!dealId && !leadId) {
      toast.message("Cannot shortlist without a lead or deal.");
      return;
    }
    setPendingId(propertyId);
    startTransition(async () => {
      const result = dealId
        ? await addDealProperty({ dealId, propertyId, role: "suggested" })
        : await addLeadProperty({
            leadId: leadId!,
            propertyId,
            role: "proposed",
            dealId: null,
          });
      setPendingId(null);
      if (result.ok) {
        toast.success(dealId ? "Added to shortlist" : "Added as proposed property");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not add");
      }
    });
  }

  return (
    <section className="rounded-[14px] border border-border bg-card px-[26px] py-6">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-[1.12rem]" style={{ fontFamily: "var(--font-display), serif" }}>
            <Sparkles className="h-4 w-4 text-primary" />
            Suggested units
          </h2>
          <p className="mt-0.5 text-[0.8rem] text-muted-foreground">
            Ranked from this person’s areas, beds, type, and budget.
            {dealId ? " Shortlist onto the deal." : " Connect as proposed property on this lead."}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {top.map((row) => (
          <div key={row.id} className="flex items-start justify-between gap-3 rounded-[12px] border border-border/70 px-3 py-2.5">
            <div className="min-w-0">
              <Link href={`/inventory/${row.id}`} className="text-sm font-medium hover:text-primary">
                {propertyLabel(row)}
              </Link>
              <p className="text-xs text-muted-foreground">
                {row.asking_price != null ? formatAED(row.asking_price) : "No ask"}
                {row.reasons.length ? ` · ${row.reasons.join(" · ")}` : ""}
              </p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, row.score)}%` }} />
              </div>
            </div>
            {canEdit && (dealId || leadId) ? (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                disabled={pending}
                onClick={() => handleShortlist(row.id)}
              >
                {pending && pendingId === row.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : dealId ? (
                  "Shortlist"
                ) : (
                  "Propose"
                )}
              </Button>
            ) : (
              <Link href={`/inventory/${row.id}`} className="shrink-0 text-xs text-muted-foreground hover:text-foreground">
                Open
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
