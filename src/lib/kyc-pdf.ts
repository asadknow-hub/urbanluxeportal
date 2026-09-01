import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import type { IndividualKycForm, KycPersonRecord } from "@/lib/kyc-form";

const TEMPLATE_PATH = path.join(process.cwd(), "public", "KYC Form - Individual.pdf");
const FONT_SIZE = 9;
const INK = rgb(0.05, 0.12, 0.35);

type Point = { x: number; y: number };

function drawText(page: PDFPage, font: PDFFont, text: string, at: Point, size = FONT_SIZE) {
  const value = text.trim();
  if (!value) return;
  page.drawText(value, { x: at.x, y: at.y, size, font, color: INK });
}

function drawMark(page: PDFPage, font: PDFFont, at: Point, active: boolean) {
  if (!active) return;
  page.drawText("X", { x: at.x, y: at.y, size: 10, font, color: INK });
}

function drawWrapped(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 11
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

  // Page 1 — customer details
  drawText(page1, font, person.name, { x: 88, y: 704 });
  drawText(page1, font, form.date_of_birth ?? "", { x: 108, y: 684 });
  drawText(page1, font, person.passport_no ?? "", { x: 388, y: 684 });
  drawText(page1, font, person.nationality ?? "", { x: 95, y: 661 });
  drawMark(page1, font, { x: 365, y: 668 }, form.gender === "male");
  drawMark(page1, font, { x: 417, y: 668 }, form.gender === "female");
  drawText(page1, font, person.emirates_id ?? "", { x: 100, y: 629 });
  drawMark(page1, font, { x: 448, y: 629 }, form.uae_residency === true);
  drawMark(page1, font, { x: 489, y: 629 }, form.uae_residency === false);
  drawText(page1, font, form.other_nationality ?? "", { x: 36, y: 587 });

  const pepSelf = yesNo(form.pep_self);
  drawMark(page1, font, { x: 250, y: 596 }, pepSelf.yes);
  drawMark(page1, font, { x: 531, y: 596 }, pepSelf.no);
  drawText(page1, font, pepSelf.specify, { x: 325, y: 596 });

  const pepRelative = yesNo(form.pep_relative);
  drawMark(page1, font, { x: 250, y: 509 }, pepRelative.yes);
  drawMark(page1, font, { x: 531, y: 509 }, pepRelative.no);
  drawText(page1, font, pepRelative.specify, { x: 325, y: 509 });

  const pepAssociate = yesNo(form.pep_associate);
  drawMark(page1, font, { x: 250, y: 459 }, pepAssociate.yes);
  drawMark(page1, font, { x: 531, y: 459 }, pepAssociate.no);
  drawText(page1, font, pepAssociate.specify, { x: 325, y: 459 });

  const sanctions = yesNo(form.sanctions);
  drawMark(page1, font, { x: 250, y: 420 }, sanctions.yes);
  drawMark(page1, font, { x: 531, y: 420 }, sanctions.no);
  drawText(page1, font, sanctions.specify, { x: 325, y: 420 });

  // Address & contact
  drawText(page1, font, form.country ?? "", { x: 85, y: 310 });
  drawText(page1, font, form.city ?? "", { x: 205, y: 310 });
  drawText(page1, font, form.area ?? "", { x: 340, y: 310 });
  drawText(page1, font, form.street ?? "", { x: 485, y: 310 });
  drawText(page1, font, form.building ?? "", { x: 145, y: 280 });
  drawText(page1, font, form.flat ?? "", { x: 400, y: 280 });
  drawText(page1, font, form.po_box ?? "", { x: 500, y: 280 });
  drawText(page1, font, person.email ?? "", { x: 115, y: 249 });
  drawText(page1, font, person.phone ?? "", { x: 395, y: 249 });
  drawWrapped(
    page1,
    font,
    form.other_country_address ?? person.address ?? "",
    36,
    218,
    520
  );

  // Financial
  drawMark(page1, font, { x: 153, y: 158 }, form.income_source === "salary");
  drawMark(page1, font, { x: 224, y: 158 }, form.income_source === "self_employed");
  drawMark(page1, font, { x: 373, y: 158 }, form.income_source === "mortgage");
  drawText(page1, font, form.income_other ?? "", { x: 205, y: 127 });
  drawMark(page1, font, { x: 168, y: 98 }, form.transfer_mode === "bank_transfer");
  drawMark(page1, font, { x: 276, y: 98 }, form.transfer_mode === "cash");
  drawMark(page1, font, { x: 348, y: 98 }, form.transfer_mode === "cheque");
  drawMark(page1, font, { x: 459, y: 98 }, form.transfer_mode === "virtual_currency");
  drawWrapped(page1, font, form.source_of_wealth ?? "", 36, 66, 520);

  // Page 2 — employment
  const employed = form.employed ?? {};
  drawText(page2, font, employed.employer_name ?? "", { x: 125, y: 677 });
  drawText(page2, font, employed.employer_country ?? "", { x: 195, y: 656 });
  drawText(page2, font, employed.designation ?? "", { x: 385, y: 677 });
  drawText(page2, font, employed.address ?? "", { x: 355, y: 656 });

  const selfEmployed = form.self_employed ?? {};
  drawText(page2, font, selfEmployed.business_name ?? "", { x: 125, y: 577 });
  drawText(page2, font, selfEmployed.line_of_business ?? "", { x: 125, y: 556 });
  drawText(page2, font, selfEmployed.country ?? "", { x: 395, y: 590 });
  drawText(page2, font, selfEmployed.address ?? "", { x: 355, y: 569 });

  const signedAt = form.form_signed_at ?? new Date().toISOString().slice(0, 10);
  drawText(page2, font, signedAt, { x: 345, y: 292 });

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
