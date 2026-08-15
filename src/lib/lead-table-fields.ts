export type LeadTableField = {
  key: string;
  label: string;
  type: string;
  group: string;
};

/** Every column on public.leads, for Lead Settings. */
export const LEAD_TABLE_FIELDS: LeadTableField[] = [
  { key: "id", label: "ID", type: "uuid", group: "Identity" },
  { key: "name", label: "Name", type: "text", group: "Identity" },
  { key: "phone", label: "Phone", type: "text", group: "Identity" },
  { key: "phone_norm", label: "Phone (normalized)", type: "text", group: "Identity" },
  { key: "email", label: "Email", type: "text", group: "Identity" },
  { key: "email_norm", label: "Email (normalized)", type: "text", group: "Identity" },
  { key: "language", label: "Language", type: "text", group: "Identity" },
  { key: "source", label: "Source", type: "enum", group: "Origin" },
  { key: "source_id", label: "Source ID", type: "uuid", group: "Origin" },
  { key: "campaign_id", label: "Campaign", type: "uuid", group: "Origin" },
  { key: "external_ref", label: "External ref", type: "text", group: "Origin" },
  { key: "import_batch_id", label: "Import batch", type: "uuid", group: "Origin" },
  { key: "interest", label: "Interest", type: "enum", group: "Preference" },
  { key: "budget_min", label: "Budget min", type: "integer (fils)", group: "Preference" },
  { key: "budget_max", label: "Budget max", type: "integer (fils)", group: "Preference" },
  { key: "preferred_areas", label: "Preferred areas", type: "text[]", group: "Preference" },
  { key: "category", label: "Category", type: "text", group: "Preference" },
  { key: "bedrooms", label: "Bedrooms", type: "text", group: "Preference" },
  { key: "purpose", label: "Purpose", type: "text", group: "Preference" },
  { key: "financing", label: "Financing", type: "text", group: "Preference" },
  { key: "timeframe", label: "Timeframe", type: "text", group: "Preference" },
  { key: "tags", label: "Tags", type: "text[]", group: "Preference" },
  { key: "notes", label: "Notes", type: "text", group: "Preference" },
  { key: "custom", label: "Custom fields", type: "jsonb", group: "Preference" },
  { key: "stage_id", label: "Stage", type: "uuid", group: "Pipeline" },
  { key: "pipeline_id", label: "Pipeline", type: "uuid", group: "Pipeline" },
  { key: "status", label: "Status", type: "enum", group: "Pipeline" },
  { key: "assigned_to", label: "Assigned to", type: "uuid", group: "Pipeline" },
  { key: "score", label: "Score", type: "integer", group: "Pipeline" },
  { key: "score_reason", label: "Score reason", type: "text", group: "Pipeline" },
  { key: "next_follow_up_at", label: "Next follow-up", type: "timestamptz", group: "Pipeline" },
  { key: "no_show_count", label: "No-show count", type: "integer", group: "Pipeline" },
  { key: "lost_reason", label: "Lost reason", type: "text", group: "Pipeline" },
  { key: "junk_reason", label: "Junk reason", type: "text", group: "Pipeline" },
  { key: "merged_into_id", label: "Merged into", type: "uuid", group: "Pipeline" },
  { key: "converted_customer_id", label: "Converted customer", type: "uuid", group: "Conversion" },
  { key: "converted_deal_id", label: "Converted deal", type: "uuid", group: "Conversion" },
  { key: "created_by", label: "Created by", type: "uuid", group: "System" },
  { key: "created_at", label: "Created at", type: "timestamptz", group: "System" },
  { key: "updated_at", label: "Updated at", type: "timestamptz", group: "System" },
  { key: "deleted_at", label: "Deleted at", type: "timestamptz", group: "System" },
  { key: "first_response_due_at", label: "First response due", type: "timestamptz", group: "System" },
  { key: "first_responded_at", label: "First responded", type: "timestamptz", group: "System" },
  { key: "last_activity_at", label: "Last activity", type: "timestamptz", group: "System" },
  { key: "last_inquiry_at", label: "Last inquiry", type: "timestamptz", group: "System" },
];

export function leadTableFieldGroups() {
  const groups: { name: string; fields: LeadTableField[] }[] = [];
  for (const field of LEAD_TABLE_FIELDS) {
    const existing = groups.find((g) => g.name === field.group);
    if (existing) existing.fields.push(field);
    else groups.push({ name: field.group, fields: [field] });
  }
  return groups;
}
