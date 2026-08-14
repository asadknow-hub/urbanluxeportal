import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ExpensesList } from "@/components/expenses/expenses-list";
import { ExpenseCreateDialog } from "@/components/expenses/expense-create-dialog";
import { formatAED } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  const canManage = ["admin", "manager", "accountant"].includes(user.role);

  let query = supabase
    .from("expenses")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("expense_date", { ascending: false });

  if (params.category && params.category !== "all") {
    query = query.eq("category", params.category);
  }

  if (params.q) {
    query = query.or(`description.ilike.%${params.q}%,vendor.ilike.%${params.q}%`);
  }

  const { data: expenses, error, count } = await query.limit(50);

  if (error) console.error("[expenses] query error:", error.message);

  // Summary
  const totalAmount = (expenses ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);
  const categories = [...new Set((expenses ?? []).map((e) => e.category))];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 sm:p-10 shadow-2xl">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 backdrop-blur-md">
              Finance Hub
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Expenses
            </h1>
            <p className="mt-4 text-base text-slate-300 leading-relaxed max-w-xl">
              Manage and track your company expenses with clarity and style.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Expenses</span>
              <span className="text-2xl font-black text-white">{formatAED(totalAmount)}</span>
              <span className="text-xs text-slate-400 font-medium">{count ?? 0} records</span>
            </div>
            {canManage && <ExpenseCreateDialog />}
          </div>
        </div>
      </div>

      <ExpensesList
        expenses={expenses ?? []}
        currentFilters={params}
        canManage={canManage}
      />
    </div>
  );
}
