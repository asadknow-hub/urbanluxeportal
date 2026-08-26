import { slugifyOptionValue } from "@/lib/lead-field-options";

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

export type DocCategoryValue = string;

export function normalizeDocCategory(value: string | null | undefined): string {
  return slugifyOptionValue(value ?? "") || "other";
}

export function formatDocCategory(value: string) {
  const special: Record<string, string> = {
    noc: "N.O.C.",
    emirates_id: "Emirates ID",
    title_deed: "Title deed",
    tenancy_contract: "Tenancy contract",
    cheque_copy: "Cheque copy",
    mou: "MOU",
    brn: "BRN",
  };
  if (special[value]) return special[value];
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

/** True when an object key is under this entity’s folder. */
export function documentPathBelongsTo(
  storagePath: string,
  entityType?: string | null,
  entityId?: string | null
) {
  const [typeSeg, idSeg] = storagePath.split("/");
  return typeSeg === folderSegment(entityType, "unfiled") && idSeg === folderSegment(entityId, "unassigned");
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
