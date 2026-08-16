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

export const CONFIGURABLE_LEAD_FIELDS = new Set(["preferred_areas", "nationality"]);

const LEAD_ROW_UDT = {
  id: "uuid",
  name: "text",
  phone: "text",
  phone_norm: "text",
  email: "text",
  email_norm: "text",
  language: "text",
  nationality: "text",
  source: "lead_source",
  source_id: "uuid",
  campaign_id: "uuid",
  external_ref: "text",
  import_batch_id: "uuid",
  interest: "lead_interest",
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
  custom: "jsonb",
  stage_id: "uuid",
  pipeline_id: "uuid",
  status: "lead_status",
  assigned_to: "uuid",
  score: "int4",
  score_reason: "text",
  next_follow_up_at: "timestamptz",
  no_show_count: "int4",
  lost_reason: "text",
  junk_reason: "text",
  merged_into_id: "uuid",
  converted_customer_id: "uuid",
  converted_deal_id: "uuid",
  created_by: "uuid",
  created_at: "timestamptz",
  updated_at: "timestamptz",
  deleted_at: "timestamptz",
  first_response_due_at: "timestamptz",
  first_responded_at: "timestamptz",
  last_activity_at: "timestamptz",
  last_inquiry_at: "timestamptz",
} as const satisfies Record<keyof LeadRow, string>;

export function fallbackLeadTableColumns(): LeadTableColumn[] {
  return Object.entries(LEAD_ROW_UDT).map(([column_name, udt_name], index) => ({
    column_name,
    data_type: udt_name.startsWith("_")
      ? "ARRAY"
      : udt_name === "lead_source" || udt_name === "lead_interest" || udt_name === "lead_status"
        ? "USER-DEFINED"
        : "text",
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
  if (["id", "name", "phone", "phone_norm", "email", "email_norm", "language", "nationality"].includes(key)) return "Identity";
  if (["source", "source_id", "campaign_id", "external_ref", "import_batch_id"].includes(key)) return "Origin";
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
      "custom",
    ].includes(key)
  ) {
    return "Preference";
  }
  if (
    [
      "stage_id",
      "pipeline_id",
      "status",
      "assigned_to",
      "score",
      "score_reason",
      "next_follow_up_at",
      "no_show_count",
      "lost_reason",
      "junk_reason",
      "merged_into_id",
    ].includes(key)
  ) {
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
