import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, KanbanSquare, DollarSign, AlertCircle } from "lucide-react";
import { formatAED } from "@/lib/money";

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

  const [propertiesResult, dealsResult, invoicesResult, overdueResult] =
    await Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("deleted_at", null),
      dealsQuery,
      supabase
        .from("invoices")
        .select("total")
        .eq("deleted_at", null)
        .eq("status", "paid")
        .gte("issue_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase
        .from("invoices")
        .select("total")
        .eq("deleted_at", null)
        .eq("status", "overdue"),
    ]);

  const totalProperties = propertiesResult.count ?? 0;
  const activeDeals = dealsResult.data ?? [];
  const pipelineValue = activeDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  const revenueThisMonth = (invoicesResult.data ?? []).reduce((sum, i) => sum + (i.total ?? 0), 0);
  const overdueInvoices = overdueResult.data ?? [];
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + (i.total ?? 0), 0);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Welcome back, {user?.full_name}
        </p>
      </div>

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

      <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 p-5 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">
              Cheque tracker — Loading data...
            </span>
          </div>
          <a href="/payments?tab=cheques" className="text-sm font-medium underline hover:no-underline">
            View cheques →
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">Activity feed will appear here.</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Upcoming Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">Your scheduled follow-ups will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
