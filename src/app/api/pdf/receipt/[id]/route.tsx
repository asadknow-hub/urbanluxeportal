import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#10B981",
  },
  companyName: { fontSize: 18, fontWeight: "bold", color: "#0F172A", marginBottom: 4 },
  companyDetail: { fontSize: 9, color: "#64748B", marginBottom: 2 },
  title: { fontSize: 20, fontWeight: "bold", color: "#0F172A", textAlign: "right" },
  meta: { fontSize: 9, color: "#64748B", textAlign: "right", marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", color: "#0F172A", marginBottom: 6, textTransform: "uppercase" },
  text: { fontSize: 10, color: "#334155", marginBottom: 2 },
  amountBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#F0FDF4",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  amountLabel: { fontSize: 10, color: "#64748B", marginBottom: 4 },
  amountValue: { fontSize: 24, fontWeight: "bold", color: "#10B981" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontSize: 10, color: "#64748B" },
  value: { fontSize: 10, color: "#334155" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 8,
    color: "#94A3B8",
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createSupabaseServiceClient();

  const { data: payment, error } = await supabase
    .from("payments")
    .select(
      `*,
      customer:customers(id, name, phone, email),
      invoice:invoices(id, invoice_no, total, amount_paid)
      `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const { data: company } = await supabase
    .from("company_settings")
    .select("name, trn, phone, email, address")
    .single();

  const customer = Array.isArray(payment.customer) ? payment.customer[0] : payment.customer;
  const invoice = Array.isArray(payment.invoice) ? payment.invoice[0] : payment.invoice;

  const receiptNo = `RCP-${payment.id.slice(0, 8).toUpperCase()}`;

  const pdf = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{company?.name ?? "Urban Luxe"}</Text>
            {company?.address && <Text style={styles.companyDetail}>{company.address}</Text>}
            {company?.phone && <Text style={styles.companyDetail}>Tel: {company.phone}</Text>}
            {company?.email && <Text style={styles.companyDetail}>{company.email}</Text>}
            {company?.trn && <Text style={styles.companyDetail}>TRN: {company.trn}</Text>}
          </View>
          <View>
            <Text style={styles.title}>PAYMENT RECEIPT</Text>
            <Text style={styles.meta}>{receiptNo}</Text>
            <Text style={styles.meta}>{formatDate(payment.received_date)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Received From</Text>
          <Text style={styles.text}>{customer?.name ?? "—"}</Text>
          {customer?.phone && <Text style={styles.text}>Tel: {customer.phone}</Text>}
          {customer?.email && <Text style={styles.text}>Email: {customer.email}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Invoice No</Text>
            <Text style={styles.value}>{invoice?.invoice_no ?? "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Method</Text>
            <Text style={styles.value}>{payment.method.replace(/_/g, " ")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reference</Text>
            <Text style={styles.value}>{payment.reference ?? "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date Received</Text>
            <Text style={styles.value}>{formatDate(payment.received_date)}</Text>
          </View>
        </View>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Amount Received</Text>
          <Text style={styles.amountValue}>{formatAED(payment.amount, { decimals: 2 })}</Text>
        </View>

        {payment.notes && (
          <View style={{ marginTop: 20, padding: 10, backgroundColor: "#F8FAFC", borderRadius: 4 }}>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: "#475569", marginBottom: 4 }}>Notes</Text>
            <Text style={{ fontSize: 9, color: "#64748B" }}>{payment.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>This is a computer-generated receipt and does not require a signature.</Text>
        </View>
      </Page>
    </Document>
  );

  const stream = await renderToStream(pdf);

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set("Content-Disposition", `inline; filename="${receiptNo}.pdf"`);

  return new NextResponse(stream as unknown as ReadableStream, { headers });
}
