export type LeadSnapshotKind = "text" | "money" | "areas" | "tags" | "textarea" | "options";

export type LeadSnapshotField = {
  key: string;
  label: string;
  kind: LeadSnapshotKind;
  group: string;
  span?: string;
};

/** Fields shown on the lead detail snapshot — also the Fields tab in Lead Settings. */
export const LEAD_SNAPSHOT_FIELDS: LeadSnapshotField[] = [
  { key: "name", label: "Name", kind: "text", group: "Contact" },
  { key: "phone", label: "WhatsApp", kind: "text", group: "Contact" },
  { key: "email", label: "Email", kind: "text", group: "Contact" },
  { key: "nationality", label: "Nationality", kind: "text", group: "Contact" },
  { key: "source", label: "Source", kind: "options", group: "Contact" },
  { key: "interest", label: "Interest", kind: "options", group: "Tastes" },
  { key: "category", label: "Category", kind: "options", group: "Tastes" },
  { key: "preferred_areas", label: "Preferred Areas", kind: "areas", group: "Tastes" },
  { key: "bedrooms", label: "Bedrooms", kind: "options", group: "Tastes" },
  { key: "purpose", label: "Purpose", kind: "options", group: "Tastes" },
  { key: "budget", label: "Budget", kind: "options", group: "Financing" },
  { key: "financing", label: "Financing", kind: "options", group: "Financing" },
  { key: "timeframe", label: "Timeframe", kind: "options", group: "Financing" },
  { key: "tags", label: "Tags", kind: "tags", group: "Notes" },
  { key: "notes", label: "Notes", kind: "textarea", group: "Notes", span: "sm:col-span-2 xl:col-span-3" },
];

export function snapshotFieldGroups() {
  const groups: { name: string; fields: LeadSnapshotField[] }[] = [];
  for (const field of LEAD_SNAPSHOT_FIELDS) {
    const existing = groups.find((g) => g.name === field.group);
    if (existing) existing.fields.push(field);
    else groups.push({ name: field.group, fields: [field] });
  }
  return groups;
}
