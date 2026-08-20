import { SITE } from "@/lib/web/site";

export type CompanyBrand = {
  name: string;
  tagline: string;
  phoneDisplay: string;
  phoneTel: string;
  whatsapp: string;
  email: string;
  address: string;
  rera: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  trn: string | null;
  vatRate: number;
  quotationPrefix: string;
  invoicePrefix: string;
};

export type CompanySettingsRow = {
  company_name: string | null;
  trn: string | null;
  rera_orn: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  logo_dark_url?: string | null;
  whatsapp?: string | null;
  tagline?: string | null;
  vat_rate?: number | null;
  quotation_prefix?: string | null;
  invoice_prefix?: string | null;
};

/** Digits only for tel: / WhatsApp links. */
export function toPhoneTel(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits || SITE.phoneTel;
}

export function toWhatsappDigits(value: string) {
  return value.replace(/\D/g, "") || SITE.whatsapp;
}

export function brandFromSettings(row: CompanySettingsRow | null | undefined): CompanyBrand {
  const phoneDisplay = row?.phone?.trim() || SITE.phoneDisplay;
  const whatsappRaw = row?.whatsapp?.trim() || toPhoneTel(phoneDisplay);

  return {
    name: row?.company_name?.trim() || SITE.name,
    tagline: row?.tagline?.trim() || SITE.tagline,
    phoneDisplay,
    phoneTel: toPhoneTel(phoneDisplay),
    whatsapp: toWhatsappDigits(whatsappRaw),
    email: row?.email?.trim() || SITE.email,
    address: row?.address?.trim() || SITE.address,
    rera: row?.rera_orn?.trim() || SITE.rera,
    logoUrl: row?.logo_url?.trim() || null,
    logoDarkUrl: row?.logo_dark_url?.trim() || row?.logo_url?.trim() || null,
    trn: row?.trn?.trim() || null,
    vatRate: row?.vat_rate ?? 5,
    quotationPrefix: row?.quotation_prefix?.trim() || "QT-",
    invoicePrefix: row?.invoice_prefix?.trim() || "INV-",
  };
}

export function waLinkFor(whatsapp: string, text?: string) {
  const base = `https://wa.me/${toWhatsappDigits(whatsapp)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export const DEFAULT_BRAND = brandFromSettings(null);
