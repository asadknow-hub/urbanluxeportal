export type LeadSnapshotKind = "text" | "money" | "areas" | "tags" | "textarea";

export type LeadSnapshotField = {
  key: string;
  label: string;
  kind: LeadSnapshotKind;
  group: string;
  span?: string;
};

/** Fields shown on the lead detail snapshot — also the Fields tab in Lead Settings. */
export const LEAD_SNAPSHOT_FIELDS: LeadSnapshotField[] = [
  { key: "name", label: "Name", kind: "text", group: "Identity" },
  { key: "phone", label: "Phone", kind: "text", group: "Identity" },
  { key: "email", label: "Email", kind: "text", group: "Identity" },
  { key: "language", label: "Language", kind: "text", group: "Identity" },
  { key: "interest", label: "Interest", kind: "text", group: "Preference" },
  { key: "budget_min", label: "Budget Min (AED)", kind: "money", group: "Preference" },
  { key: "budget_max", label: "Budget Max (AED)", kind: "money", group: "Preference" },
  { key: "preferred_areas", label: "Preferred Areas", kind: "areas", group: "Preference" },
  { key: "financing", label: "Financing", kind: "text", group: "Preference" },
  { key: "timeframe", label: "Timeframe", kind: "text", group: "Preference" },
  { key: "purpose", label: "Purpose", kind: "text", group: "Preference" },
  { key: "bedrooms", label: "Bedrooms", kind: "text", group: "Preference" },
  { key: "category", label: "Category", kind: "text", group: "Preference" },
  { key: "tags", label: "Tags", kind: "tags", group: "Preference" },
  { key: "notes", label: "Notes", kind: "textarea", group: "Preference", span: "sm:col-span-2 xl:col-span-3" },
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
