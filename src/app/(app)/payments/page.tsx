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
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 sm:p-10 shadow-2xl">
        {/* Abstract background elements */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 backdrop-blur-md">
              Finance Hub
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Payments & Cheques
            </h1>
            <p className="mt-4 text-base text-slate-300 leading-relaxed max-w-xl">
              Track your incoming payments and elegantly manage the entire lifecycle of your cheques in one central hub.
            </p>
          </div>
        </div>
      </div>

      {/* Summary strip - Bento Style */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 -mt-4 mx-4 relative z-20">
        <div className="rounded-[1.5rem] bg-white p-5 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 group">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Pending Cheques</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 group-hover:text-amber-500 transition-colors">{pendingCheques.length}</p>
            <p className="text-sm font-medium text-slate-500">{formatAED(pendingAmount)}</p>
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 group">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Deposited</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 group-hover:text-blue-500 transition-colors">{depositedCheques.length}</p>
            <p className="text-sm font-medium text-slate-500">{formatAED(depositedAmount)}</p>
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 group">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Cleared</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 group-hover:text-emerald-500 transition-colors">{clearedCheques.length}</p>
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 group">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Bounced</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 group-hover:text-red-500 transition-colors">{bouncedCheques.length}</p>
            <p className="text-sm font-medium text-slate-500">{formatAED(bouncedAmount)}</p>
          </div>
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
