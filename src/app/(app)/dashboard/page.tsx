import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not found");
  const supabase = await createSupabaseServerClient();
  const isAgent = user.role === "agent";

  let dealsQuery = supabase
    .from("deals")
    .select("value")
    .is("deleted_at", null)
    .in("stage", ["inquiry", "viewing", "offer", "negotiation", "contract"]);

  if (isAgent) {
    dealsQuery = dealsQuery.eq("assigned_to", user.id);
  }

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    propertiesResult,
    dealsResult,
    invoicesResult,
    overdueResult,
    chequesResult,
    activityResult,
    followupsResult,
    leadsResult,
    campaignsResult,
    expensesResult,
  ] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }).is("deleted_at", null),
    dealsQuery,
    supabase.from("invoices").select("total").is("deleted_at", null).eq("status", "paid").gte("issue_date", monthStart),
    supabase.from("invoices").select("total").is("deleted_at", null).eq("status", "overdue"),
    supabase.from("cheques").select("id, amount, due_date, status").in("status", ["pending", "deposited"]),
    supabase
      .from("activity_log")
      .select("*, actor:profiles!activity_log_actor_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("leads")
      .select("id, name, next_follow_up_at")
      .not("next_follow_up_at", "is", null)
      .is("deleted_at", null)
      .gte("next_follow_up_at", now.toISOString())
      .order("next_follow_up_at", { ascending: true })
      .limit(10),
    supabase.from("leads").select("id", { count: "exact", head: true }).is("deleted_at", null).gte("created_at", monthStart),
    supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("expenses").select("amount").is("deleted_at", null).gte("expense_date", monthStart),
  ]);

  const totalProperties = propertiesResult.count ?? 0;
  const activeDeals = dealsResult.data ?? [];
  const pipelineValue = activeDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  const revenueThisMonth = (invoicesResult.data ?? []).reduce((sum, i) => sum + (i.total ?? 0), 0);
  const overdueInvoices = overdueResult.data ?? [];
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + (i.total ?? 0), 0);
  const allCheques = chequesResult.data ?? [];
  const chequesDue30 = allCheques.filter((c) => new Date(c.due_date) <= thirtyDaysLater && new Date(c.due_date) >= now);
  const chequesOverdue = allCheques.filter((c) => new Date(c.due_date) < now);

  return (
    <DashboardView
      fullName={user.full_name}
      pipelineValue={pipelineValue}
      activeDealCount={activeDeals.length}
      revenueThisMonth={revenueThisMonth}
      expensesThisMonth={(expensesResult.data ?? []).reduce((sum, e) => sum + (e.amount ?? 0), 0)}
      overdueCount={overdueInvoices.length}
      overdueAmount={overdueAmount}
      newLeadsCount={leadsResult.count ?? 0}
      activeCampaignsCount={campaignsResult.count ?? 0}
      totalProperties={totalProperties}
      chequesDue30Count={chequesDue30.length}
      chequesOverdueCount={chequesOverdue.length}
      chequesDue30Amount={chequesDue30.reduce((sum, c) => sum + (c.amount ?? 0), 0)}
      chequesOverdueAmount={chequesOverdue.reduce((sum, c) => sum + (c.amount ?? 0), 0)}
      activities={(activityResult.data ?? []) as never}
      followUps={followupsResult.data ?? []}
    />
  );
}
