import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { dealStageLabel } from "@/lib/deal-stages";

export function ConversionPath({
  lead,
  customer,
  deal,
  current,
}: {
  lead?: { id: string; name: string } | null;
  customer?: { id: string; name: string; status?: string } | null;
  deal?: { id: string; title: string; stage?: string } | null;
  current: "lead" | "customer" | "deal";
}) {
  const steps = [
    lead ? { key: "lead" as const, href: `/leads/${lead.id}`, label: lead.name, hint: "Lead" } : null,
    customer
      ? { key: "customer" as const, href: `/customers/${customer.id}`, label: customer.name, hint: customer.status ?? "Customer" }
      : null,
    deal
      ? { key: "deal" as const, href: `/pipeline/${deal.id}`, label: deal.title, hint: dealStageLabel(deal.stage) }
      : null,
  ].filter(Boolean) as { key: "lead" | "customer" | "deal"; href: string; label: string; hint: string }[];

  if (steps.length < 2) return null;

  return (
    <nav
      aria-label="Conversion path"
      className="flex flex-wrap items-center gap-2 rounded-[14px] border border-border bg-card px-4 py-3 text-sm"
    >
      {steps.map((step, idx) => (
        <span key={step.key} className="flex items-center gap-2">
          {idx > 0 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
          {step.key === current ? (
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{step.hint}</span>
              <span className="font-semibold text-foreground">{step.label}</span>
            </span>
          ) : (
            <Link href={step.href} className="hover:text-primary">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{step.hint}</span>
              <span className="font-medium">{step.label}</span>
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
