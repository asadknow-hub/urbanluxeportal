import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReportsTabs } from "@/components/reports/reports-tabs";
import { formatAED } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const activeTab = params.tab ?? "sales";

  const canViewFinancial = ["admin", "manager", "accountant"].includes(user.role);
  const canViewAll = ["admin", "manager"].includes(user.role);

  // Sales performance data
  const { data: wonDeals } = await supabase
    .from("deals")
    .select("id, title, value, commission, stage, updated_at, agent:profiles!deals_assigned_to_fkey(id, full_name)")
    .eq("stage", "won")
    .eq("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(50);

  const { data: lostDeals } = await supabase
    .from("deals")
    .select("id, lost_reason, updated_at")
    .eq("stage", "lost")
    .eq("deleted_at", null)
    .limit(50);

  // Lead analytics
  const { data: leads } = await supabase
    .from("leads")
    .select("id, source, status, created_at")
    .eq("deleted_at", null)
    .limit(100);

  // Property report
  const { data: properties } = await supabase
    .from("properties")
    .select("id, status, category, community, purpose, created_at")
    .eq("deleted_at", null)
    .limit(100);

  // Financial data (admin/manager/accountant only)
  let revenueData: { total: number; paid: number; outstanding: number } = { total: 0, paid: 0, outstanding: 0 };
  let expenseData: { total: number } = { total: 0 };
  let vatData: { collected: number } = { collected: 0 };

  if (canViewFinancial) {
    const { data: invoices } = await supabase
      .from("invoices")
      .select("total, amount_paid, vat_amount, status")
      .neq("status", "void")
      .eq("deleted_at", null);

    const invData = invoices ?? [];
    revenueData = {
      total: invData.reduce((s, i) => s + (i.total ?? 0), 0),
      paid: invData.reduce((s, i) => s + (i.amount_paid ?? 0), 0),
      outstanding: invData.reduce((s, i) => s + ((i.total ?? 0) - (i.amount_paid ?? 0)), 0),
    };
    vatData = {
      collected: invData.reduce((s, i) => s + (i.vat_amount ?? 0), 0),
    };

    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount")
      .eq("deleted_at", null);

    expenseData = {
      total: (expenses ?? []).reduce((s, e) => s + (e.amount ?? 0), 0),
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="text-sm text-slate-500">Sales, leads, properties, and financial performance</p>
      </div>

      <ReportsTabs
        activeTab={activeTab}
        wonDeals={wonDeals ?? []}
        lostDeals={lostDeals ?? []}
        leads={leads ?? []}
        properties={properties ?? []}
        revenueData={revenueData}
        expenseData={expenseData}
        vatData={vatData}
        canViewFinancial={canViewFinancial}
        canViewAll={canViewAll}
      />
    </div>
  );
}
