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
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Glossy Header Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Sales Pipeline</h1>
          <p className="text-sm text-slate-300 font-medium">
            Manage your deals and track revenue projections
          </p>
        </div>
      </div>

      {/* Metrics Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Deals */}
        <div className="relative overflow-hidden rounded-[1.5rem] border border-blue-200/60 p-5 bg-gradient-to-br from-blue-50 to-transparent shadow-sm hover:shadow-md transition-shadow">
          <div className="relative z-10 flex items-center justify-between mb-2">
            <span className="text-sm font-bold uppercase tracking-wider text-blue-700">Active Deals</span>
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm" />
          </div>
          <p className="relative z-10 text-4xl font-extrabold text-slate-900">{activeDeals.length}</p>
        </div>

        {/* Total Pipeline */}
        <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200/60 p-5 bg-gradient-to-br from-slate-50 to-transparent shadow-sm hover:shadow-md transition-shadow">
          <div className="relative z-10 flex items-center justify-between mb-2">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-700">Total Pipeline</span>
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400 shadow-sm" />
          </div>
          <p className="relative z-10 text-4xl font-extrabold text-slate-900">{formatAEDCompact(totalPipeline)}</p>
        </div>

        {/* Weighted Value */}
        <div className="relative overflow-hidden rounded-[1.5rem] border border-emerald-200/60 p-5 bg-gradient-to-br from-emerald-50 to-transparent shadow-sm hover:shadow-md transition-shadow">
          <div className="relative z-10 flex items-center justify-between mb-2">
            <span className="text-sm font-bold uppercase tracking-wider text-emerald-700">Weighted Value</span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
          </div>
          <p className="relative z-10 text-4xl font-extrabold text-emerald-900">{formatAEDCompact(weightedValue)}</p>
        </div>
      </div>

      <PipelineBoard deals={allDeals} userRole={user.role} userId={user.id} />
    </div>
  );
}
