import { LEAD_SNAPSHOT_FIELDS, type LeadSnapshotField } from "@/lib/lead-snapshot-fields";
import type { LeadFieldOption } from "@/lib/lead-field-options";

/** Fields that can be imported onto a lead row. Document category is upload-only. */
export const LEAD_IMPORT_FIELDS: LeadSnapshotField[] = LEAD_SNAPSHOT_FIELDS.filter(
  (field) => field.key !== "doc_category"
);

export type LeadImportFieldKey = (typeof LEAD_IMPORT_FIELDS)[number]["key"];

export const SKIP_MAPPING = "__skip__";

const HEADER_ALIASES: Record<string, LeadImportFieldKey> = {
  full_name: "name",
  lead_name: "name",
  client_name: "name",
  whatsapp: "phone",
  mobile: "phone",
  telephone: "phone",
  tel: "phone",
  areas: "preferred_areas",
  preferred_area: "preferred_areas",
  location: "preferred_areas",
  locations: "preferred_areas",
  tag: "tags",
  budget_band: "budget",
  budget_range: "budget",
};

export type ParsedLeadSheet = {
  headers: string[];
  rows: string[][];
};

export type LeadImportMapping = Record<string, LeadImportFieldKey | typeof SKIP_MAPPING>;

export type LeadImportMappedRow = Partial<Record<LeadImportFieldKey, string>>;

const SAMPLE_VALUES: Record<string, string> = {
  name: "Aisha Rahman",
  phone: "+971501234567",
  email: "aisha@example.com",
  nationality: "Emirati",
  source: "Website",
  interest: "Buy",
  category: "Apartment",
  preferred_areas: "Dubai Marina; Downtown Dubai",
  bedrooms: "2",
  purpose: "End use",
  budget: "2M-3M",
  financing: "Mortgage",
  timeframe: "0-3 months",
  tags: "hot; marina",
  notes: "Looking for a Marina 2BR with a view",
  score: "80",
  lost_reason: "",
  junk_reason: "",
};

export function normalizeImportHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function guessImportField(header: string): LeadImportFieldKey | typeof SKIP_MAPPING {
  const normalized = normalizeImportHeader(header);
  if (!normalized) return SKIP_MAPPING;
  if (HEADER_ALIASES[normalized]) return HEADER_ALIASES[normalized];
  const byKey = LEAD_IMPORT_FIELDS.find((field) => field.key === normalized);
  if (byKey) return byKey.key;
  const byLabel = LEAD_IMPORT_FIELDS.find((field) => normalizeImportHeader(field.label) === normalized);
  return byLabel?.key ?? SKIP_MAPPING;
}

export function guessImportMapping(headers: string[]): LeadImportMapping {
  const used = new Set<string>();
  const mapping: LeadImportMapping = {};
  for (const header of headers) {
    const guessed = guessImportField(header);
    if (guessed !== SKIP_MAPPING && used.has(guessed)) {
      mapping[header] = SKIP_MAPPING;
      continue;
    }
    if (guessed !== SKIP_MAPPING) used.add(guessed);
    mapping[header] = guessed;
  }
  return mapping;
}

export function csvEscape(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function buildLeadImportSampleCsv() {
  const header = LEAD_IMPORT_FIELDS.map((field) => csvEscape(field.key)).join(",");
  const row = LEAD_IMPORT_FIELDS.map((field) => csvEscape(SAMPLE_VALUES[field.key] ?? "")).join(",");
  return `${header}\n${row}\n`;
}

export function applyImportMapping(
  headers: string[],
  rows: string[][],
  mapping: LeadImportMapping
): LeadImportMappedRow[] {
  return rows.map((row) => {
    const mapped: LeadImportMappedRow = {};
    headers.forEach((header, index) => {
      const target = mapping[header];
      if (!target || target === SKIP_MAPPING) return;
      const value = (row[index] ?? "").trim();
      if (!value) return;
      mapped[target] = value;
    });
    return mapped;
  });
}

export function mappingConflicts(mapping: LeadImportMapping) {
  const counts = new Map<string, string[]>();
  for (const [header, target] of Object.entries(mapping)) {
    if (target === SKIP_MAPPING) continue;
    const list = counts.get(target) ?? [];
    list.push(header);
    counts.set(target, list);
  }
  return [...counts.entries()].filter(([, headers]) => headers.length > 1);
}

export function splitImportList(raw: string) {
  return raw
    .split(/[;|,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function matchOptionValue(options: LeadFieldOption[] | undefined, raw: string) {
  const needle = raw.trim().toLowerCase();
  if (!needle) return "";
  const hit = options?.find(
    (option) => option.value.toLowerCase() === needle || option.label.toLowerCase() === needle
  );
  return hit?.value ?? raw.trim();
}

export function matchNamedValue(names: string[] | undefined, raw: string) {
  const needle = raw.trim().toLowerCase();
  if (!needle) return "";
  return names?.find((name) => name.toLowerCase() === needle) ?? raw.trim();
}
