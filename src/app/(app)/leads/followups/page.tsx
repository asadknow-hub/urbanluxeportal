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
      {/* Minimalist White Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-clock"><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h5"/><path d="M17.5 17.5 16 16.3V14"/><circle cx="16" cy="16" r="6"/></svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none mb-1">Follow-ups</h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              {leads.length} lead{leads.length !== 1 ? "s" : ""} with scheduled follow-ups
            </p>
          </div>
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
