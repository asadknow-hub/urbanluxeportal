import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import type { IndividualKycForm, KycPersonRecord } from "@/lib/kyc-form";

const TEMPLATE_PATH = path.join(process.cwd(), "public", "KYC Form - Individual.pdf");
const FONT_SIZE = 8.5;
const INK = rgb(0.05, 0.12, 0.35);

type Point = { x: number; y: number };

/** Calibrated against the Urban Luxe individual KYC PDF (A4, pdf.js text positions). */
const P1 = {
  fullName: { x: 92, y: 698 },
  dob: { x: 112, y: 678 },
  passport: { x: 390, y: 678 },
  nationality: { x: 98, y: 655 },
  male: { x: 347, y: 666 },
  female: { x: 399, y: 666 },
  eid: { x: 102, y: 623 },
  uaeYes: { x: 433, y: 636 },
  uaeNo: { x: 474, y: 636 },
  otherNationality: { x: 38, y: 582 },
  pepSelfYes: { x: 238, y: 600 },
  pepSelfNo: { x: 520, y: 600 },
  pepSelfSpec: { x: 310, y: 600 },
  pepRelYes: { x: 238, y: 573 },
  pepRelNo: { x: 520, y: 573 },
  pepRelSpec: { x: 310, y: 573 },
  pepAssocYes: { x: 238, y: 513 },
  pepAssocNo: { x: 520, y: 513 },
  pepAssocSpec: { x: 310, y: 513 },
  sanctionsYes: { x: 238, y: 474 },
  sanctionsNo: { x: 520, y: 474 },
  sanctionsSpec: { x: 310, y: 474 },
  country: { x: 88, y: 302 },
  city: { x: 208, y: 302 },
  area: { x: 342, y: 302 },
  street: { x: 488, y: 302 },
  building: { x: 148, y: 272 },
  flat: { x: 403, y: 272 },
  poBox: { x: 503, y: 272 },
  email: { x: 118, y: 241 },
  phone: { x: 398, y: 241 },
  otherAddressY: 210,
  incomeSalary: { x: 140, y: 148 },
  incomeSelf: { x: 211, y: 148 },
  incomeMortgage: { x: 360, y: 148 },
  incomeOther: { x: 208, y: 119 },
  xferBank: { x: 155, y: 88 },
  xferCash: { x: 263, y: 88 },
  xferCheque: { x: 335, y: 88 },
  xferVirtual: { x: 446, y: 88 },
  wealthY: 58,
} as const;

const P2 = {
  employerName: { x: 125, y: 669 },
  employerCountry: { x: 195, y: 648 },
  designation: { x: 385, y: 669 },
  employerAddress: { x: 355, y: 648 },
  businessName: { x: 125, y: 569 },
  lineOfBusiness: { x: 125, y: 548 },
  businessCountry: { x: 395, y: 582 },
  businessAddress: { x: 355, y: 561 },
  signedDate: { x: 345, y: 284 },
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
