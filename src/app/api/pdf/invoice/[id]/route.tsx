import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { PdfDocument, fetchDocData } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createSupabaseServiceClient();

  const data = await fetchDocData(supabase, "invoices", id);
  if (!data) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const pdf = await PdfDocument({ title: "TAX INVOICE", data });
  const stream = await renderToStream(pdf);

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set("Content-Disposition", `inline; filename="${data.docNo}.pdf"`);

  return new NextResponse(stream as unknown as ReadableStream, { headers });
}
