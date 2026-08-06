import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PaymentsTabs } from "@/components/payments/payments-tabs";
import { formatAED } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const activeTab = params.tab ?? "payments";

  // Fetch payments
  const { data: payments, error: payError } = await supabase
    .from("payments")
    .select(
      `*,
      customer:customers(id, name),
      invoice:invoices(id, invoice_no)
      `
    )
    .is("deleted_at", null)
    .order("received_date", { ascending: false })
    .limit(50);

  if (payError) console.error("[payments] query error:", payError.message);

  // Fetch cheques
  const { data: cheques, error: chequeError } = await supabase
    .from("cheques")
    .select(
      `*,
      customer:customers(id, name)
      `
    )
    .is("deleted_at", null)
    .order("due_date", { ascending: true })
    .limit(50);

  if (chequeError) console.error("[cheques] query error:", chequeError.message);

  // Fetch customers for cheque dialog
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");

  // Summary stats
  const allCheques = cheques ?? [];
  const pendingCheques = allCheques.filter((c) => c.status === "pending");
  const depositedCheques = allCheques.filter((c) => c.status === "deposited");
  const bouncedCheques = allCheques.filter((c) => c.status === "bounced");
  const clearedCheques = allCheques.filter((c) => c.status === "cleared");

  const pendingAmount = pendingCheques.reduce((s, c) => s + (c.amount ?? 0), 0);
  const depositedAmount = depositedCheques.reduce((s, c) => s + (c.amount ?? 0), 0);
  const bouncedAmount = bouncedCheques.reduce((s, c) => s + (c.amount ?? 0), 0);

  const canManage = ["admin", "manager", "accountant"].includes(user.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payments & Cheques</h1>
        <p className="text-sm text-slate-500">Track payments and manage cheque lifecycle</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-xs text-slate-400">Pending</p>
          <p className="text-lg font-bold text-slate-900">{pendingCheques.length}</p>
          <p className="text-xs text-slate-500">{formatAED(pendingAmount)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-xs text-slate-400">Deposited</p>
          <p className="text-lg font-bold text-blue-600">{depositedCheques.length}</p>
          <p className="text-xs text-slate-500">{formatAED(depositedAmount)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-xs text-slate-400">Cleared</p>
          <p className="text-lg font-bold text-emerald-600">{clearedCheques.length}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-xs text-slate-400">Bounced</p>
          <p className="text-lg font-bold text-red-600">{bouncedCheques.length}</p>
          <p className="text-xs text-slate-500">{formatAED(bouncedAmount)}</p>
        </div>
      </div>

      <PaymentsTabs
        activeTab={activeTab}
        payments={payments ?? []}
        cheques={cheques ?? []}
        customers={customers ?? []}
        canManage={canManage}
      />
    </div>
  );
}
