import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FollowUpsView, type FollowUpLead, type FollowUpStage, type FollowUpAgent } from "@/components/leads/follow-ups-view";
import { CalendarClock } from "lucide-react";

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
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div className="overflow-hidden rounded-[14px] border border-border bg-card px-5 py-4">
        <div className="-mx-5 -mt-4 mb-4 h-0.5 bg-primary" />
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div>
            <h1
              className="font-heading text-[22px] font-normal tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              Follow-ups
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {leads.length} lead{leads.length === 1 ? "" : "s"} with a scheduled follow-up
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
