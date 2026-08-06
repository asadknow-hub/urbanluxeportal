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

  // Calculate totals
  const allDeals = deals ?? [];
  const activeDeals = allDeals.filter(
    (d) => d.stage !== "won" && d.stage !== "lost"
  );
  const totalPipeline = activeDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  const weightedValue = activeDeals.reduce((sum, d) => {
    const stage = STAGES.find((s) => s.key === d.stage);
    return sum + (d.value ?? 0) * (stage?.weight ?? 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="text-sm text-slate-500">
            {activeDeals.length} active deals ·{" "}
            <span className="font-medium text-slate-700">{formatAEDCompact(totalPipeline)}</span> total ·{" "}
            <span className="font-medium text-emerald-600">{formatAEDCompact(weightedValue)}</span> weighted
          </p>
        </div>
      </div>

      <PipelineBoard deals={allDeals} userRole={user.role} userId={user.id} />
    </div>
  );
}
