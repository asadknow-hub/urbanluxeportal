import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { getStatusColor } from "@/lib/status-colors";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const { id } = await params;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      `*,
      customer:customers(id, name, phone, email)
      `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !invoice) notFound();

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("sort_order", { ascending: true });

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("invoice_id", id)
    .is("deleted_at", null)
    .order("received_date", { ascending: false });

  const colors = getStatusColor(invoice.status);
  const customer = Array.isArray(invoice.customer) ? invoice.customer[0] : invoice.customer;
  const balance = invoice.total - invoice.amount_paid;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{invoice.invoice_no}</h1>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}>
              {invoice.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Issued {formatDate(invoice.issue_date)} · Due {formatDate(invoice.due_date)}
          </p>
        </div>
        <Link href="/invoices" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to Invoices
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Line items */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Line Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    <th className="pb-2 pr-4">Description</th>
                    <th className="pb-2 pr-4 text-right">Qty</th>
                    <th className="pb-2 pr-4 text-right">Unit Price</th>
                    <th className="pb-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-4 text-slate-700">{item.description}</td>
                      <td className="py-3 pr-4 text-right text-slate-600">{item.qty}</td>
                      <td className="py-3 pr-4 text-right text-slate-600">{formatAED(item.unit_price)}</td>
                      <td className="py-3 text-right font-medium text-slate-700">{formatAED(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-700">{formatAED(invoice.subtotal)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-medium text-red-600">-{formatAED(invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">VAT (5%)</span>
                <span className="font-medium text-slate-700">{formatAED(invoice.vat_amount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-700">Total</span>
                <span className="font-bold text-slate-900">{formatAED(invoice.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-600">Paid</span>
                <span className="font-medium text-emerald-600">{formatAED(invoice.amount_paid)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-700">Balance Due</span>
                <span className={`font-bold ${balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatAED(balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment history */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">
              Payment History ({payments?.length ?? 0})
            </h2>
            <div className="space-y-2">
              {(payments ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">No payments recorded yet.</p>
              ) : (
                (payments ?? []).map((pay) => (
                  <div
                    key={pay.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{formatAED(pay.amount)}</p>
                      <p className="text-xs text-slate-400">
                        {formatDate(pay.received_date)} · {pay.method}
                        {pay.reference && ` · Ref: ${pay.reference}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Customer + Actions */}
        <div className="space-y-6">
          {customer && (
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Customer</h2>
              <Link
                href={`/customers/${customer.id}`}
                className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
              >
                <p className="font-medium text-slate-900">{customer.name}</p>
                {customer.phone && <p className="text-xs text-slate-500 mt-1">{customer.phone}</p>}
                {customer.email && <p className="text-xs text-slate-500">{customer.email}</p>}
              </Link>
            </div>
          )}

          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Actions</h2>
            <InvoiceActions
              invoiceId={invoice.id}
              customerId={customer?.id ?? ""}
              status={invoice.status}
              balance={balance}
              userRole={user.role}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
