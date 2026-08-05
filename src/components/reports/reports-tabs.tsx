"use client";

import { useRouter } from "next/navigation";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { TrendingUp, TrendingDown, Building2, DollarSign, Users } from "lucide-react";

type WonDeal = {
  id: string;
  title: string;
  value: number;
  commission: number | null;
  updated_at: string;
  agent: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
};

type Lead = {
  id: string;
  source: string;
  status: string;
  created_at: string;
};

type Property = {
  id: string;
  status: string;
  category: string;
  community: string | null;
  purpose: string;
  created_at: string;
};

function getAgentName(a: WonDeal["agent"]): string {
  if (!a) return "—";
  if (Array.isArray(a)) return a[0]?.full_name ?? "—";
  return a.full_name;
}

export function ReportsTabs({
  activeTab,
  wonDeals,
  lostDeals,
  leads,
  properties,
  revenueData,
  expenseData,
  vatData,
  canViewFinancial,
  canViewAll,
}: {
  activeTab: string;
  wonDeals: WonDeal[];
  lostDeals: { id: string; lost_reason: string | null; updated_at: string }[];
  leads: Lead[];
  properties: Property[];
  revenueData: { total: number; paid: number; outstanding: number };
  expenseData: { total: number };
  vatData: { collected: number };
  canViewFinancial: boolean;
  canViewAll: boolean;
}) {
  const router = useRouter();

  const tabs = [
    { id: "sales", label: "Sales" },
    { id: "leads", label: "Leads" },
    { id: "properties", label: "Properties" },
  ];

  if (canViewFinancial) {
    tabs.push({ id: "financial", label: "Financial" });
  }

  function switchTab(tab: string) {
    if (tab === "sales") {
      router.push("/reports");
    } else {
      router.push(`/reports?tab=${tab}`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "sales" && <SalesReport wonDeals={wonDeals} lostDeals={lostDeals} />}
      {activeTab === "leads" && <LeadsReport leads={leads} />}
      {activeTab === "properties" && <PropertiesReport properties={properties} />}
      {activeTab === "financial" && canViewFinancial && (
        <FinancialReport
          revenueData={revenueData}
          expenseData={expenseData}
          vatData={vatData}
        />
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
      <div className={`mb-2 inline-flex rounded-lg p-2 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

function SalesReport({
  wonDeals,
  lostDeals,
}: {
  wonDeals: WonDeal[];
  lostDeals: { id: string; lost_reason: string | null; updated_at: string }[];
}) {
  const totalValue = wonDeals.reduce((s, d) => s + (d.value ?? 0), 0);
  const totalCommission = wonDeals.reduce((s, d) => s + (d.commission ?? 0), 0);
  const totalDeals = wonDeals.length + lostDeals.length;
  const winRate = totalDeals > 0 ? ((wonDeals.length / totalDeals) * 100).toFixed(0) : "0";

  // Agent scorecard
  const agentMap: Record<string, { name: string; deals: number; value: number; commission: number }> = {};
  wonDeals.forEach((d) => {
    const name = getAgentName(d.agent);
    if (!agentMap[name]) agentMap[name] = { name, deals: 0, value: 0, commission: 0 };
    agentMap[name].deals++;
    agentMap[name].value += d.value ?? 0;
    agentMap[name].commission += d.commission ?? 0;
  });
  const agentScores = Object.values(agentMap).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={TrendingUp} label="Won Deals" value={String(wonDeals.length)} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={TrendingDown} label="Lost Deals" value={String(lostDeals.length)} color="bg-red-50 text-red-600" />
        <StatCard icon={TrendingUp} label="Win Rate" value={`${winRate}%`} color="bg-blue-50 text-blue-600" />
        <StatCard icon={DollarSign} label="Total Value" value={formatAED(totalValue)} color="bg-purple-50 text-purple-600" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={DollarSign} label="Commission Earned" value={formatAED(totalCommission)} color="bg-amber-50 text-amber-600" />
        <StatCard icon={DollarSign} label="Avg Deal Value" value={wonDeals.length > 0 ? formatAED(totalValue / wonDeals.length) : "—"} color="bg-teal-50 text-teal-600" />
      </div>

      {/* Agent Scorecard */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Agent Scorecard</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3 text-center">Won</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agentScores.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No won deals yet.</td>
                </tr>
              ) : (
                agentScores.map((a) => (
                  <tr key={a.name} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{a.name}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{a.deals}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatAED(a.value)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{formatAED(a.commission)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LeadsReport({ leads }: { leads: Lead[] }) {
  const sourceMap: Record<string, number> = {};
  leads.forEach((l) => {
    sourceMap[l.source] = (sourceMap[l.source] ?? 0) + 1;
  });
  const sources = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]);

  const statusMap: Record<string, number> = {};
  leads.forEach((l) => {
    statusMap[l.status] = (statusMap[l.status] ?? 0) + 1;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Users} label="Total Leads" value={String(leads.length)} color="bg-blue-50 text-blue-600" />
        <StatCard icon={TrendingUp} label="Converted" value={String(statusMap["converted"] ?? 0)} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={TrendingDown} label="Unqualified" value={String(statusMap["unqualified"] ?? 0)} color="bg-red-50 text-red-600" />
        <StatCard icon={Users} label="Active" value={String(leads.length - (statusMap["converted"] ?? 0) - (statusMap["unqualified"] ?? 0))} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Leads by Source</h3>
        </div>
        <div className="p-4 space-y-2">
          {sources.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No leads data.</p>
          ) : (
            sources.map(([source, count]) => {
              const pct = leads.length > 0 ? (count / leads.length) * 100 : 0;
              return (
                <div key={source} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-slate-600 capitalize">{source.replace(/_/g, " ")}</span>
                  <div className="flex-1 h-6 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-medium text-slate-900">{count}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function PropertiesReport({ properties }: { properties: Property[] }) {
  const statusMap: Record<string, number> = {};
  properties.forEach((p) => {
    statusMap[p.status] = (statusMap[p.status] ?? 0) + 1;
  });

  const categoryMap: Record<string, number> = {};
  properties.forEach((p) => {
    categoryMap[p.category] = (categoryMap[p.category] ?? 0) + 1;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Building2} label="Total" value={String(properties.length)} color="bg-blue-50 text-blue-600" />
        <StatCard icon={Building2} label="Available" value={String(statusMap["available"] ?? 0)} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Building2} label="Sold" value={String(statusMap["sold"] ?? 0)} color="bg-teal-50 text-teal-600" />
        <StatCard icon={Building2} label="Rented" value={String(statusMap["rented"] ?? 0)} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
          <div className="border-b border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">By Status</h3>
          </div>
          <div className="p-4 space-y-2">
            {Object.entries(statusMap).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 capitalize">{status.replace(/_/g, " ")}</span>
                <span className="font-medium text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
          <div className="border-b border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">By Category</h3>
          </div>
          <div className="p-4 space-y-2">
            {Object.entries(categoryMap).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 capitalize">{category.replace(/_/g, " ")}</span>
                <span className="font-medium text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FinancialReport({
  revenueData,
  expenseData,
  vatData,
}: {
  revenueData: { total: number; paid: number; outstanding: number };
  expenseData: { total: number };
  vatData: { collected: number };
}) {
  const netProfit = revenueData.paid - expenseData.total;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={TrendingUp} label="Revenue (Invoiced)" value={formatAED(revenueData.total)} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={DollarSign} label="Collected" value={formatAED(revenueData.paid)} color="bg-teal-50 text-teal-600" />
        <StatCard icon={TrendingDown} label="Outstanding" value={formatAED(revenueData.outstanding)} color="bg-amber-50 text-amber-600" />
        <StatCard icon={DollarSign} label="Expenses" value={formatAED(expenseData.total)} color="bg-red-50 text-red-600" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={DollarSign} label="VAT Collected" value={formatAED(vatData.collected)} color="bg-purple-50 text-purple-600" />
        <StatCard
          icon={netProfit >= 0 ? TrendingUp : TrendingDown}
          label="Net Profit"
          value={formatAED(netProfit)}
          color={netProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Aging Buckets</h3>
        <p className="text-xs text-slate-400">Outstanding invoice amounts by age range</p>
        <div className="mt-3 grid grid-cols-4 gap-3">
          <div className="rounded-lg bg-emerald-50 p-3 text-center">
            <p className="text-xs text-emerald-600">0-30 days</p>
            <p className="text-lg font-bold text-emerald-700">—</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-3 text-center">
            <p className="text-xs text-amber-600">31-60 days</p>
            <p className="text-lg font-bold text-amber-700">—</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3 text-center">
            <p className="text-xs text-orange-600">61-90 days</p>
            <p className="text-lg font-bold text-orange-700">—</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <p className="text-xs text-red-600">90+ days</p>
            <p className="text-lg font-bold text-red-700">—</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-300">Detailed aging analysis coming with Phase 3 polish.</p>
      </div>
    </div>
  );
}
