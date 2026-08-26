import Link from "next/link";
import {
  CUSTOMER_STATUSES,
  DEAL_PIPELINE_STAGES,
  FIELD_MAPPINGS,
  FLOW_STAGES,
} from "@/lib/lead-flow";
import { ArrowRight, GitBranch, UserRound, Briefcase, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

const MAPPING_BADGE: Record<string, string> = {
  copy: "bg-primary/15 text-primary",
  link: "bg-muted text-foreground",
  snapshot: "bg-secondary/80 text-secondary-foreground",
  "—": "bg-muted/50 text-muted-foreground",
};

function MappingBadge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        MAPPING_BADGE[value] ?? MAPPING_BADGE["—"]
      )}
    >
      {value}
    </span>
  );
}

const FLOW_ICONS = {
  lead: UserRound,
  deal: Briefcase,
  customer: CircleDot,
} as const;

export function LeadFlowSettings() {
  return (
    <div className="space-y-5">
      {/* Lifecycle diagram */}
      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="h-0.5 bg-primary" />
        <div className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <GitBranch className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">Lead flow</h2>
              <p className="text-sm text-muted-foreground">
                Qualify a lead, convert to a deal. The person record exists from first contact and becomes Active when the deal closes.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
            {FLOW_STAGES.map((stage, idx) => {
              const Icon = FLOW_ICONS[stage.key];
              return (
                <div key={stage.key} className="flex flex-1 items-center gap-3">
                  <Link
                    href={stage.href}
                    className="group flex flex-1 flex-col rounded-[12px] border border-border bg-muted/30 p-4 transition-colors hover:border-primary/40 hover:bg-muted/50"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-card text-primary shadow-sm">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Step {idx + 1}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground">{stage.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{stage.hint}</p>
                  </Link>
                  {idx < FLOW_STAGES.length - 1 && (
                    <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground lg:block" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[10px] border border-border bg-muted/40 p-4">
              <p className="text-xs font-medium text-muted-foreground">Convert trigger</p>
              <p className="mt-2 text-sm text-foreground">
                On a lead detail page, use <strong>Convert</strong> to open a pipeline deal with buyer details from the lead.
              </p>
            </div>
            <div className="rounded-[10px] border border-border bg-muted/40 p-4">
              <p className="text-xs font-medium text-muted-foreground">Finalize transaction</p>
              <p className="mt-2 text-sm text-foreground">
                On the deal, set the <strong>property</strong>, <strong>payment</strong>, and <strong>KYC</strong>.
                Marking the deal <strong>closed</strong> creates the customer, saves the property under them, and copies documents.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Deal stages */}
        <div className="overflow-hidden rounded-[14px] border border-border bg-card">
          <div className="h-0.5 bg-primary" />
          <div className="p-5">
            <h3 className="text-sm font-semibold text-foreground">Deal pipeline stages</h3>
            <p className="mt-1 text-xs text-muted-foreground">Each converted lead starts at New.</p>
            <ol className="mt-4 space-y-2">
              {DEAL_PIPELINE_STAGES.map((stage, i) => (
                <li
                  key={stage.key}
                  className="flex items-center gap-3 rounded-[10px] border border-border bg-muted/30 px-3 py-2 text-sm"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-card text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="font-medium capitalize text-foreground">{stage.label}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">{stage.key}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Customer statuses */}
        <div className="overflow-hidden rounded-[14px] border border-border bg-card">
          <div className="h-0.5 bg-primary" />
          <div className="p-5">
            <h3 className="text-sm font-semibold text-foreground">Customer statuses</h3>
            <p className="mt-1 text-xs text-muted-foreground">Separate from deal stage — tracks relationship health.</p>
            <ul className="mt-4 space-y-3">
              {CUSTOMER_STATUSES.map((status) => (
                <li key={status.key} className="rounded-[10px] border border-border bg-muted/30 p-3">
                  <p className="text-sm font-semibold capitalize text-foreground">{status.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{status.hint}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Field mapping */}
      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="h-0.5 bg-primary" />
        <div className="p-5">
          <h3 className="text-sm font-semibold text-foreground">Field mapping at conversion</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            <strong>Copy</strong> writes to the record. <strong>Snapshot</strong> stores in lead_context JSON.{" "}
            <strong>Link</strong> keeps lead_id for navigation.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <th className="px-3 py-2">Lead field</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Deal</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {FIELD_MAPPINGS.map((row) => (
                  <tr key={row.leadField} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-foreground">{row.label}</p>
                      <p className="text-[10px] text-muted-foreground">{row.leadField}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <MappingBadge value={row.customer} />
                    </td>
                    <td className="px-3 py-2.5">
                      <MappingBadge value={row.deal} />
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { href: "/leads?view=board", label: "Open leads board" },
          { href: "/pipeline", label: "Open pipeline" },
          { href: "/customers", label: "Open customers" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
          >
            {link.label}
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
