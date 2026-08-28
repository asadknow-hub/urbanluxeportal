"use client";

import { useState } from "react";
import {
  formatAssignmentLine,
  formatAssignmentReason,
  formatAuditWhen,
  type LeadAssignmentRow,
} from "@/lib/lead-audit";
import { History } from "lucide-react";

export function LeadAssignmentHistory({ assignments }: { assignments: LeadAssignmentRow[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? assignments : assignments.slice(0, 5);

  if (assignments.length === 0) return null;

  return (
    <section className="rounded-[14px] border border-border bg-card px-[26px] py-6">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-[1.12rem]" style={{ fontFamily: "var(--font-display), serif" }}>
          Assignment history
        </h2>
      </div>
      <div className="space-y-2">
        {visible.map((row) => (
          <div key={row.id} className="rounded-[10px] border border-border/80 px-3 py-2.5">
            <p className="text-sm font-medium text-foreground">{formatAssignmentLine(row)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{formatAssignmentReason(row.reason)}</p>
            <p className="mt-1 font-mono text-[0.68rem] text-muted-foreground">{formatAuditWhen(row.created_at)}</p>
          </div>
        ))}
      </div>
      {assignments.length > 5 && (
        <button
          type="button"
          className="mt-4 h-9 w-full rounded-[10px] border border-dashed border-border text-xs font-semibold text-muted-foreground hover:border-muted-foreground hover:text-foreground"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? "Show less" : `View all ${assignments.length} assignments`}
        </button>
      )}
    </section>
  );
}
