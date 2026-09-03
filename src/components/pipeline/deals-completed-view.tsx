import Link from "next/link";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { dealStageLabel } from "@/lib/deal-stages";
import { optionLabel, type LeadFieldOption } from "@/lib/lead-field-options";
import { Briefcase, CheckCircle2, UserRound } from "lucide-react";

export type CompletedDealRow = {
  id: string;
  title: string;
  stage: string;
  value: number | null;
  property_title: string | null;
  buyer_name: string | null;
  stage_changed_at: string | null;
  updated_at: string;
  customer: { id: string; name: string } | null;
  assigned_to_profile: { id: string; full_name: string } | null;
  lead_id: string | null;
};

export type CompletedLeadRow = {
  id: string;
  name: string;
  phone: string | null;
  interest: string | null;
  source: string | null;
  status: string;
  updated_at: string;
  converted_deal_id: string | null;
  assigned_to_profile: { id: string; full_name: string } | null;
  stage: { id: string; name: string; kind: string } | null;
};

export function DealsCompletedView({
  deals,
  leads,
  fieldOptions,
}: {
  deals: CompletedDealRow[];
  leads: CompletedLeadRow[];
  fieldOptions: Record<string, LeadFieldOption[]>;
}) {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Closed deals and converted leads that finished the pipeline.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800">
            <Briefcase className="h-3.5 w-3.5" />
            {deals.length} closed deals
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-medium text-sky-800">
            <UserRound className="h-3.5 w-3.5" />
            {leads.length} converted leads
          </span>
        </div>
      </div>

      <section className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border bg-emerald-50/60 px-5 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          <h2 className="text-sm font-semibold text-foreground">Closed deals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium tracking-wide text-muted-foreground">
                <th className="px-5 py-2.5">Deal</th>
                <th className="px-5 py-2.5">Person</th>
                <th className="px-5 py-2.5">Property</th>
                <th className="px-5 py-2.5">Value</th>
                <th className="px-5 py-2.5">Agent</th>
                <th className="px-5 py-2.5">Closed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No closed deals yet.
                  </td>
                </tr>
              ) : (
                deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <Link href={`/pipeline/${deal.id}`} className="font-semibold text-foreground hover:text-primary hover:underline">
                        {deal.title}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{dealStageLabel(deal.stage)}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {deal.customer ? (
                        <Link href={`/customers/${deal.customer.id}`} className="hover:text-primary hover:underline">
                          {deal.customer.name}
                        </Link>
                      ) : (
                        deal.buyer_name ?? "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{deal.property_title ?? "—"}</td>
                    <td className="px-5 py-3 tabular-nums font-medium">{formatAED(deal.value)}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {deal.assigned_to_profile?.full_name ?? "Unassigned"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDate(deal.stage_changed_at ?? deal.updated_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border bg-sky-50/60 px-5 py-3">
          <UserRound className="h-4 w-4 text-sky-700" />
          <h2 className="text-sm font-semibold text-foreground">Converted leads</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium tracking-wide text-muted-foreground">
                <th className="px-5 py-2.5">Lead</th>
                <th className="px-5 py-2.5">Interest</th>
                <th className="px-5 py-2.5">Source</th>
                <th className="px-5 py-2.5">Stage</th>
                <th className="px-5 py-2.5">Agent</th>
                <th className="px-5 py-2.5">Converted</th>
                <th className="px-5 py-2.5">Deal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    No converted leads yet.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <Link href={`/leads/${lead.id}`} className="font-semibold text-foreground hover:text-primary hover:underline">
                        {lead.name}
                      </Link>
                      {lead.phone ? (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{lead.phone}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {optionLabel(fieldOptions.interest, lead.interest) || lead.interest || "—"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {optionLabel(fieldOptions.source, lead.source) || lead.source || "—"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{lead.stage?.name ?? "Converted"}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {lead.assigned_to_profile?.full_name ?? "Unassigned"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(lead.updated_at)}</td>
                    <td className="px-5 py-3">
                      {lead.converted_deal_id ? (
                        <Link
                          href={`/pipeline/${lead.converted_deal_id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Open deal
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
