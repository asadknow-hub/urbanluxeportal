import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { formatAEDCompact } from "@/lib/money";

export const dynamic = "force-dynamic";

const STAGES = [
  { key: "inquiry", label: "Inquiry", weight: 0.10 },
  { key: "viewing", label: "Viewing", weight: 0.25 },
  { key: "negotiation", label: "Negotiation", weight: 0.40 },
  { key: "offer", label: "Offer", weight: 0.60 },
  { key: "contract", label: "Contract", weight: 0.80 },
  { key: "won", label: "Won", weight: 1.0 },
  { key: "lost", label: "Lost", weight: 0 },
] as const;

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
  const activeDeals = allDeals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const totalPipeline = activeDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  const weightedValue = activeDeals.reduce((sum, d) => {
    const stage = STAGES.find((s) => s.key === d.stage);
    return sum + (d.value ?? 0) * (stage?.weight ?? 0);
  }, 0);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{activeDeals.length}</span> active deals
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { label: "Active deals", value: String(activeDeals.length), hint: "Excludes won & lost" },
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
