import type { LeadTableColumn } from "@/server/lead-areas";

export type LeadTableField = {
  key: string;
  label: string;
  type: string;
  group: string;
};

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
  if (["id", "name", "phone", "phone_norm", "email", "email_norm", "language"].includes(key)) return "Identity";
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
