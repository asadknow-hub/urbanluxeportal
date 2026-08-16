export const DOC_CATEGORIES = [
  "emirates_id",
  "passport",
  "visa",
  "title_deed",
  "mou",
  "tenancy_contract",
  "noc",
  "cheque_copy",
  "permit",
  "contract",
  "brn",
  "invoice",
  "receipt",
  "marketing",
  "other",
] as const;

export type DocCategoryValue = (typeof DOC_CATEGORIES)[number];

const CATEGORY_SET = new Set<string>(DOC_CATEGORIES);

export function isDocCategory(value: string): value is DocCategoryValue {
  return CATEGORY_SET.has(value);
}

export function normalizeDocCategory(value: string | null | undefined): DocCategoryValue {
  if (value && isDocCategory(value)) return value;
  return "other";
}

export function formatDocCategory(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function fileExtension(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]{1,8})$/);
  return match?.[1] ?? "bin";
}

function folderSegment(value: string | null | undefined, fallback: string) {
  const cleaned = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

/** Canonical object key in the private `documents` bucket. */
export function canonicalDocumentPath(input: {
  entityType?: string | null;
  entityId?: string | null;
  category?: string | null;
  originalName: string;
}) {
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const entity = folderSegment(input.entityType, "unfiled");
  const entityId = folderSegment(input.entityId, "unassigned");
  const category = normalizeDocCategory(input.category);
  const ext = fileExtension(input.originalName);
  return `${entity}/${entityId}/${yyyy}/${mm}/${category}/${crypto.randomUUID()}.${ext}`;
}
