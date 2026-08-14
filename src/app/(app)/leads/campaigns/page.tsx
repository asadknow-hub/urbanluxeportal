import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Glossy Header Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Marketing Campaigns</h1>
          <p className="text-sm text-slate-300 font-medium">
            Track lead sources, manage budgets, and analyze marketing ROI
          </p>
        </div>
      </div>

      {campaigns && campaigns.length === 0 ? (
        <div className="relative overflow-hidden flex h-80 flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-slate-50/50 group hover:bg-slate-50 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-100/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200/60 mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-slate-700">No active campaigns</p>
            <p className="text-sm font-medium text-slate-400 mt-1 max-w-sm text-center">
              Campaign tracking and ROI analytics will be unlocked in the next major update.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {campaigns?.map((c: any) => (
            <div key={c.id} className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-emerald-200/60">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
              
              <div className="relative z-10 flex items-start justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{c.name}</h3>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                  c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {c.status}
                </span>
              </div>
              
              <div className="relative z-10 space-y-2 mt-auto pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Channel</span>
                  <span className="font-bold text-slate-700">{c.channel}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Tracking Code</span>
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{c.tracking_code}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
