"use client";

import { useState } from "react";
import {
  formatAssignmentLine,
  formatAssignmentReason,
  formatAuditWhen,
  formatEventKind,
  formatEventSummary,
  type LeadAssignmentRow,
  type LeadEventRow,
} from "@/lib/lead-audit";
import { History } from "lucide-react";

export function LeadAuditPanel({
  assignments,
  events,
}: {
  assignments: LeadAssignmentRow[];
  events: LeadEventRow[];
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleAssignments = showAll ? assignments : assignments.slice(0, 5);
  const visibleEvents = showAll ? events : events.slice(0, 8);
  const hasMore = assignments.length > 5 || events.length > 8;

  if (assignments.length === 0 && events.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[14px] border border-border bg-card px-[26px] py-6">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-[1.12rem]" style={{ fontFamily: "var(--font-display), serif" }}>
          Audit trail
        </h2>
      </div>

      {assignments.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Assignment history
          </p>
          <div className="space-y-2">
            {visibleAssignments.map((row) => (
              <div key={row.id} className="rounded-[10px] border border-border/80 px-3 py-2.5">
                <p className="text-sm font-medium text-foreground">{formatAssignmentLine(row)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{formatAssignmentReason(row.reason)}</p>
                <p className="mt-1 font-mono text-[0.68rem] text-muted-foreground">{formatAuditWhen(row.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div>
          <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            System events
          </p>
          <div className="relative pl-[18px] before:absolute before:top-1 before:bottom-1 before:left-[5px] before:w-px before:bg-border">
            {visibleEvents.map((event) => {
              const summary = formatEventSummary(event);
              return (
                <div key={event.id} className="relative pb-3 last:pb-0">
                  <div className="absolute top-1.5 -left-[18px] h-2 w-2 rounded-full border border-primary bg-card" />
                  <p className="text-sm font-medium text-foreground">{formatEventKind(event.kind)}</p>
                  {summary && <p className="mt-0.5 text-xs text-muted-foreground">{summary}</p>}
                  <p className="mt-1 text-[0.68rem] text-muted-foreground">
                    {event.actor?.full_name ?? "System"} · {formatAuditWhen(event.created_at)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          className="mt-4 h-9 w-full rounded-[10px] border border-dashed border-border text-xs font-semibold text-muted-foreground hover:border-muted-foreground hover:text-foreground"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? "Show less" : "View full audit trail"}
        </button>
      )}
    </section>
  );
}
