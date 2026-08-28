import { createSupabaseServerClient } from "@/lib/supabase/server";
import { optionLabel, type LeadFieldOption } from "@/lib/lead-field-options";

export type SourceFunnelRow = {
  source: string;
  label: string;
  leads: number;
  converted: number;
  won: number;
  pipelineValue: number;
};

export type AgentPerformanceRow = {
  agentId: string;
  agentName: string;
  openLeads: number;
  convertedLeads: number;
  openDeals: number;
  closedDeals: number;
  pipelineValue: number;
  wonValue: number;
};

const OPEN_DEAL_STAGES = ["new", "negotiations", "contract", "inquiry", "viewing", "offer", "negotiation"];

export async function fetchSourceFunnelReport(): Promise<SourceFunnelRow[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: leads }, { data: deals }, { data: sourceOptions }] = await Promise.all([
    supabase.from("leads").select("id, source, status, converted_deal_id").is("deleted_at", null),
    supabase
      .from("deals")
      .select("id, lead_id, stage, value, customer_id")
      .is("deleted_at", null),
    supabase
      .from("lead_field_options")
      .select("value, label")
      .eq("field_key", "source")
      .order("sort"),
  ]);

  const labelBySource = new Map((sourceOptions ?? []).map((row) => [row.value, row.label]));
  const wonDealIds = new Set(
    (deals ?? []).filter((deal) => deal.stage === "closed").map((deal) => deal.id)
  );
  const pipelineByLead = new Map<string, number>();
  for (const deal of deals ?? []) {
    if (!deal.lead_id || !OPEN_DEAL_STAGES.includes(deal.stage)) continue;
    pipelineByLead.set(deal.lead_id, (pipelineByLead.get(deal.lead_id) ?? 0) + (deal.value ?? 0));
  }

  const buckets = new Map<string, SourceFunnelRow>();

  for (const lead of leads ?? []) {
    const source = lead.source?.trim() || "unknown";
    const row =
      buckets.get(source) ??
      ({
        source,
        label: labelBySource.get(source) ?? source.replace(/_/g, " "),
        leads: 0,
        converted: 0,
        won: 0,
        pipelineValue: 0,
      } satisfies SourceFunnelRow);
    row.leads += 1;
    if (lead.status === "converted" || lead.converted_deal_id) row.converted += 1;
    if (lead.converted_deal_id && wonDealIds.has(lead.converted_deal_id)) row.won += 1;
    row.pipelineValue += pipelineByLead.get(lead.id) ?? 0;
    buckets.set(source, row);
  }

  return [...buckets.values()].sort((a, b) => b.leads - a.leads);
}

export async function fetchAgentPerformanceReport(): Promise<AgentPerformanceRow[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: agents }, { data: leads }, { data: deals }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .in("role", ["admin", "manager", "reception", "agent"])
      .eq("is_active", true)
      .order("full_name"),
    supabase.from("leads").select("id, assigned_to, status, converted_deal_id").is("deleted_at", null),
    supabase.from("deals").select("assigned_to, stage, value").is("deleted_at", null),
  ]);

  const rows = new Map<string, AgentPerformanceRow>();

  for (const agent of agents ?? []) {
    rows.set(agent.id, {
      agentId: agent.id,
      agentName: agent.full_name,
      openLeads: 0,
      convertedLeads: 0,
      openDeals: 0,
      closedDeals: 0,
      pipelineValue: 0,
      wonValue: 0,
    });
  }

  for (const lead of leads ?? []) {
    if (!lead.assigned_to) continue;
    const row = rows.get(lead.assigned_to);
    if (!row) continue;
    if (lead.status !== "converted" && lead.status !== "unqualified") row.openLeads += 1;
    if (lead.status === "converted" || lead.converted_deal_id) row.convertedLeads += 1;
  }

  for (const deal of deals ?? []) {
    if (!deal.assigned_to) continue;
    const row = rows.get(deal.assigned_to);
    if (!row) continue;
    if (deal.stage === "closed") {
      row.closedDeals += 1;
      row.wonValue += deal.value ?? 0;
    } else if (deal.stage !== "lost") {
      row.openDeals += 1;
      row.pipelineValue += deal.value ?? 0;
    }
  }

  return [...rows.values()]
    .filter((row) => row.openLeads + row.convertedLeads + row.openDeals + row.closedDeals > 0)
    .sort((a, b) => b.pipelineValue + b.wonValue - (a.pipelineValue + a.wonValue));
}

export function formatSourceLabel(source: string, options: LeadFieldOption[]) {
  return optionLabel(options, source) || source.replace(/_/g, " ");
}
