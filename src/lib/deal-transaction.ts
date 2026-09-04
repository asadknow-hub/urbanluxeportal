/** Property, payment, and KYC fields tracked on deals until finalized. */

import { hasKycFormDocument, personKycReadiness, type KycDocumentHint } from "@/lib/kyc";

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

export { KYC_DOC_CATEGORIES } from "@/lib/kyc";

/** Optional person/customer fallbacks — same fields the client panel shows. */
export type DealFinalizePerson = {
  name?: string | null;
  nationality?: string | null;
  emirates_id?: string | null;
  passport_no?: string | null;
  trn?: string | null;
};

/**
 * Close readiness: confirmed inventory link + buyer + full person KYC (nationality, ID, form).
 * Person fallbacks match the deal detail client panel.
 */
export function dealReadyToFinalize(
  deal: {
    property_id?: string | null;
    property_title?: string | null;
    buyer_name?: string | null;
    kyc_nationality?: string | null;
    kyc_emirates_id?: string | null;
    kyc_passport_no?: string | null;
    kyc_trn?: string | null;
  },
  documents?: KycDocumentHint[],
  person?: DealFinalizePerson | null
): { ok: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!deal.property_id?.trim()) {
    missing.push("Confirmed inventory property");
  }

  const buyer = deal.buyer_name?.trim() || person?.name?.trim();
  if (!buyer) missing.push("Buyer name");

  const kyc = personKycReadiness(
    {
      nationality: deal.kyc_nationality?.trim() || person?.nationality?.trim() || null,
      emirates_id: deal.kyc_emirates_id?.trim() || person?.emirates_id?.trim() || null,
      passport_no: deal.kyc_passport_no?.trim() || person?.passport_no?.trim() || null,
      trn: deal.kyc_trn?.trim() || person?.trn?.trim() || null,
    },
    documents
  );
  for (const item of kyc.missing) {
    if (!missing.includes(item)) missing.push(item);
  }

  // Defensive: ensure form check stays explicit if personKycReadiness changes.
  if (!hasKycFormDocument(documents) && !missing.includes("KYC form")) {
    missing.push("KYC form");
  }

  return { ok: missing.length === 0, missing };
}
