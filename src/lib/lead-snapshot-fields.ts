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
  { key: "name", label: "Name", kind: "text", group: "Customer" },
  { key: "phone", label: "WhatsApp", kind: "text", group: "Customer" },
  { key: "email", label: "Email", kind: "text", group: "Customer" },
  { key: "nationality", label: "Nationality", kind: "text", group: "Customer" },
  { key: "preferred_areas", label: "Preferred Areas", kind: "areas", group: "Preferences" },
  { key: "budget_min", label: "Budget Min (AED)", kind: "money", group: "Preferences" },
  { key: "budget_max", label: "Budget Max (AED)", kind: "money", group: "Preferences" },
  { key: "interest", label: "Interest", kind: "text", group: "Requirements" },
  { key: "financing", label: "Financing", kind: "text", group: "Requirements" },
  { key: "timeframe", label: "Timeframe", kind: "text", group: "Requirements" },
  { key: "purpose", label: "Purpose", kind: "text", group: "Requirements" },
  { key: "bedrooms", label: "Bedrooms", kind: "text", group: "Requirements" },
  { key: "category", label: "Category", kind: "text", group: "Requirements" },
  { key: "tags", label: "Tags", kind: "tags", group: "Requirements" },
  { key: "notes", label: "Notes", kind: "textarea", group: "Requirements", span: "sm:col-span-2 xl:col-span-3" },
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
