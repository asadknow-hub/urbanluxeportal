import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notify";

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>;

/** Least-loaded active agent. Prefer a desk when one is given; fall back to the house pool. */
export async function pickRoundRobinAgent(
  supabase: ServiceClient = createSupabaseServiceClient(),
  teamId?: string | null
): Promise<string | null> {
  async function loadAgents(deskId?: string | null) {
    let query = supabase.from("profiles").select("id").eq("role", "agent").eq("is_active", true);
    if (deskId) query = query.eq("team_id", deskId);
    const { data } = await query;
    return data ?? [];
  }

  let agents = teamId ? await loadAgents(teamId) : [];
  if (!agents.length) agents = await loadAgents();
  if (!agents.length) return null;

  const { data: loads } = await supabase
    .from("leads")
    .select("assigned_to")
    .is("deleted_at", null)
    .not("assigned_to", "is", null);

  const counts = new Map<string, number>();
  for (const agent of agents) counts.set(agent.id, 0);
  for (const row of loads ?? []) {
    if (row.assigned_to && counts.has(row.assigned_to)) {
      counts.set(row.assigned_to, (counts.get(row.assigned_to) ?? 0) + 1);
    }
  }

  let winner = agents[0].id;
  let lowest = Number.POSITIVE_INFINITY;
  for (const agent of agents) {
    const n = counts.get(agent.id) ?? 0;
    if (n < lowest) {
      lowest = n;
      winner = agent.id;
    }
  }
  return winner;
}

export async function applyLeadRouting(
  supabase: ServiceClient,
  leadId: string,
  assignedTo: string | null | undefined,
  reason: "created" | "import" | "webhook" = "created",
  teamId?: string | null
): Promise<string | null> {
  if (assignedTo) return assignedTo;

  const agentId = await pickRoundRobinAgent(supabase, teamId);
  if (!agentId) return null;

  await supabase
    .from("leads")
    .update({ assigned_to: agentId, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  await supabase.from("lead_assignments").insert({
    lead_id: leadId,
    to_user: agentId,
    reason: `round_robin:${reason}`,
  });

  await notify({
    userIds: [agentId],
    kind: "lead_assigned",
    title: "New lead assigned",
    body: "A lead was routed to you. Open Leads to make first contact.",
    entityType: "lead",
    entityId: leadId,
  });

  return agentId;
}
