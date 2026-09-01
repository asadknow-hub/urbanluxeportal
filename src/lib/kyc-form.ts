import { z } from "zod";

export const yesNoSpecifySchema = z.object({
  answer: z.enum(["yes", "no"]).nullable().optional(),
  specify: z.string().nullable().optional(),
});

export const individualKycFormSchema = z.object({
  date_of_birth: z.string().nullable().optional(),
  gender: z.enum(["male", "female"]).nullable().optional(),
  uae_residency: z.boolean().nullable().optional(),
  other_nationality: z.string().nullable().optional(),
  pep_self: yesNoSpecifySchema.optional(),
  pep_relative: yesNoSpecifySchema.optional(),
  pep_associate: yesNoSpecifySchema.optional(),
  sanctions: yesNoSpecifySchema.optional(),
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  area: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  building: z.string().nullable().optional(),
  flat: z.string().nullable().optional(),
  po_box: z.string().nullable().optional(),
  other_country_address: z.string().nullable().optional(),
  income_source: z.enum(["salary", "self_employed", "mortgage", "other"]).nullable().optional(),
  income_other: z.string().nullable().optional(),
  transfer_mode: z
    .enum(["bank_transfer", "cash", "cheque", "virtual_currency"])
    .nullable()
    .optional(),
  source_of_wealth: z.string().nullable().optional(),
  employed: z
    .object({
      employer_name: z.string().nullable().optional(),
      employer_country: z.string().nullable().optional(),
      designation: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
    })
    .optional(),
  self_employed: z
    .object({
      business_name: z.string().nullable().optional(),
      line_of_business: z.string().nullable().optional(),
      country: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
    })
    .optional(),
  form_signed_at: z.string().nullable().optional(),
});

export type YesNoSpecify = z.infer<typeof yesNoSpecifySchema>;
export type IndividualKycForm = z.infer<typeof individualKycFormSchema>;

export type KycPersonRecord = {
  name: string;
  email?: string | null;
  phone?: string | null;
  nationality?: string | null;
  emirates_id?: string | null;
  passport_no?: string | null;
  trn?: string | null;
  address?: string | null;
  kyc_form?: IndividualKycForm | null;
};

export function parseIndividualKycForm(value: unknown): IndividualKycForm {
  const parsed = individualKycFormSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : {};
}

export function emptyIndividualKycForm(): IndividualKycForm {
  return {};
}

export function kycFormHasData(form: IndividualKycForm): boolean {
  return JSON.stringify(form) !== "{}";
}

export function mergeKycPerson(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  nationality?: string | null;
  emirates_id?: string | null;
  passport_no?: string | null;
  trn?: string | null;
  address?: string | null;
  kyc_form?: unknown;
}): KycPersonRecord {
  return {
    name: input.name,
    email: input.email,
    phone: input.phone,
    nationality: input.nationality,
    emirates_id: input.emirates_id,
    passport_no: input.passport_no,
    trn: input.trn,
    address: input.address,
    kyc_form: parseIndividualKycForm(input.kyc_form),
  };
}
