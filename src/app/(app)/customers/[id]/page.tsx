import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { getStatusColor } from "@/lib/status-colors";
import { whatsappLink } from "@/lib/phone";
import Link from "next/link";
import {
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  User,
  Building2,
  FileText,
  CreditCard,
  Calendar,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const { id } = await params;

  const { data: customer, error } = await supabase
    .from("customers")
    .select(
      `*,
      assigned_to_profile:profiles!customers_assigned_to_fkey(id, full_name, avatar_url)
      `
    )
    .eq("id", id)
    .eq("deleted_at", null)
    .single();

  if (error || !customer) notFound();

  // Fetch deals
  const { data: deals } = await supabase
    .from("deals")
    .select("*")
    .eq("customer_id", id)
    .eq("deleted_at", null)
    .order("created_at", { ascending: false });

  // Fetch invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  // Fetch payments
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("customer_id", id)
    .order("payment_date", { ascending: false });

  // Calculate balance
  const invoiceTotal = (invoices ?? [])
    .filter((inv) => inv.status !== "void")
    .reduce((sum, inv) => sum + (inv.total ?? 0), 0);
  const paymentTotal = (payments ?? []).reduce(
    (sum, p) => sum + (p.amount ?? 0),
    0
  );
  const balance = invoiceTotal - paymentTotal;

  // Fetch activity log
  const { data: activities } = await supabase
    .from("activity_log")
    .select("*, actor:profiles!activity_log_actor_id_fkey(full_name)")
    .eq("entity_type", "customer")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(15);

  const waLink = whatsappLink(customer.phone);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${customer.type === "company" ? "bg-purple-100" : "bg-blue-100"}`}>
            {customer.type === "company" ? (
              <Building2 className="h-6 w-6 text-purple-600" />
            ) : (
              <User className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
            <p className="text-sm text-slate-500 capitalize">{customer.type}</p>
          </div>
        </div>
        <Link
          href="/customers"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to Customers
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Profile + KYC */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Contact</h2>
            <div className="space-y-3 text-sm">
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <a href={`tel:${customer.phone}`} className="text-slate-700 hover:text-slate-900">
                    {customer.phone}
                  </a>
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      <MessageCircle className="h-3 w-3" />
                      WhatsApp
                    </a>
                  )}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <a href={`mailto:${customer.email}`} className="text-slate-700 hover:text-slate-900">
                    {customer.email}
                  </a>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{customer.address}</span>
                </div>
              )}
              {customer.assigned_to_profile && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{customer.assigned_to_profile.full_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* KYC Panel */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">KYC</h2>
            <dl className="space-y-3 text-sm">
              {customer.nationality && (
                <div>
                  <dt className="text-xs text-slate-400">Nationality</dt>
                  <dd className="font-medium text-slate-700">{customer.nationality}</dd>
                </div>
              )}
              {customer.emirates_id && (
                <div>
                  <dt className="text-xs text-slate-400">Emirates ID</dt>
                  <dd className="font-medium text-slate-700">{customer.emirates_id}</dd>
                </div>
              )}
              {customer.passport_no && (
                <div>
                  <dt className="text-xs text-slate-400">Passport No</dt>
                  <dd className="font-medium text-slate-700">{customer.passport_no}</dd>
                </div>
              )}
              {customer.trn && (
                <div>
                  <dt className="text-xs text-slate-400">TRN</dt>
                  <dd className="font-medium text-slate-700">{customer.trn}</dd>
                </div>
              )}
              {!customer.emirates_id && !customer.passport_no && customer.type === "individual" && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  ID document missing
                </div>
              )}
            </dl>
          </div>

          {/* Balance card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Balance</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Invoiced</span>
                <span className="font-medium text-slate-700">{formatAED(invoiceTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Paid</span>
                <span className="font-medium text-emerald-600">{formatAED(paymentTotal)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <span className="font-medium text-slate-700">Outstanding</span>
                <span className={`font-bold ${balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatAED(balance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Deals, Invoices, Activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Deals */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">
              Deals ({deals?.length ?? 0})
            </h2>
            <div className="space-y-2">
              {(deals ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">No deals yet.</p>
              ) : (
                (deals ?? []).map((deal) => {
                  const colors = getStatusColor(deal.stage);
                  return (
                    <Link
                      key={deal.id}
                      href={`/pipeline?deal=${deal.id}`}
                      className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{deal.title}</p>
                        <p className="text-xs text-slate-400 capitalize">{deal.deal_type.replace(/_/g, " ")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-700">{formatAED(deal.value)}</span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
                          {deal.stage}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Invoices */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">
              Invoices ({invoices?.length ?? 0})
            </h2>
            <div className="space-y-2">
              {(invoices ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">No invoices yet.</p>
              ) : (
                (invoices ?? []).map((inv) => {
                  const colors = getStatusColor(inv.status);
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{inv.invoice_number ?? inv.id.slice(0, 8)}</p>
                          <p className="text-xs text-slate-400">{formatDate(inv.issue_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-700">{formatAED(inv.total)}</span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Recent Activity</h2>
            <div className="space-y-3">
              {(activities ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">No activity yet.</p>
              ) : (
                (activities ?? []).map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
                    <div>
                      <p className="text-slate-700">
                        <span className="font-medium">{act.actor?.full_name ?? "System"}</span>{" "}
                        {act.action}
                      </p>
                      <p className="text-xs text-slate-400">{formatDate(act.created_at, "dd MMM yyyy, HH:mm")}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
