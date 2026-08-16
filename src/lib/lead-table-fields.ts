import type { Database } from "@/types/database";
import type { LeadTableColumn } from "@/server/lead-areas";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

export type LeadTableField = {
  key: string;
  label: string;
  type: string;
  group: string;
  configurable: boolean;
};

/** Fields whose option lists are managed in Lead Settings → Fields. */
export const CONFIGURABLE_LEAD_FIELDS = new Set([
  "preferred_areas",
  "nationality",
  "source",
  "interest",
  "category",
  "bedrooms",
  "purpose",
  "budget",
  "financing",
  "timeframe",
  "doc_category",
  "tags",
  "score",
  "lost_reason",
  "junk_reason",
]);

/** Live `leads` columns after dropping silent/unused fields. */
const LEAD_ROW_UDT = {
  id: "uuid",
  name: "text",
  phone: "text",
  phone_norm: "text",
  email: "text",
  email_norm: "text",
  nationality: "text",
  source: "text",
  interest: "text",
  budget_min: "int8",
  budget_max: "int8",
  preferred_areas: "_text",
  category: "text",
  bedrooms: "text",
  purpose: "text",
  financing: "text",
  timeframe: "text",
  tags: "_text",
  notes: "text",
  stage_id: "uuid",
  status: "text",
  assigned_to: "uuid",
  score: "int4",
  next_follow_up_at: "timestamptz",
  lost_reason: "text",
  junk_reason: "text",
  converted_customer_id: "uuid",
  converted_deal_id: "uuid",
  created_by: "uuid",
  created_at: "timestamptz",
  updated_at: "timestamptz",
  deleted_at: "timestamptz",
  last_activity_at: "timestamptz",
  stage_entered_at: "timestamptz",
} as const satisfies Record<keyof LeadRow, string>;

export function fallbackLeadTableColumns(): LeadTableColumn[] {
  return Object.entries(LEAD_ROW_UDT).map(([column_name, udt_name], index) => ({
    column_name,
    data_type: udt_name.startsWith("_") ? "ARRAY" : "text",
    udt_name,
    ordinal_position: index + 1,
  }));
}

function humanize(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function prettyType(column: LeadTableColumn) {
  if (column.data_type === "ARRAY") return `${column.udt_name.replace(/^_/, "")}[]`;
  if (column.data_type === "USER-DEFINED") return column.udt_name;
  if (column.udt_name === "int8" || column.udt_name === "int4") return "integer";
  if (column.udt_name === "numeric") return "numeric";
  if (column.udt_name === "bool") return "boolean";
  if (column.udt_name === "jsonb") return "jsonb";
  if (column.udt_name === "timestamptz") return "timestamptz";
  if (column.udt_name === "uuid") return "uuid";
  if (column.udt_name === "text") return "text";
  return column.udt_name || column.data_type;
}

function groupFor(key: string) {
  if (["id", "name", "phone", "phone_norm", "email", "email_norm", "nationality"].includes(key)) return "Identity";
  if (["source"].includes(key)) return "Origin";
  if (
    [
      "interest",
      "budget_min",
      "budget_max",
      "preferred_areas",
      "category",
      "bedrooms",
      "purpose",
      "financing",
      "timeframe",
      "tags",
      "notes",
    ].includes(key)
  ) {
    return "Preference";
  }
  if (["stage_id", "status", "assigned_to", "score", "next_follow_up_at", "lost_reason", "junk_reason"].includes(key)) {
    return "Pipeline";
  }
  if (["converted_customer_id", "converted_deal_id"].includes(key)) return "Conversion";
  return "System";
}

export function mapLeadTableColumns(columns: LeadTableColumn[]): LeadTableField[] {
  return columns.map((column) => ({
    key: column.column_name,
    label: humanize(column.column_name),
    type: prettyType(column),
    group: groupFor(column.column_name),
    configurable: CONFIGURABLE_LEAD_FIELDS.has(column.column_name),
  }));
}

export function leadTableFieldGroups(fields: LeadTableField[]) {
  const groups: { name: string; fields: LeadTableField[] }[] = [];
  for (const field of fields) {
    const existing = groups.find((g) => g.name === field.group);
    if (existing) existing.fields.push(field);
    else groups.push({ name: field.group, fields: [field] });
  }
  return groups;
}
