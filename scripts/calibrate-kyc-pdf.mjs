/**
 * Extract text positions from a filled KYC PDF for calibration.
 * Usage: node scripts/calibrate-kyc-pdf.mjs [path-to.pdf]
 */
import fs from "fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const path = process.argv[2] ?? "public/KYC Form - Individual.pdf";
const data = new Uint8Array(fs.readFileSync(path));
const doc = await getDocument({ data, verbosity: 0 }).promise;

for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const content = await page.getTextContent();
  console.log(`\n--- ${path} page ${p} ---`);
  const items = content.items
    .filter((i) => i.str?.trim())
    .map((i) => ({
      str: i.str.trim(),
      x: Math.round(i.transform[4]),
      y: Math.round(i.transform[5]),
    }))
    .sort((a, b) => b.y - a.y || a.x - b.x);
  for (const e of items) console.log(`${e.x}\t${e.y}\t${e.str}`);
}
