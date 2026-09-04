/** Lead → Deal → Customer lifecycle definitions for settings UI and conversion. */

export type FlowEntity = "lead" | "deal" | "customer";

export type LeadContext = {
  lead_id: string;
  captured_at: string;
  name: string;
  source: string;
  interest: string;
  score: number | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_areas: string[] | null;
  nationality: string | null;
  financing: string | null;
  timeframe: string | null;
  purpose: string | null;
  bedrooms: string | null;
  category: string | null;
  tags: string[];
  notes: string | null;
};

export { CUSTOMER_STATUSES } from "@/lib/customer-status";

export const FLOW_STAGES = [
  {
    key: "lead" as const,
    label: "Lead",
    hint: "Qualify on the leads board — a person record is created at capture",
    href: "/leads?view=board",
  },
  {
    key: "deal" as const,
    label: "Deal",
    hint: "Pipeline from new → closed / lost, attached to that person",
    href: "/pipeline",
  },
  {
    key: "customer" as const,
    label: "Person",
    hint: "Same record from first contact; Active when a deal closes",
    href: "/customers",
  },
] as const;

import { DEAL_PIPELINE_STAGES, DEAL_LOST_STAGE } from "@/lib/deal-stages";

export { DEAL_PIPELINE_STAGES };

export const DEAL_PIPELINE_STAGES_WITH_LOST = [...DEAL_PIPELINE_STAGES, DEAL_LOST_STAGE];

export type FieldMapping = {
  leadField: string;
  label: string;
  customer: "copy" | "link" | "snapshot" | "—";
  deal: "copy" | "link" | "snapshot" | "—";
  notes: string;
};

export const FIELD_MAPPINGS: FieldMapping[] = [
  { leadField: "name", label: "Name", customer: "copy", deal: "copy", notes: "Person SoT; mirrored to all linked leads" },
  { leadField: "phone", label: "WhatsApp", customer: "copy", deal: "copy", notes: "Person SoT; mirrored to linked leads" },
  { leadField: "call_numbers", label: "Call numbers", customer: "copy", deal: "—", notes: "Dial list; copied to person on sync / close" },
  { leadField: "email", label: "Email", customer: "copy", deal: "copy", notes: "Person SoT; mirrored to linked leads" },
  { leadField: "nationality", label: "Nationality", customer: "copy", deal: "copy", notes: "Person/KYC SoT; mirrored both ways for open leads" },
  { leadField: "notes", label: "Notes", customer: "copy", deal: "—", notes: "Merged into customer notes while status is working" },
  { leadField: "assigned_to", label: "Assigned agent", customer: "copy", deal: "copy", notes: "Carried to both records" },
  { leadField: "tags", label: "Tags", customer: "copy", deal: "—", notes: "Union with existing customer tags" },
  { leadField: "interest", label: "Interest", customer: "snapshot", deal: "copy", notes: "Deal type: sale / rental / off-plan; lead_context on convert" },
  { leadField: "budget_min / budget_max", label: "Budget", customer: "snapshot", deal: "copy", notes: "Deal value defaults from budget; lead_context on convert" },
  { leadField: "preferred_areas", label: "Preferred areas", customer: "snapshot", deal: "snapshot", notes: "Preserved in lead_context on convert + finalize" },
  { leadField: "source", label: "Source", customer: "snapshot", deal: "snapshot", notes: "Attribution kept in lead_context" },
  { leadField: "score", label: "Score", customer: "snapshot", deal: "snapshot", notes: "Historical qualification score" },
  { leadField: "financing / timeframe / purpose / bedrooms / category", label: "Requirements", customer: "snapshot", deal: "snapshot", notes: "lead_context on convert; finalize keeps coalesce" },
  { leadField: "documents", label: "Documents", customer: "copy", deal: "copy", notes: "Lead docs copied to deal; all copied to customer on close" },
  { leadField: "id", label: "Lead record", customer: "link", deal: "link", notes: "lead_id + conversion path links" },
];

type LeadLike = {
  id: string;
  name: string;
  source?: string | null;
  interest?: string | null;
  score?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  preferred_areas?: string[] | null;
  nationality?: string | null;
  financing?: string | null;
  timeframe?: string | null;
  purpose?: string | null;
  bedrooms?: string | null;
  category?: string | null;
  tags?: string[] | null;
  notes?: string | null;
};

export function buildLeadContext(lead: LeadLike): LeadContext {
  return {
    lead_id: lead.id,
    captured_at: new Date().toISOString(),
    name: lead.name,
    source: lead.source ?? "unknown",
    interest: lead.interest ?? "sale",
    score: lead.score ?? null,
    budget_min: lead.budget_min ?? null,
    budget_max: lead.budget_max ?? null,
    preferred_areas: lead.preferred_areas ?? null,
    nationality: lead.nationality ?? null,
    financing: lead.financing ?? null,
    timeframe: lead.timeframe ?? null,
    purpose: lead.purpose ?? null,
    bedrooms: lead.bedrooms ?? null,
    category: lead.category ?? null,
    tags: lead.tags ?? [],
    notes: lead.notes ?? null,
  };
}

export function dealTypeFromInterest(interest: string | null | undefined): "sale" | "rental" | "off_plan" {
  if (interest === "rent") return "rental";
  if (interest === "off_plan") return "off_plan";
  return "sale";
}

export function defaultDealTitle(lead: Pick<LeadLike, "name">): string {
  return lead.name.trim();
}

export function suggestedPropertyTitle(lead: Pick<LeadLike, "preferred_areas" | "bedrooms" | "category">): string {
  const area = lead.preferred_areas?.[0];
  const beds = lead.bedrooms?.replace(/_/g, " ");
  const category = lead.category?.replace(/_/g, " ");
  const parts = [area, beds ? `${beds} bed` : null, category].filter(Boolean);
  return parts.join(" · ");
}

export function mergeTags(existing: string[] | null | undefined, incoming: string[] | null | undefined): string[] {
  const set = new Set([...(existing ?? []), ...(incoming ?? [])].filter(Boolean));
  return Array.from(set);
}

export function mergeNotes(existing: string | null | undefined, leadNotes: string | null | undefined): string | null {
  const a = existing?.trim();
  const b = leadNotes?.trim();
  if (a && b && a !== b) return `${a}\n\n— From lead —\n${b}`;
  return a || b || null;
}

export function formatLeadContextLabel(key: keyof LeadContext): string {
  const labels: Partial<Record<keyof LeadContext, string>> = {
    source: "Source",
    interest: "Interest",
    score: "Score",
    budget_min: "Budget min",
    budget_max: "Budget max",
    preferred_areas: "Preferred areas",
    nationality: "Nationality",
    financing: "Financing",
    timeframe: "Timeframe",
    purpose: "Purpose",
    bedrooms: "Bedrooms",
    category: "Category",
    tags: "Tags",
    notes: "Lead notes",
    captured_at: "Captured",
  };
  return labels[key] ?? key.replace(/_/g, " ");
}
