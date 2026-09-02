import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import type { IndividualKycForm, KycPersonRecord } from "@/lib/kyc-form";

const TEMPLATE_PATH = path.join(process.cwd(), "public", "KYC Form - Individual.pdf");
const FONT_SIZE = 8.5;
const INK = rgb(0.05, 0.12, 0.35);

type Point = { x: number; y: number };

/** Baseline offset from printed label to value/check row (A4 template, pdf.js coords). */
const DY = 17;
const DY_CHECK = 5;

function below(y: number, dy = DY): number {
  return Math.round((y - dy) * 10) / 10;
}

/**
 * Anchors from `public/KYC Form - Individual.pdf` (pdf.js text layer, Sep 2026).
 * Values sit on the underline row below each label group.
 */
const LABELS_P1 = {
  fullName: { x: 92, y: 715.4 },
  dob: { x: 112, y: 694.5 },
  passport: { x: 390, y: 694.5 },
  nationality: { x: 98, y: 672.5 },
  male: { x: 355, y: 671.3 },
  female: { x: 407, y: 671.3 },
  eid: { x: 102, y: 640.3 },
  uaeYes: { x: 443, y: 640.8 },
  uaeNo: { x: 483, y: 640.3 },
  otherNationality: { x: 38, y: 600 },
  pepSelfYes: { x: 238, y: 577.6 },
  pepSelfNo: { x: 520, y: 577.6 },
  pepSelfSpec: { x: 318, y: 577.6 },
  pepRelYes: { x: 238, y: 517.6 },
  pepRelNo: { x: 520, y: 517.6 },
  pepRelSpec: { x: 318, y: 517.6 },
  pepAssocYes: { x: 238, y: 468.3 },
  pepAssocNo: { x: 520, y: 468.3 },
  pepAssocSpec: { x: 318, y: 468.3 },
  sanctionsYes: { x: 238, y: 428.8 },
  sanctionsNo: { x: 520, y: 428.8 },
  sanctionsSpec: { x: 318, y: 428.8 },
  country: { x: 88, y: 322.1 },
  city: { x: 208, y: 322.1 },
  area: { x: 342, y: 322.1 },
  street: { x: 488, y: 322.1 },
  building: { x: 148, y: 292.1 },
  flat: { x: 403, y: 292.1 },
  poBox: { x: 503, y: 292.1 },
  email: { x: 118, y: 260.8 },
  phone: { x: 398, y: 260.8 },
  otherAddress: { x: 38, y: 237.7 },
  incomeSalary: { x: 136, y: 162.3 },
  incomeSelf: { x: 207, y: 161.9 },
  incomeMortgage: { x: 356, y: 161.9 },
  incomeOther: { x: 208, y: 133.1 },
  xferBank: { x: 151, y: 102.6 },
  xferCash: { x: 259, y: 102.6 },
  xferCheque: { x: 331, y: 102.6 },
  xferVirtual: { x: 442, y: 102.6 },
  wealth: { x: 38, y: 79.2 },
} as const;

const LABELS_P2 = {
  employerName: { x: 125, y: 690.2 },
  designation: { x: 385, y: 690.2 },
  employerCountry: { x: 125, y: 669.3 },
  employerAddress: { x: 355, y: 669.3 },
  businessName: { x: 125, y: 589.6 },
  lineOfBusiness: { x: 125, y: 568.9 },
  businessCountry: { x: 395, y: 605.1 },
  businessAddress: { x: 355, y: 584.5 },
  signedDate: { x: 345, y: 301.6 },
} as const;

function fieldAnchor(label: Point, opts?: { dy?: number; check?: boolean }): Point {
  const dy = opts?.dy ?? (opts?.check ? DY_CHECK : DY);
  return { x: label.x, y: below(label.y, dy) };
}

const P1 = {
  fullName: fieldAnchor(LABELS_P1.fullName),
  dob: fieldAnchor(LABELS_P1.dob),
  passport: fieldAnchor(LABELS_P1.passport),
  nationality: fieldAnchor(LABELS_P1.nationality),
  male: fieldAnchor(LABELS_P1.male, { check: true }),
  female: fieldAnchor(LABELS_P1.female, { check: true }),
  eid: fieldAnchor(LABELS_P1.eid),
  uaeYes: fieldAnchor(LABELS_P1.uaeYes, { check: true }),
  uaeNo: fieldAnchor(LABELS_P1.uaeNo, { check: true }),
  otherNationality: fieldAnchor(LABELS_P1.otherNationality, { dy: 14 }),
  pepSelfYes: fieldAnchor(LABELS_P1.pepSelfYes, { check: true }),
  pepSelfNo: fieldAnchor(LABELS_P1.pepSelfNo, { check: true }),
  pepSelfSpec: fieldAnchor(LABELS_P1.pepSelfSpec, { check: true }),
  pepRelYes: fieldAnchor(LABELS_P1.pepRelYes, { check: true }),
  pepRelNo: fieldAnchor(LABELS_P1.pepRelNo, { check: true }),
  pepRelSpec: fieldAnchor(LABELS_P1.pepRelSpec, { check: true }),
  pepAssocYes: fieldAnchor(LABELS_P1.pepAssocYes, { check: true }),
  pepAssocNo: fieldAnchor(LABELS_P1.pepAssocNo, { check: true }),
  pepAssocSpec: fieldAnchor(LABELS_P1.pepAssocSpec, { check: true }),
  sanctionsYes: fieldAnchor(LABELS_P1.sanctionsYes, { check: true }),
  sanctionsNo: fieldAnchor(LABELS_P1.sanctionsNo, { check: true }),
  sanctionsSpec: fieldAnchor(LABELS_P1.sanctionsSpec, { check: true }),
  country: fieldAnchor(LABELS_P1.country, { dy: 20 }),
  city: fieldAnchor(LABELS_P1.city, { dy: 20 }),
  area: fieldAnchor(LABELS_P1.area, { dy: 20 }),
  street: fieldAnchor(LABELS_P1.street, { dy: 20 }),
  building: fieldAnchor(LABELS_P1.building, { dy: 20 }),
  flat: fieldAnchor(LABELS_P1.flat, { dy: 20 }),
  poBox: fieldAnchor(LABELS_P1.poBox, { dy: 20 }),
  email: fieldAnchor(LABELS_P1.email, { dy: 20 }),
  phone: fieldAnchor(LABELS_P1.phone, { dy: 20 }),
  otherAddressY: fieldAnchor(LABELS_P1.otherAddress, { dy: 20 }).y,
  incomeSalary: fieldAnchor(LABELS_P1.incomeSalary, { check: true }),
  incomeSelf: fieldAnchor(LABELS_P1.incomeSelf, { check: true }),
  incomeMortgage: fieldAnchor(LABELS_P1.incomeMortgage, { check: true }),
  incomeOther: fieldAnchor(LABELS_P1.incomeOther, { dy: 15 }),
  xferBank: fieldAnchor(LABELS_P1.xferBank, { check: true }),
  xferCash: fieldAnchor(LABELS_P1.xferCash, { check: true }),
  xferCheque: fieldAnchor(LABELS_P1.xferCheque, { check: true }),
  xferVirtual: fieldAnchor(LABELS_P1.xferVirtual, { check: true }),
  wealthY: fieldAnchor(LABELS_P1.wealth, { dy: 12 }).y,
} as const;

const P2 = {
  employerName: fieldAnchor(LABELS_P2.employerName, { dy: 21 }),
  designation: fieldAnchor(LABELS_P2.designation, { dy: 21 }),
  employerCountry: fieldAnchor(LABELS_P2.employerCountry, { dy: 17 }),
  employerAddress: fieldAnchor(LABELS_P2.employerAddress, { dy: 17 }),
  businessName: fieldAnchor(LABELS_P2.businessName, { dy: 18 }),
  lineOfBusiness: fieldAnchor(LABELS_P2.lineOfBusiness, { dy: 17 }),
  businessCountry: fieldAnchor(LABELS_P2.businessCountry, { dy: 17 }),
  businessAddress: fieldAnchor(LABELS_P2.businessAddress, { dy: 17 }),
  signedDate: fieldAnchor(LABELS_P2.signedDate, { dy: 17 }),
} as const;

function drawText(page: PDFPage, font: PDFFont, text: string, at: Point, size = FONT_SIZE) {
  const value = text.trim();
  if (!value) return;
  page.drawText(value, { x: at.x, y: at.y, size, font, color: INK });
}

function drawMark(page: PDFPage, font: PDFFont, at: Point, active: boolean) {
  if (!active) return;
  page.drawText("X", { x: at.x, y: at.y, size: 9, font, color: INK });
}

function drawWrapped(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 10
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return;
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, FONT_SIZE);
    if (width > maxWidth && line) {
      page.drawText(line, { x, y: cursorY, size: FONT_SIZE, font, color: INK });
      line = word;
      cursorY -= lineHeight;
    } else {
      line = candidate;
    }
  }
  if (line) page.drawText(line, { x, y: cursorY, size: FONT_SIZE, font, color: INK });
}

function yesNo(form?: { answer?: "yes" | "no" | null; specify?: string | null }) {
  return {
    yes: form?.answer === "yes",
    no: form?.answer === "no",
    specify: form?.specify ?? "",
  };
}

export async function generateIndividualKycPdf(person: KycPersonRecord): Promise<Uint8Array> {
  const templateBytes = fs.readFileSync(TEMPLATE_PATH);
  const pdf = await PDFDocument.load(templateBytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const form = person.kyc_form ?? {};

  const [page1, page2] = pdf.getPages();

  drawText(page1, font, person.name, P1.fullName);
  drawText(page1, font, form.date_of_birth ?? "", P1.dob);
  drawText(page1, font, person.passport_no ?? "", P1.passport);
  drawText(page1, font, person.nationality ?? "", P1.nationality);
  drawMark(page1, font, P1.male, form.gender === "male");
  drawMark(page1, font, P1.female, form.gender === "female");
  drawText(page1, font, person.emirates_id ?? "", P1.eid);
  drawMark(page1, font, P1.uaeYes, form.uae_residency === true);
  drawMark(page1, font, P1.uaeNo, form.uae_residency === false);
  drawText(page1, font, form.other_nationality ?? "", P1.otherNationality);

  const pepSelf = yesNo(form.pep_self);
  drawMark(page1, font, P1.pepSelfYes, pepSelf.yes);
  drawMark(page1, font, P1.pepSelfNo, pepSelf.no);
  drawText(page1, font, pepSelf.specify, P1.pepSelfSpec);

  const pepRelative = yesNo(form.pep_relative);
  drawMark(page1, font, P1.pepRelYes, pepRelative.yes);
  drawMark(page1, font, P1.pepRelNo, pepRelative.no);
  drawText(page1, font, pepRelative.specify, P1.pepRelSpec);

  const pepAssociate = yesNo(form.pep_associate);
  drawMark(page1, font, P1.pepAssocYes, pepAssociate.yes);
  drawMark(page1, font, P1.pepAssocNo, pepAssociate.no);
  drawText(page1, font, pepAssociate.specify, P1.pepAssocSpec);

  const sanctions = yesNo(form.sanctions);
  drawMark(page1, font, P1.sanctionsYes, sanctions.yes);
  drawMark(page1, font, P1.sanctionsNo, sanctions.no);
  drawText(page1, font, sanctions.specify, P1.sanctionsSpec);

  drawText(page1, font, form.country ?? "", P1.country);
  drawText(page1, font, form.city ?? "", P1.city);
  drawText(page1, font, form.area ?? "", P1.area);
  drawText(page1, font, form.street ?? "", P1.street);
  drawText(page1, font, form.building ?? "", P1.building);
  drawText(page1, font, form.flat ?? "", P1.flat);
  drawText(page1, font, form.po_box ?? "", P1.poBox);
  drawText(page1, font, person.email ?? "", P1.email);
  drawText(page1, font, person.phone ?? "", P1.phone);
  drawWrapped(page1, font, form.other_country_address ?? person.address ?? "", 38, P1.otherAddressY, 520);

  drawMark(page1, font, P1.incomeSalary, form.income_source === "salary");
  drawMark(page1, font, P1.incomeSelf, form.income_source === "self_employed");
  drawMark(page1, font, P1.incomeMortgage, form.income_source === "mortgage");
  drawText(page1, font, form.income_other ?? "", P1.incomeOther);
  drawMark(page1, font, P1.xferBank, form.transfer_mode === "bank_transfer");
  drawMark(page1, font, P1.xferCash, form.transfer_mode === "cash");
  drawMark(page1, font, P1.xferCheque, form.transfer_mode === "cheque");
  drawMark(page1, font, P1.xferVirtual, form.transfer_mode === "virtual_currency");
  drawWrapped(page1, font, form.source_of_wealth ?? "", 38, P1.wealthY, 520);

  const employed = form.employed ?? {};
  drawText(page2, font, employed.employer_name ?? "", P2.employerName);
  drawText(page2, font, employed.employer_country ?? "", P2.employerCountry);
  drawText(page2, font, employed.designation ?? "", P2.designation);
  drawText(page2, font, employed.address ?? "", P2.employerAddress);

  const selfEmployed = form.self_employed ?? {};
  drawText(page2, font, selfEmployed.business_name ?? "", P2.businessName);
  drawText(page2, font, selfEmployed.line_of_business ?? "", P2.lineOfBusiness);
  drawText(page2, font, selfEmployed.country ?? "", P2.businessCountry);
  drawText(page2, font, selfEmployed.address ?? "", P2.businessAddress);

  const signedAt = form.form_signed_at ?? new Date().toISOString().slice(0, 10);
  drawText(page2, font, signedAt, P2.signedDate);

  return pdf.save();
}

export function kycPdfFileName(personName: string): string {
  const safe = personName
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return `KYC-${safe || "Individual"}.pdf`;
}

/** Exported for calibration scripts — computed overlay points. */
export const KYC_PDF_LAYOUT = { P1, P2, LABELS_P1, LABELS_P2 } as const;
