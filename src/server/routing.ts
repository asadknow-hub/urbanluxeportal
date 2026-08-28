import { notify } from "@/lib/notify";
import { resolveSourceDefaultAssignee } from "@/lib/source-routing";
import { syncPersonAssignment } from "@/server/people";
import type {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

export type CrmDb =
  | Awaited<ReturnType<typeof createSupabaseServerClient>>
  | ReturnType<typeof createSupabaseServiceClient>;

export async function teamIdForUser(
  supabase: CrmDb,
  userId: string | null | undefined
): Promise<string | null> {
  if (!userId) return null;
  const { data } = await supabase.from("profiles").select("team_id").eq("id", userId).maybeSingle();
  return data?.team_id ?? null;
}

export async function pickRoundRobinAgent(
  supabase: CrmDb,
  teamId?: string | null
): Promise<string | null> {
  const { data, error } = await supabase.rpc("crm_least_loaded_agent", { p_team_id: teamId ?? null });
  if (error) {
    console.error("[routing] least-loaded agent:", error.message);
    return null;
  }
  return data ?? null;
}

export async function applyLeadRouting(
  supabase: CrmDb,
  leadId: string,
  assignedTo: string | null | undefined,
  reason: "created" | "import" | "webhook" = "created",
  teamId?: string | null,
  source?: string | null
): Promise<string | null> {
  let target = assignedTo ?? null;
  if (!target) {
    target = await resolveSourceDefaultAssignee(supabase, source);
  }

  if (target) {
    const desk = await teamIdForUser(supabase, target);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("leads")
      .update({
        assigned_to: target,
        team_id: desk ?? teamId ?? null,
        updated_at: now,
      })
      .eq("id", leadId);

    if (error) {
      console.error("[routing] fixed assign:", error.message);
      return null;
    }

    await syncPersonAssignment(leadId, target, supabase);
    await supabase.from("lead_assignments").insert({
      lead_id: leadId,
      to_user: target,
      reason: source ? `source:${source}` : reason,
    });

    if (!assignedTo) {
      await notify({
        userIds: [target],
        kind: "lead_assigned",
        title: "New lead assigned",
        body: source
          ? `A ${source.replace(/_/g, " ")} lead was routed to you. Open Leads to make first contact.`
          : "A lead was routed to you. Open Leads to make first contact.",
        entityType: "lead",
        entityId: leadId,
      });
    }

    return target;
  }

  const { data: agentId, error } = await supabase.rpc("crm_apply_lead_routing", {
    p_lead_id: leadId,
    p_assigned_to: assignedTo ?? null,
    p_reason: reason,
    p_team_id: teamId ?? null,
  });

  if (error) {
    console.error("[routing] apply:", error.message);
    return null;
  }

  if (agentId && !assignedTo) {
    await notify({
      userIds: [agentId],
      kind: "lead_assigned",
      title: "New lead assigned",
      body: "A lead was routed to you. Open Leads to make first contact.",
      entityType: "lead",
      entityId: leadId,
    });
  }

  return (agentId as string | null) ?? null;
}
