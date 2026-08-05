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
    .eq("deleted_at", null)
    .order("paid_date", { ascending: false });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500">
            {count ?? 0} expenses · {formatAED(totalAmount)} total
          </p>
        </div>
        {canManage && <ExpenseCreateDialog />}
      </div>

      <ExpensesList
        expenses={expenses ?? []}
        currentFilters={params}
        canManage={canManage}
      />
    </div>
  );
}
