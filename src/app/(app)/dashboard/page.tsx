import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, KanbanSquare, DollarSign, AlertCircle, Plus, FileText, UserPlus, ChevronRight } from "lucide-react";
import { formatAED, formatAEDCompact } from "@/lib/money";
import { formatDate, timeAgo } from "@/lib/dates";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not found");
  const supabase = await createSupabaseServerClient();

  const isAgent = user.role === "agent";

  let dealsQuery = supabase
    .from("deals")
    .select("value")
    .eq("deleted_at", null)
    .in("stage", ["inquiry", "viewing", "offer", "negotiation", "contract"]);

  if (isAgent) {
    dealsQuery = dealsQuery.eq("assigned_to", user.id);
  }

  let chequeQuery = supabase
    .from("cheques")
    .select("id, amount, due_date, status")
    .in("status", ["pending", "deposited"]);

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    propertiesResult,
    dealsResult,
    invoicesResult,
    overdueResult,
    chequesResult,
    activityResult,
    followupsResult,
  ] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("deleted_at", null),
    dealsQuery,
    supabase
      .from("invoices")
      .select("total")
      .eq("deleted_at", null)
      .eq("status", "paid")
      .gte("issue_date", new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
    supabase
      .from("invoices")
      .select("total")
      .eq("deleted_at", null)
      .eq("status", "overdue"),
    chequeQuery,
    supabase
      .from("activity_log")
      .select("*, actor:profiles!activity_log_actor_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("leads")
      .select("id, name, next_follow_up_at")
      .not("next_follow_up_at", "is", null)
      .eq("deleted_at", null)
      .gte("next_follow_up_at", now.toISOString())
      .order("next_follow_up_at", { ascending: true })
      .limit(10),
  ]);

  if (propertiesResult.error) console.error("[dashboard] properties error:", propertiesResult.error.message);
  if (dealsResult.error) console.error("[dashboard] deals error:", dealsResult.error.message);
  if (invoicesResult.error) console.error("[dashboard] invoices error:", invoicesResult.error.message);
  if (overdueResult.error) console.error("[dashboard] overdue error:", overdueResult.error.message);
  if (chequesResult.error) console.error("[dashboard] cheques error:", chequesResult.error.message);

  const totalProperties = propertiesResult.count ?? 0;
  const activeDeals = dealsResult.data ?? [];
  const pipelineValue = activeDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  const revenueThisMonth = (invoicesResult.data ?? []).reduce((sum, i) => sum + (i.total ?? 0), 0);
  const overdueInvoices = overdueResult.data ?? [];
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + (i.total ?? 0), 0);

  // Cheque stats
  const allCheques = chequesResult.data ?? [];
  const chequesDue30 = allCheques.filter(
    (c) => new Date(c.due_date) <= thirtyDaysLater && new Date(c.due_date) >= now
  );
  const chequesOverdue = allCheques.filter((c) => new Date(c.due_date) < now);
  const chequesDue30Amount = chequesDue30.reduce((sum, c) => sum + (c.amount ?? 0), 0);
  const chequesOverdueAmount = chequesOverdue.reduce((sum, c) => sum + (c.amount ?? 0), 0);

  const activities = activityResult.data ?? [];
  const followUps = followupsResult.data ?? [];

  const stats = [
    {
      label: "Total Properties",
      value: totalProperties.toString(),
      icon: Building2,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Active Deals",
      value: `${activeDeals.length}`,
      subValue: formatAED(pipelineValue),
      icon: KanbanSquare,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Revenue (This Month)",
      value: formatAED(revenueThisMonth),
      icon: DollarSign,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Overdue Invoices",
      value: `${overdueInvoices.length}`,
      subValue: formatAED(overdueAmount),
      icon: AlertCircle,
      color: "bg-red-100 text-red-600",
    },
  ];

  const quickActions = [
    { label: "Add Lead", href: "/leads", icon: UserPlus, color: "from-emerald-500 to-emerald-600" },
    { label: "Add Property", href: "/properties", icon: Building2, color: "from-blue-500 to-blue-600" },
    { label: "New Quotation", href: "/quotations", icon: FileText, color: "from-purple-500 to-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Welcome back, {user?.full_name}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="rounded-2xl">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-medium text-slate-500">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                {stat.subValue && (
                  <p className="text-sm text-slate-400">{stat.subValue}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${action.color} px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90`}
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </Link>
          );
        })}
      </div>

      {/* Cheque alert banner */}
      <Link
        href="/payments?tab=cheques"
        className="block rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 p-5 text-white shadow-sm transition-opacity hover:opacity-95"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">
              Cheque tracker —{" "}
              <span className="text-pink-200">{chequesDue30.length} due in 30 days</span>
              {" · "}
              <span className="text-pink-200">{chequesOverdue.length} overdue/bounced</span>
              {chequesDue30Amount > 0 && (
                <span className="ml-2 text-xs text-purple-200">
                  ({formatAEDCompact(chequesDue30Amount)} due · {formatAEDCompact(chequesOverdueAmount)} overdue)
                </span>
              )}
            </span>
          </div>
          <ChevronRight className="h-5 w-5" />
        </div>
      </Link>

      {/* Activity + Follow-ups */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-slate-400">No recent activity.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
                    <div className="flex-1">
                      <p className="text-slate-700">
                        <span className="font-medium">{act.actor?.full_name ?? "System"}</span>{" "}
                        <span className="text-slate-500">{act.action.replace(/_/g, " ")}</span>
                        {" "}
                        <span className="text-slate-400">{act.entity_type}</span>
                      </p>
                      <p className="text-xs text-slate-400">{timeAgo(act.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Upcoming Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            {followUps.length === 0 ? (
              <p className="text-sm text-slate-400">No scheduled follow-ups.</p>
            ) : (
              <div className="space-y-3">
                {followUps.map((lead) => (
                  <Link
                    key={lead.id}
                    href="/leads"
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{lead.name}</p>
                      <p className="text-xs text-slate-400">{formatDate(lead.next_follow_up_at)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
