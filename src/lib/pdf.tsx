import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

// Register a clean font (uses built-in Helvetica)
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
});

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 50,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#10B981",
  },
  companyInfo: {
    maxWidth: "60%",
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    color: "#64748B",
    marginBottom: 2,
  },
  docTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F172A",
    textAlign: "right",
  },
  docMeta: {
    fontSize: 9,
    color: "#64748B",
    textAlign: "right",
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  text: {
    fontSize: 10,
    color: "#334155",
    marginBottom: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    paddingBottom: 6,
    paddingTop: 6,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 6,
    paddingTop: 6,
  },
  tableCell: {
    fontSize: 10,
    color: "#334155",
  },
  colDescription: { width: "45%" },
  colQty: { width: "10%", textAlign: "center" },
  colPrice: { width: "20%", textAlign: "right" },
  colTotal: { width: "25%", textAlign: "right" },
  totalsSection: {
    marginTop: 20,
    marginLeft: "auto",
    width: "45%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: "#64748B",
  },
  totalValue: {
    fontSize: 10,
    color: "#334155",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 2,
    borderTopColor: "#10B981",
    paddingTop: 8,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0F172A",
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0F172A",
  },
  notes: {
    marginTop: 30,
    padding: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#475569",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#64748B",
  },
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

export type CompanyInfo = {
  name: string;
  trn: string | null;
  rera_orn: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  vat_rate: number | null;
};

export type CustomerInfo = {
  name: string;
  phone: string | null;
  email: string | null;
  trn: string | null;
};

export type LineItem = {
  description: string;
  qty: number;
  unit_price: number;
  line_total: number;
};

export type DocData = {
  docNo: string;
  issueDate: string;
  dueDate?: string | null;
  validUntil?: string | null;
  status: string;
  subtotal: number;
  discount: number;
  vatAmount: number;
  total: number;
  amountPaid?: number;
  balance?: number;
  items: LineItem[];
  notes?: string | null;
  terms?: string | null;
  company: CompanyInfo;
  customer: CustomerInfo;
};

export function PdfDocument({
  title,
  data,
}: {
  title: string;
  data: DocData;
}) {
  const vatRate = data.company.vat_rate ?? 5;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <View style={pdfStyles.companyInfo}>
            <Text style={pdfStyles.companyName}>{data.company.name}</Text>
            {data.company.address && (
              <Text style={pdfStyles.companyDetail}>{data.company.address}</Text>
            )}
            {data.company.phone && (
              <Text style={pdfStyles.companyDetail}>Tel: {data.company.phone}</Text>
            )}
            {data.company.email && (
              <Text style={pdfStyles.companyDetail}>{data.company.email}</Text>
            )}
            {data.company.trn && (
              <Text style={pdfStyles.companyDetail}>TRN: {data.company.trn}</Text>
            )}
            {data.company.rera_orn && (
              <Text style={pdfStyles.companyDetail}>RERA ORN: {data.company.rera_orn}</Text>
            )}
          </View>
          <View>
            <Text style={pdfStyles.docTitle}>{title}</Text>
            <Text style={pdfStyles.docMeta}>{data.docNo}</Text>
            <Text style={pdfStyles.docMeta}>
              Date: {formatDate(data.issueDate)}
            </Text>
            {data.dueDate && (
              <Text style={pdfStyles.docMeta}>Due: {formatDate(data.dueDate)}</Text>
            )}
            {data.validUntil && (
              <Text style={pdfStyles.docMeta}>Valid Until: {formatDate(data.validUntil)}</Text>
            )}
            <Text style={pdfStyles.docMeta}>Status: {data.status}</Text>
          </View>
        </View>

        {/* Bill To */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Bill To</Text>
          <Text style={pdfStyles.text}>{data.customer.name}</Text>
          {data.customer.phone && (
            <Text style={pdfStyles.text}>Tel: {data.customer.phone}</Text>
          )}
          {data.customer.email && (
            <Text style={pdfStyles.text}>Email: {data.customer.email}</Text>
          )}
          {data.customer.trn && (
            <Text style={pdfStyles.text}>TRN: {data.customer.trn}</Text>
          )}
        </View>

        {/* Items table */}
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colDescription]}>Description</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colQty]}>Qty</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colPrice]}>Unit Price</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colTotal]}>Total</Text>
          </View>
          {data.items.map((item, idx) => (
            <View key={idx} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, pdfStyles.colDescription]}>{item.description}</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.colQty]}>{item.qty}</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.colPrice]}>{formatAED(item.unit_price, { decimals: 2 })}</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.colTotal]}>{formatAED(item.line_total, { decimals: 2 })}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={pdfStyles.totalsSection}>
          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>Subtotal</Text>
            <Text style={pdfStyles.totalValue}>{formatAED(data.subtotal, { decimals: 2 })}</Text>
          </View>
          {data.discount > 0 && (
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.totalLabel}>Discount</Text>
              <Text style={pdfStyles.totalValue}>-{formatAED(data.discount, { decimals: 2 })}</Text>
            </View>
          )}
          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>VAT ({vatRate}%)</Text>
            <Text style={pdfStyles.totalValue}>{formatAED(data.vatAmount, { decimals: 2 })}</Text>
          </View>
          <View style={pdfStyles.grandTotalRow}>
            <Text style={pdfStyles.grandTotalLabel}>Total</Text>
            <Text style={pdfStyles.grandTotalValue}>{formatAED(data.total, { decimals: 2 })}</Text>
          </View>
          {data.amountPaid !== undefined && data.balance !== undefined && (
            <>
              <View style={[pdfStyles.totalRow, { marginTop: 6 }]}>
                <Text style={pdfStyles.totalLabel}>Paid</Text>
                <Text style={[pdfStyles.totalValue, { color: "#10B981" }]}>
                  {formatAED(data.amountPaid, { decimals: 2 })}
                </Text>
              </View>
              <View style={pdfStyles.grandTotalRow}>
                <Text style={pdfStyles.grandTotalLabel}>Balance Due</Text>
                <Text style={[pdfStyles.grandTotalValue, { color: data.balance > 0 ? "#EF4444" : "#10B981" }]}>
                  {formatAED(data.balance, { decimals: 2 })}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Notes */}
        {(data.notes || data.terms) && (
          <View style={pdfStyles.notes}>
            {data.notes && (
              <>
                <Text style={pdfStyles.notesTitle}>Notes</Text>
                <Text style={pdfStyles.notesText}>{data.notes}</Text>
              </>
            )}
            {data.terms && (
              <>
                <Text style={[pdfStyles.notesTitle, { marginTop: 6 }]}>Terms &amp; Conditions</Text>
                <Text style={pdfStyles.notesText}>{data.terms}</Text>
              </>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={pdfStyles.footer}>
          <Text>
            {data.company.name} · {data.company.trn ? `TRN ${data.company.trn}` : ""} · This is a computer-generated document.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function fetchDocData(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  table: "quotations" | "invoices",
  id: string
): Promise<DocData | null> {
  const { data: doc, error } = await supabase
    .from(table)
    .select(
      `*,
      customer:customers(id, name, phone, email, trn)
      `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !doc) return null;

  const itemsTable = table === "quotations" ? "quotation_items" : "invoice_items";
  const fk = table === "quotations" ? "quotation_id" : "invoice_id";

  const { data: items } = await supabase
    .from(itemsTable)
    .select("description, qty, unit_price, line_total")
    .eq(fk, id)
    .order("sort_order", { ascending: true });

  const { data: company } = await supabase
    .from("company_settings")
    .select("name, trn, rera_orn, phone, email, address, vat_rate")
    .single();

  const customer = Array.isArray(doc.customer) ? doc.customer[0] : doc.customer;

  return {
    docNo: table === "quotations" ? doc.quote_no : doc.invoice_no,
    issueDate: doc.issue_date,
    dueDate: doc.due_date ?? null,
    validUntil: doc.valid_until ?? null,
    status: doc.status,
    subtotal: doc.subtotal,
    discount: doc.discount,
    vatAmount: doc.vat_amount,
    total: doc.total,
    amountPaid: table === "invoices" ? doc.amount_paid : undefined,
    balance: table === "invoices" ? doc.total - doc.amount_paid : undefined,
    items: (items ?? []).map((i: any) => ({
      description: i.description,
      qty: i.qty,
      unit_price: i.unit_price,
      line_total: i.line_total,
    })),
    notes: doc.notes,
    terms: doc.terms,
    company: {
      name: company?.name ?? "Urban Luxe",
      trn: company?.trn ?? null,
      rera_orn: company?.rera_orn ?? null,
      phone: company?.phone ?? null,
      email: company?.email ?? null,
      address: company?.address ?? null,
      vat_rate: company?.vat_rate ?? 5,
    },
    customer: {
      name: customer?.name ?? "—",
      phone: customer?.phone ?? null,
      email: customer?.email ?? null,
      trn: customer?.trn ?? null,
    },
  };
}
