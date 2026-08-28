"use client";

import { formatAED } from "@/lib/money";
import { SectionCard } from "@/components/primitives/section-card";
import type { AgentPerformanceRow, SourceFunnelRow } from "@/server/reports";

export function ReportsView({
  sourceFunnel,
  agentPerformance,
}: {
  sourceFunnel: SourceFunnelRow[];
  agentPerformance: AgentPerformanceRow[];
}) {
  return (
    <div className="space-y-6">
      <SectionCard title="Lead source funnel">
        {sourceFunnel.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">No leads yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">Leads</th>
                  <th className="px-5 py-3 font-medium">Converted</th>
                  <th className="px-5 py-3 font-medium">Won</th>
                  <th className="px-5 py-3 font-medium">Conv %</th>
                  <th className="px-5 py-3 font-medium">Open pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sourceFunnel.map((row) => {
                  const convPct = row.leads > 0 ? Math.round((row.converted / row.leads) * 100) : 0;
                  return (
                    <tr key={row.source} className="hover:bg-muted/30">
                      <td className="px-5 py-3 font-medium capitalize text-foreground">{row.label}</td>
                      <td className="px-5 py-3 tabular-nums">{row.leads}</td>
                      <td className="px-5 py-3 tabular-nums">{row.converted}</td>
                      <td className="px-5 py-3 tabular-nums">{row.won}</td>
                      <td className="px-5 py-3 tabular-nums">{convPct}%</td>
                      <td className="px-5 py-3 tabular-nums">{formatAED(row.pipelineValue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Agent performance">
        {agentPerformance.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">No assigned activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Agent</th>
                  <th className="px-5 py-3 font-medium">Open leads</th>
                  <th className="px-5 py-3 font-medium">Converted</th>
                  <th className="px-5 py-3 font-medium">Open deals</th>
                  <th className="px-5 py-3 font-medium">Closed</th>
                  <th className="px-5 py-3 font-medium">Pipeline</th>
                  <th className="px-5 py-3 font-medium">Won value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agentPerformance.map((row) => (
                  <tr key={row.agentId} className="hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium text-foreground">{row.agentName}</td>
                    <td className="px-5 py-3 tabular-nums">{row.openLeads}</td>
                    <td className="px-5 py-3 tabular-nums">{row.convertedLeads}</td>
                    <td className="px-5 py-3 tabular-nums">{row.openDeals}</td>
                    <td className="px-5 py-3 tabular-nums">{row.closedDeals}</td>
                    <td className="px-5 py-3 tabular-nums">{formatAED(row.pipelineValue)}</td>
                    <td className="px-5 py-3 tabular-nums">{formatAED(row.wonValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
