export type LeadSnapshotKind = "text" | "money" | "areas" | "tags" | "textarea" | "options";

export type LeadSnapshotField = {
  key: string;
  label: string;
  kind: LeadSnapshotKind;
  group: string;
  span?: string;
};

/**
 * Single CRM catalog for leads.
 * Lead Settings → Fields lists these.
 * Lead detail / create read and write these (plus workflow chrome: stage, assignee, follow-up).
 * Do not add a lead CRM attribute anywhere else without adding it here first.
 */
export const LEAD_SNAPSHOT_FIELDS: LeadSnapshotField[] = [
  { key: "name", label: "Name", kind: "text", group: "Contact" },
  { key: "phone", label: "WhatsApp", kind: "text", group: "Contact" },
  { key: "call_numbers", label: "Call number", kind: "text", group: "Contact" },
  { key: "email", label: "Email", kind: "text", group: "Contact" },
  { key: "nationality", label: "Nationality", kind: "options", group: "Contact" },
  { key: "source", label: "Source", kind: "options", group: "Contact" },
  { key: "interest", label: "Interest", kind: "options", group: "Tastes" },
  { key: "category", label: "Category", kind: "options", group: "Tastes" },
  { key: "preferred_areas", label: "Preferred Areas", kind: "areas", group: "Tastes" },
  { key: "bedrooms", label: "Bedrooms", kind: "options", group: "Tastes" },
  { key: "purpose", label: "Purpose", kind: "options", group: "Tastes" },
  { key: "budget", label: "Budget", kind: "options", group: "Financing" },
  { key: "financing", label: "Financing", kind: "options", group: "Financing" },
  { key: "timeframe", label: "Timeframe", kind: "options", group: "Financing" },
  { key: "tags", label: "Tags", kind: "options", group: "Notes" },
  { key: "notes", label: "Notes", kind: "textarea", group: "Notes", span: "sm:col-span-2 xl:col-span-3" },
  { key: "score", label: "Score", kind: "options", group: "Scoring" },
  { key: "lost_reason", label: "Lost reason", kind: "options", group: "Pipeline" },
  { key: "junk_reason", label: "Junk reason", kind: "options", group: "Pipeline" },
  { key: "doc_category", label: "Document category", kind: "options", group: "Documents" },
];

/** Hidden on Add lead — pipeline/document chrome is set later on the lead. */
export const LEAD_CREATE_HIDDEN_KEYS = new Set(["lost_reason", "junk_reason", "doc_category"]);

export function leadCreateFieldGroups() {
  return snapshotFieldGroups()
    .map((group) => ({
      ...group,
      fields: group.fields.filter((field) => !LEAD_CREATE_HIDDEN_KEYS.has(field.key)),
    }))
    .filter((group) => group.fields.length > 0);
}

export function snapshotFieldGroups() {
  const groups: { name: string; fields: LeadSnapshotField[] }[] = [];
  for (const field of LEAD_SNAPSHOT_FIELDS) {
    const existing = groups.find((g) => g.name === field.group);
    if (existing) existing.fields.push(field);
    else groups.push({ name: field.group, fields: [field] });
  }
  return groups;
}
