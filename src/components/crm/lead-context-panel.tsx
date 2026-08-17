import { formatAEDRange } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import {
  type LeadContext,
  formatLeadContextLabel,
} from "@/lib/lead-flow";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

function displayValue(key: keyof LeadContext, ctx: LeadContext): string | null {
  const raw = ctx[key];
  if (raw == null) return null;
  if (key === "preferred_areas" && Array.isArray(raw)) {
    return raw.length ? raw.join(", ") : null;
  }
  if (key === "tags" && Array.isArray(raw)) {
    return raw.length ? raw.join(", ") : null;
  }
  if (key === "budget_min" || key === "budget_max") {
    return null;
  }
  if (key === "captured_at" && typeof raw === "string") {
    return formatDate(raw, "dd MMM yyyy");
  }
  if (key === "score" && typeof raw === "number") {
    return String(raw);
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw.replace(/_/g, " ");
  }
  return null;
}

const DISPLAY_KEYS: (keyof LeadContext)[] = [
  "source",
  "interest",
  "score",
  "preferred_areas",
  "financing",
  "timeframe",
  "purpose",
  "bedrooms",
  "category",
  "tags",
  "notes",
  "captured_at",
];

export function LeadContextPanel({
  context,
  leadHref,
  variant = "default",
}: {
  context: LeadContext | null | undefined;
  leadHref?: string;
  variant?: "default" | "compact";
}) {
  if (!context) return null;

  const budget =
    context.budget_min != null || context.budget_max != null
      ? formatAEDRange(context.budget_min, context.budget_max)
      : null;

  const rows: { key: string; label: string; value: string | null }[] = DISPLAY_KEYS.map((key) => ({
    key,
    label: formatLeadContextLabel(key),
    value: displayValue(key, context),
  })).filter((r) => r.value);

  if (budget) {
    rows.splice(3, 0, { key: "budget", label: "Budget", value: budget });
  }

  if (rows.length === 0) return null;

  return (
    <section
      className={
        variant === "compact"
          ? "rounded-[14px] border border-border bg-card p-4"
          : "overflow-hidden rounded-[14px] border border-border bg-card"
      }
    >
      {variant !== "compact" && <div className="h-0.5 bg-primary" />}
      <div className={variant === "compact" ? "" : "p-5"}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">From lead</h2>
          </div>
          {leadHref && (
            <Link
              href={leadHref}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View lead
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
        <dl className="space-y-2.5">
          {rows.map((row) => (
            <div key={String(row.key)} className="grid grid-cols-[120px_1fr] gap-2 text-sm">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{row.label}</dt>
              <dd className="font-medium capitalize text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
