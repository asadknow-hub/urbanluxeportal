export const LEAD_OPTION_FIELD_KEYS = [
  "source",
  "interest",
  "category",
  "bedrooms",
  "purpose",
  "timeframe",
  "financing",
  "budget",
  "doc_category",
  "tags",
  "score",
  "lost_reason",
  "junk_reason",
] as const;

export type LeadOptionFieldKey = (typeof LEAD_OPTION_FIELD_KEYS)[number];

export type LeadFieldOption = {
  id: string;
  field_key: string;
  value: string;
  label: string;
  sort: number;
  extra: Record<string, unknown>;
};

export function isLeadOptionField(key: string): key is LeadOptionFieldKey {
  return (LEAD_OPTION_FIELD_KEYS as readonly string[]).includes(key);
}

export function slugifyOptionValue(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

export function optionLabel(options: LeadFieldOption[] | undefined, value: string | null | undefined) {
  if (!value) return "";
  return options?.find((row) => row.value === value)?.label ?? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function choiceItems(options: LeadFieldOption[] | undefined) {
  return (options ?? []).map((row) => ({ value: row.value, label: row.label }));
}

export type DocCaptureMode = "expiry" | "note";

const DOC_EXPIRY_DEFAULTS = new Set([
  "emirates_id",
  "passport",
  "visa",
  "tenancy_contract",
  "permit",
  "noc",
  "brn",
]);

export function defaultDocCapture(value: string): DocCaptureMode {
  return DOC_EXPIRY_DEFAULTS.has(value) ? "expiry" : "note";
}

export function docCaptureMode(
  option: LeadFieldOption | undefined,
  value?: string
): DocCaptureMode {
  const raw = option?.extra?.capture;
  if (raw === "expiry" || raw === "note") return raw;
  return defaultDocCapture(option?.value ?? value ?? "");
}

export type DocCategoryChoice = {
  value: string;
  label: string;
  capture: DocCaptureMode;
};

/** Core lead/deal document checklist — excludes invoice, receipt, marketing, etc. */
export const LEAD_DOC_CHECKLIST_VALUES = [
  "emirates_id",
  "passport",
  "visa",
  "title_deed",
  "mou",
  "tenancy_contract",
  "noc",
  "permit",
  "contract",
  "cheque_copy",
  "other",
] as const;

export function leadDocChecklistCategories(
  options: LeadFieldOption[] | DocCategoryChoice[] | undefined
): DocCategoryChoice[] {
  const choices =
    options?.length && "capture" in options[0]
      ? (options as DocCategoryChoice[])
      : docCategoryChoices(options as LeadFieldOption[] | undefined);
  const allowed = new Set<string>(LEAD_DOC_CHECKLIST_VALUES);
  const order = LEAD_DOC_CHECKLIST_VALUES as readonly string[];
  return choices
    .filter((row) => allowed.has(row.value))
    .sort((a, b) => {
      const ai = order.indexOf(a.value);
      const bi = order.indexOf(b.value);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
}

export function docCategoryChoices(options: LeadFieldOption[] | undefined): DocCategoryChoice[] {
  return (options ?? []).map((row) => ({
    value: row.value,
    label: row.label,
    capture: docCaptureMode(row),
  }));
}

export function groupLeadFieldOptions(rows: LeadFieldOption[]) {
  const grouped: Record<string, LeadFieldOption[]> = {};
  for (const row of rows) {
    (grouped[row.field_key] ??= []).push(row);
  }
  return grouped;
}

export function budgetBandForRange(
  options: LeadFieldOption[] | undefined,
  minFils: number | null | undefined,
  maxFils: number | null | undefined
) {
  if (minFils == null && maxFils == null) return null;
  return (
    options?.find((row) => {
      const extra = row.extra ?? {};
      return Number(extra.min_fils) === Number(minFils) && Number(extra.max_fils) === Number(maxFils);
    }) ?? null
  );
}

export function scoreBandForValue(options: LeadFieldOption[] | undefined, score: number | null | undefined) {
  if (score == null || !options?.length) return null;
  return (
    options.find((row) => {
      const extra = row.extra ?? {};
      const min = Number(extra.min_score);
      const max = Number(extra.max_score);
      return Number.isFinite(min) && Number.isFinite(max) && score >= min && score <= max;
    }) ?? null
  );
}

export function scoreFromBand(option: LeadFieldOption) {
  const extra = option.extra ?? {};
  const min = Number(extra.min_score);
  const max = Number(extra.max_score);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return 0;
  return Math.round((min + max) / 2);
}

export const RANGE_OPTION_KEYS = ["budget", "score"] as const;

export function isRangeOptionField(key: string) {
  return (RANGE_OPTION_KEYS as readonly string[]).includes(key);
}
