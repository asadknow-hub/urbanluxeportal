import { loadKycPerson } from "@/server/kyc";
import { generateIndividualKycPdf, kycPdfFileName } from "@/lib/kyc-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const loaded = await loadKycPerson(id);
  if (!loaded.ok || !loaded.data) {
    return new Response(loaded.error ?? "Not found", { status: loaded.error === "Unauthorized" ? 401 : 404 });
  }

  const pdfBytes = await generateIndividualKycPdf(loaded.data);
  const fileName = kycPdfFileName(loaded.data.name);

  return new Response(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
