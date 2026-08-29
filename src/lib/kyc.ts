import { normalizeDocCategory } from "@/lib/document-storage";

/** Document categories that satisfy KYC file requirement. */
export const KYC_DOC_CATEGORIES = new Set(["emirates_id", "passport"]);

export type PersonKycFields = {
  nationality?: string | null;
  emirates_id?: string | null;
  passport_no?: string | null;
  trn?: string | null;
};

export type KycStatus = "not_started" | "in_progress" | "complete";

export function personKycReadiness(
  fields: PersonKycFields,
  documents?: { category: string }[]
): { status: KycStatus; missing: string[] } {
  const missing: string[] = [];
  const hasText = !!(fields.emirates_id?.trim() || fields.passport_no?.trim());
  const hasFile =
    documents?.some((doc) => KYC_DOC_CATEGORIES.has(normalizeDocCategory(doc.category))) ?? false;

  if (!fields.nationality?.trim()) missing.push("Nationality");
  if (!hasText && !hasFile) missing.push("Emirates ID or passport (number or file)");

  let status: KycStatus = "not_started";
  if (hasText || hasFile || fields.nationality?.trim() || fields.trn?.trim()) {
    status = missing.length === 0 ? "complete" : "in_progress";
  }
  return { status, missing };
}

export function kycStatusLabel(status: KycStatus): string {
  switch (status) {
    case "complete":
      return "Complete";
    case "in_progress":
      return "In progress";
    default:
      return "Not started";
  }
}

export function kycStatusTone(status: KycStatus): "muted" | "amber" | "success" {
  switch (status) {
    case "complete":
      return "success";
    case "in_progress":
      return "amber";
    default:
      return "muted";
  }
}
