import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TeamList } from "@/components/team/team-list";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["admin", "manager"].includes(user.role)) redirect("/dashboard");

  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (params.role && params.role !== "all") {
    query = query.eq("role", params.role);
  }

  if (params.q) {
    query = query.or(`full_name.ilike.%${params.q}%,email.ilike.%${params.q}%`);
  }

  const { data: staff, error } = await query;

  if (error) console.error("[team] query error:", error.message);

  // Get lead counts per agent
  const { data: leadCounts } = await supabase
    .from("leads")
    .select("assigned_to")
    .is("deleted_at", null);

  const leadMap: Record<string, number> = {};
  (leadCounts ?? []).forEach((l) => {
    if (l.assigned_to) leadMap[l.assigned_to] = (leadMap[l.assigned_to] ?? 0) + 1;
  });

  // Get deal counts per agent
  const { data: dealCounts } = await supabase
    .from("deals")
    .select("assigned_to, stage")
    .is("deleted_at", null);

  const dealMap: Record<string, { total: number; won: number }> = {};
  (dealCounts ?? []).forEach((d) => {
    if (!d.assigned_to) return;
    if (!dealMap[d.assigned_to]) dealMap[d.assigned_to] = { total: 0, won: 0 };
    dealMap[d.assigned_to].total++;
    if (d.stage === "won") dealMap[d.assigned_to].won++;
  });

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-8 sm:p-10 text-white shadow-xl shadow-emerald-900/10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-10 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Team Directory</h1>
            <p className="text-emerald-100/80 text-sm sm:text-base max-w-xl font-medium leading-relaxed">
              Manage your agency's staff accounts, oversee performance metrics, and assign roles effortlessly.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-6 rounded-2xl bg-white/10 p-5 backdrop-blur-md border border-white/20 shadow-inner">
             <div className="text-center">
               <p className="text-3xl font-bold">{staff?.length ?? 0}</p>
               <p className="text-[10px] uppercase tracking-wider text-emerald-200 font-bold mt-1">Total Members</p>
             </div>
             <div className="w-[1px] h-10 bg-white/20"></div>
             <div className="text-center">
               <p className="text-3xl font-bold">{staff?.filter(s => s.role === 'agent').length ?? 0}</p>
               <p className="text-[10px] uppercase tracking-wider text-emerald-200 font-bold mt-1">Active Agents</p>
             </div>
          </div>
        </div>
      </div>

      <TeamList
        staff={staff ?? []}
        leadMap={leadMap}
        dealMap={dealMap}
        currentFilters={params}
        currentUserRole={user.role}
      />
    </div>
  );
}
