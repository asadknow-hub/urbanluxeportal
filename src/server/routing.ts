import { notify } from "@/lib/notify";
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
  teamId?: string | null
): Promise<string | null> {
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
