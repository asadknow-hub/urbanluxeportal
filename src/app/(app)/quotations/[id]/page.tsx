import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { getStatusColor } from "@/lib/status-colors";
import { QuotationActions } from "@/components/quotations/quotation-actions";
import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const { id } = await params;

  const { data: quotation, error } = await supabase
    .from("quotations")
    .select(
      `*,
      customer:customers(id, name, phone, email)
      `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !quotation) notFound();

  const { data: items } = await supabase
    .from("quotation_items")
    .select("*")
    .eq("quotation_id", id)
    .order("sort_order", { ascending: true });

  const colors = getStatusColor(quotation.status);
  const customer = Array.isArray(quotation.customer) ? quotation.customer[0] : quotation.customer;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{quotation.quote_no}</h1>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}>
              {quotation.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Issued {formatDate(quotation.issue_date)}
            {quotation.valid_until && ` · Valid until ${formatDate(quotation.valid_until)}`}
          </p>
        </div>
        <Link href="/quotations" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to Quotations
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Line items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
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

            {/* Totals */}
            <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-700">{formatAED(quotation.subtotal)}</span>
              </div>
              {quotation.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-medium text-red-600">-{formatAED(quotation.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">VAT (5%)</span>
                <span className="font-medium text-slate-700">{formatAED(quotation.vat_amount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-700">Total</span>
                <span className="font-bold text-slate-900">{formatAED(quotation.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes + Terms */}
          {(quotation.notes || quotation.terms) && (
            <div className="grid grid-cols-2 gap-4">
              {quotation.notes && (
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                  <h2 className="mb-2 text-sm font-semibold text-slate-700">Notes</h2>
                  <p className="text-sm text-slate-600">{quotation.notes}</p>
                </div>
              )}
              {quotation.terms && (
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                  <h2 className="mb-2 text-sm font-semibold text-slate-700">Terms & Conditions</h2>
                  <p className="text-sm text-slate-600">{quotation.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Customer + Actions */}
        <div className="space-y-6">
          {/* Customer */}
          {customer && (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
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

          {/* Actions */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Actions</h2>
            <QuotationActions
              quotationId={quotation.id}
              status={quotation.status}
              userRole={user.role}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
