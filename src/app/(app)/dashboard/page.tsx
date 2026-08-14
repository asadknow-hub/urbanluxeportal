import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, KanbanSquare, DollarSign, AlertCircle, Plus, FileText, UserPlus, ChevronRight, Megaphone, ReceiptText } from "lucide-react";
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
    .is("deleted_at", null)
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
    leadsResult,
    campaignsResult,
    expensesResult,
  ] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }).is("deleted_at", null),
    dealsQuery,
    supabase
      .from("invoices")
      .select("total")
      .is("deleted_at", null)
      .eq("status", "paid")
      .gte("issue_date", new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
    supabase
      .from("invoices")
      .select("total")
      .is("deleted_at", null)
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
      .is("deleted_at", null)
      .gte("next_follow_up_at", now.toISOString())
      .order("next_follow_up_at", { ascending: true })
      .limit(10),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("expenses")
      .select("amount")
      .is("deleted_at", null)
      .gte("expense_date", new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
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

  const newLeadsCount = leadsResult.count ?? 0;
  const activeCampaignsCount = campaignsResult.count ?? 0;
  const expensesThisMonth = (expensesResult.data ?? []).reduce((sum, e) => sum + (e.amount ?? 0), 0);

  const stats = [
    {
      label: "Total Properties",
      value: totalProperties.toString(),
      icon: Building2,
      theme: "emerald",
    },
    {
      label: "Active Deals",
      value: `${activeDeals.length}`,
      icon: KanbanSquare,
      theme: "blue",
    },
    {
      label: "Pipeline Value",
      value: formatAED(pipelineValue),
      icon: DollarSign,
      theme: "emerald",
    },
    {
      label: "New Leads",
      value: `${newLeadsCount}`,
      icon: UserPlus,
      theme: "purple",
    },
    {
      label: "Active Campaigns",
      value: `${activeCampaignsCount}`,
      icon: Megaphone,
      theme: "rose",
    },
    {
      label: "Revenue (This Month)",
      value: formatAED(revenueThisMonth),
      icon: DollarSign,
      theme: "emerald",
    },
    {
      label: "Expenses (This Month)",
      value: formatAED(expensesThisMonth),
      icon: ReceiptText,
      theme: "rose",
    },
    {
      label: "Overdue Invoices",
      value: `${overdueInvoices.length}`,
      subValue: formatAED(overdueAmount),
      icon: AlertCircle,
      theme: "rose",
    },
  ];

  const themes: Record<string, { bg: string, text: string, lightBg: string }> = {
    emerald: { bg: "bg-emerald-500", text: "text-emerald-600", lightBg: "bg-emerald-100" },
    blue: { bg: "bg-blue-500", text: "text-blue-600", lightBg: "bg-blue-100" },
    purple: { bg: "bg-purple-500", text: "text-purple-600", lightBg: "bg-purple-100" },
    rose: { bg: "bg-rose-500", text: "text-rose-600", lightBg: "bg-rose-100" },
  };

  const quickActions = [
    { label: "Add Lead", href: "/leads", icon: UserPlus },
    { label: "Add Property", href: "/properties", icon: Building2 },
    { label: "New Quotation", href: "/quotations", icon: FileText },
  ];

  return (
    <div className="space-y-5 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* 1. Header & Welcome Area - Glassy Banner */}
      <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 p-4 text-white shadow-lg lg:p-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CgkJPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpIi8+Cjwvc3ZnPg==')] opacity-20 pointer-events-none" />
        <div className="absolute -right-10 -top-24 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-24 w-24 rounded-full bg-emerald-400/20 blur-2xl" />
        
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl mb-1.5">
              Dashboard
            </h1>
            <p className="text-emerald-50/90 text-sm font-medium leading-relaxed">
              Welcome back, {user?.full_name}. Here's a quick overview of your operations today. Let's make it a productive one!
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
             {quickActions.map((action) => {
               const Icon = action.icon;
               return (
                 <Link
                   key={action.label}
                   href={action.href}
                   className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-white/20 hover:scale-[1.02] shadow-sm active:scale-95"
                 >
                   <Icon className="h-3.5 w-3.5" />
                   {action.label}
                 </Link>
               );
             })}
          </div>
        </div>
      </div>

      {/* 2. Cheque Alert Banner */}
      {(chequesDue30.length > 0 || chequesOverdue.length > 0) && (
        <Link
          href="/payments?tab=cheques"
          className="group block overflow-hidden rounded-[1.5rem] bg-white border border-rose-100 shadow-sm transition-all hover:shadow-md hover:border-rose-200"
        >
          <div className="flex items-center justify-between p-4 relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-400 to-rose-600 rounded-l-[1.5rem]" />
            <div className="flex items-center gap-4 pl-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-0.5">
                  Action Required: Cheque Tracker
                  <span className="flex h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                </h3>
                <p className="text-xs font-medium text-slate-500">
                  <span className="text-rose-600 font-bold">{chequesDue30.length} due in 30 days</span>
                  <span className="mx-1.5 text-slate-300">•</span>
                  <span className="text-rose-600 font-bold">{chequesOverdue.length} overdue/bounced</span>
                  {(chequesDue30Amount > 0 || chequesOverdueAmount > 0) && (
                    <span className="ml-1.5 text-slate-400">
                      ({formatAEDCompact(chequesDue30Amount)} due <span className="mx-1">•</span> {formatAEDCompact(chequesOverdueAmount)} overdue)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors">
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>
      )}

      {/* 3. Primary KPI Bento Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const theme = themes[stat.theme];
          return (
            <Card key={stat.label} className="group relative overflow-hidden rounded-[1.5rem] border-0 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:-translate-y-0.5 hover:ring-slate-200 bg-white">
              <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-5 transition-transform duration-700 ease-out group-hover:scale-[2] ${theme.bg}`} />
              <CardContent className="p-5 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.lightBg} ${theme.text} shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    {stat.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
                  </div>
                  {stat.subValue && (
                    <p className="mt-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 inline-block px-2 py-0.5 rounded-full">{stat.subValue}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 4. Lists (Activity & Follow-ups) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-[1.5rem] border-0 shadow-sm ring-1 ring-slate-100 lg:col-span-2 overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50/50 bg-white px-5 py-4">
            <CardTitle className="text-base font-bold text-slate-800 tracking-tight">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activities.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-400 font-medium">No recent activity.</div>
            ) : (
              <div className="divide-y divide-slate-50/50">
                {activities.map((act) => (
                  <div key={act.id} className="group flex items-start gap-4 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 ring-2 ring-white shadow-sm transition-transform group-hover:scale-105">
                       <span className="font-bold text-xs">
                         {act.actor?.full_name ? act.actor.full_name.charAt(0).toUpperCase() : "S"}
                       </span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-slate-600 leading-snug">
                        <span className="font-bold text-slate-900">{act.actor?.full_name ?? "System"}</span>{" "}
                        <span className="text-slate-500">{act.action.replace(/_/g, " ")}</span>{" "}
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded ml-0.5">{act.entity_type}</span>
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 tracking-wide uppercase">{timeAgo(act.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-0 shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white flex flex-col">
          <CardHeader className="border-b border-slate-50/50 bg-white px-5 py-4 shrink-0">
            <CardTitle className="text-base font-bold text-slate-800 tracking-tight flex items-center justify-between">
               Upcoming Follow-ups
               <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{followUps.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 bg-slate-50/30">
            {followUps.length === 0 ? (
              <div className="flex h-full items-center justify-center p-4 text-center text-xs font-medium text-slate-400">
                No scheduled follow-ups.
              </div>
            ) : (
              <div className="space-y-2.5">
                {followUps.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads`} 
                    className="group flex items-center justify-between rounded-xl border border-slate-100/80 bg-white p-3 shadow-sm transition-all hover:border-emerald-200 hover:shadow-sm hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3">
                       <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100 group-hover:text-emerald-700">
                          <UserPlus className="h-4 w-4" />
                       </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{lead.name}</p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wide">{formatDate(lead.next_follow_up_at)}</p>
                      </div>
                    </div>
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                       <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
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
