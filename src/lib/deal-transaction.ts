/** Property, payment, and KYC fields tracked on deals until finalized. */

export type DealPaymentScheduleEntry = {
  label: string;
  amount_fils: number;
  due_date?: string | null;
  status?: "pending" | "received" | "overdue";
};

export type DealPropertySnapshot = {
  bedrooms?: string | null;
  size_sqft?: number | null;
  furnishing?: string | null;
  notes?: string | null;
};

export type DealTransactionInput = {
  ejari_no?: string | null;
  property_title?: string | null;
  property_community?: string | null;
  property_building?: string | null;
  property_unit?: string | null;
  property_ref?: string | null;
  property_type?: string | null;
  property_snapshot?: DealPropertySnapshot | null;
  payment_method?: string | null;
  payment_deposit?: number | null;
  payment_balance?: number | null;
  payment_schedule?: DealPaymentScheduleEntry[] | null;
  payment_notes?: string | null;
  kyc_nationality?: string | null;
  kyc_emirates_id?: string | null;
  kyc_passport_no?: string | null;
  kyc_trn?: string | null;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  buyer_email?: string | null;
};

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "mortgage", label: "Mortgage" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "crypto", label: "Crypto" },
  { value: "mixed", label: "Mixed" },
] as const;

export function formatPropertyLine(input: {
  property_title?: string | null;
  property_community?: string | null;
  property_building?: string | null;
  property_unit?: string | null;
}): string {
  const parts = [
    input.property_title,
    input.property_building,
    input.property_unit,
    input.property_community,
  ].filter(Boolean);
  return parts.join(" · ") || "No property set";
}

import { normalizeDocCategory } from "@/lib/document-storage";
import { KYC_DOC_CATEGORIES } from "@/lib/kyc";

export { KYC_DOC_CATEGORIES };

export function dealReadyToFinalize(
  deal: {
    property_title?: string | null;
    buyer_name?: string | null;
    kyc_emirates_id?: string | null;
    kyc_passport_no?: string | null;
  },
  documents?: { category: string }[]
): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!deal.property_title?.trim()) missing.push("Property");
  if (!deal.buyer_name?.trim()) missing.push("Buyer name");

  const hasKycText = !!(deal.kyc_emirates_id?.trim() || deal.kyc_passport_no?.trim());
  const hasKycFile =
    documents?.some((doc) => KYC_DOC_CATEGORIES.has(normalizeDocCategory(doc.category))) ?? false;

  if (!hasKycText && !hasKycFile) {
    missing.push("KYC (Emirates ID or passport — file or number)");
  }

  return { ok: missing.length === 0, missing };
}
