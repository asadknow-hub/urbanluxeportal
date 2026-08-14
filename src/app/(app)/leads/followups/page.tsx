import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FollowUpsView, type FollowUpLead, type FollowUpStage, type FollowUpAgent } from "@/components/leads/follow-ups-view";

export const dynamic = "force-dynamic";

export default async function FollowUpsPage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();

  const [leadsResult, stagesResult, agentsResult] = await Promise.all([
    (async () => {
      let query = supabase
        .from("leads")
        .select(
          `id, name, phone, email, interest, next_follow_up_at, last_activity_at,
           updated_at, stage_id, assigned_to,
           assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name, avatar_url),
           stage:lead_stages(id, name, color, kind)`
        )
        .is("deleted_at", null)
        .not("next_follow_up_at", "is", null)
        .order("next_follow_up_at", { ascending: true })
        .limit(500);

      if (user.role === "agent") {
        query = query.eq("assigned_to", user.id);
      }

      return await query;
    })(),
    supabase
      .from("lead_stages")
      .select("id, name, color, kind")
      .order("sort", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("is_active", true)
      .in("role", ["admin", "manager", "agent"])
      .order("full_name", { ascending: true }),
  ]);

  if (leadsResult.error) console.error("[followups] leads query error:", leadsResult.error.message);
  if (stagesResult.error) console.error("[followups] stages query error:", stagesResult.error.message);
  if (agentsResult.error) console.error("[followups] agents query error:", agentsResult.error.message);

  const leads = (leadsResult.data ?? []) as unknown as FollowUpLead[];
  const stages = (stagesResult.data ?? []) as unknown as FollowUpStage[];
  const agents = (agentsResult.data ?? []) as unknown as FollowUpAgent[];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Glossy Header Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Follow-ups</h1>
          <p className="text-sm text-slate-300 font-medium">
            {leads.length} lead{leads.length !== 1 ? "s" : ""} with scheduled follow-ups
          </p>
        </div>
      </div>

      <FollowUpsView
        leads={leads}
        stages={stages}
        agents={agents}
        userRole={user.role}
      />
    </div>
  );
}
