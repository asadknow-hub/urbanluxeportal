import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { formatAEDCompact } from "@/lib/money";
import { DEAL_PIPELINE_STAGES, isDealOpen, normalizeDealStage } from "@/lib/deal-stages";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

const STAGES = DEAL_PIPELINE_STAGES;

export default async function PipelinePage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("deals")
    .select(
      `*,
      customer:customers(id, name),
      assigned_to_profile:profiles!deals_assigned_to_fkey(id, full_name, avatar_url)
      `
    )
    .is("deleted_at", null)
    .order("stage_changed_at", { ascending: false });

  if (user.role === "agent") {
    query = query.eq("assigned_to", user.id);
  }

  const { data: deals, error } = await query;

  if (error) console.error("[pipeline] query error:", error.message);

  const allDeals = deals ?? [];
  const activeDeals = allDeals.filter((d) => isDealOpen(d.stage));
  const closedCount = allDeals.filter((d) => normalizeDealStage(d.stage) === "closed").length;
  const totalPipeline = activeDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  const weightedValue = activeDeals.reduce((sum, d) => {
    const stage = STAGES.find((s) => s.key === normalizeDealStage(d.stage));
    return sum + (d.value ?? 0) * (stage?.weight ?? 0);
  }, 0);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{activeDeals.length}</span> active deals
        </p>
        <Link
          href="/pipeline/completed"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Deals completed
          {closedCount > 0 ? (
            <span className="rounded-full bg-emerald-700/10 px-1.5 py-px tabular-nums text-[10px]">
              {closedCount}
            </span>
          ) : null}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { label: "Active deals", value: String(activeDeals.length), hint: "Excludes closed & lost" },
          { label: "Pipeline value", value: formatAEDCompact(totalPipeline), hint: "Sum of open deals" },
          { label: "Weighted forecast", value: formatAEDCompact(weightedValue), hint: "Stage-adjusted projection" },
        ].map((metric) => (
          <div key={metric.label} className="overflow-hidden rounded-[14px] border border-border bg-card p-4">
            <div className="-mx-4 -mt-4 mb-3 h-0.5 bg-primary" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{metric.label}</p>
            <p
              className="mt-2 font-heading text-[1.75rem] leading-none text-foreground"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              {metric.value}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">{metric.hint}</p>
          </div>
        ))}
      </div>

      <PipelineBoard deals={allDeals} userRole={user.role} userId={user.id} />
    </div>
  );
}
