import { normalizeDocCategory } from "@/lib/document-storage";

/** Document categories that satisfy ID file requirement. */
export const KYC_DOC_CATEGORIES = new Set(["emirates_id", "passport"]);

export type PersonKycFields = {
  nationality?: string | null;
  emirates_id?: string | null;
  passport_no?: string | null;
  trn?: string | null;
};

export type KycDocumentHint = {
  category?: string;
  name?: string;
  notes?: string | null;
};

export type KycStatus = "not_started" | "in_progress" | "complete";

/** Generated or uploaded KYC form PDF (name/notes contain "kyc"). */
export function hasKycFormDocument(documents?: KycDocumentHint[]): boolean {
  return (
    documents?.some((doc) => {
      const name = (doc.name ?? "").toLowerCase();
      const notes = (doc.notes ?? "").toLowerCase();
      return name.includes("kyc") || notes.includes("kyc");
    }) ?? false
  );
}

export function personKycReadiness(
  fields: PersonKycFields,
  documents?: KycDocumentHint[]
): { status: KycStatus; missing: string[] } {
  const missing: string[] = [];
  const hasText = !!(fields.emirates_id?.trim() || fields.passport_no?.trim());
  const hasIdFile =
    documents?.some((doc) => KYC_DOC_CATEGORIES.has(normalizeDocCategory(doc.category ?? ""))) ?? false;
  const hasForm = hasKycFormDocument(documents);

  if (!fields.nationality?.trim()) missing.push("Nationality");
  if (!hasText && !hasIdFile) missing.push("Emirates ID or passport (number or file)");
  if (!hasForm) missing.push("KYC form");

  let status: KycStatus = "not_started";
  if (hasText || hasIdFile || hasForm || fields.nationality?.trim() || fields.trn?.trim()) {
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
