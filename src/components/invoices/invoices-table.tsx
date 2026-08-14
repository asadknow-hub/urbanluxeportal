"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStatusColor } from "@/lib/status-colors";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { Search, FileText, ChevronRight } from "lucide-react";

export type InvoiceRow = {
  id: string;
  invoice_no: string;
  status: string;
  issue_date: string;
  due_date: string;
  total: number;
  amount_paid: number;
  customer: { id: string; name: string } | { id: string; name: string }[] | null;
};

export function InvoicesTable({
  invoices,
  currentFilters,
}: {
  invoices: InvoiceRow[];
  currentFilters: { q?: string; status?: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentFilters.q ?? "");

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/invoices?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("q", searchValue);
  }

  function getCustomerName(c: InvoiceRow["customer"]): string {
    if (!c) return "—";
    if (Array.isArray(c)) return c[0]?.name ?? "—";
    return c.name;
  }

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-[1.5rem] border border-slate-200/60 shadow-sm w-fit">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search invoice no..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-[200px] pl-10 border-0 bg-slate-50/50 focus-visible:bg-slate-100 rounded-xl h-10 shadow-none focus-visible:ring-0"
          />
        </form>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        <Select
          value={currentFilters.status ?? "all"}
          onValueChange={(v) => updateFilter("status", v ?? "all")}
        >
          <SelectTrigger className="w-[140px] border-0 bg-transparent hover:bg-slate-50 focus:ring-0 rounded-xl font-medium shadow-none h-10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl font-medium">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm border border-slate-200/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3 rounded-tl-[2rem]">Invoice No</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-tr-[2rem]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No invoices found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const colors = getStatusColor(inv.status);
                  const balance = inv.total - inv.amount_paid;
                  return (
                    <tr key={inv.id} className="group transition-colors hover:bg-emerald-50/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                          <Link href={`/invoices/${inv.id}`} className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {inv.invoice_no}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600">{getCustomerName(inv.customer)}</td>
                      <td className="px-4 py-3 font-medium text-slate-500">{formatDate(inv.issue_date)}</td>
                      <td className="px-4 py-3 font-medium text-slate-500">{formatDate(inv.due_date)}</td>
                      <td className="px-4 py-3 font-extrabold text-slate-800">{formatAED(inv.total)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{formatAED(inv.amount_paid)}</td>
                      <td className={`px-4 py-3 font-bold ${balance > 0 ? "text-red-600" : "text-slate-400"}`}>
                        {formatAED(balance)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-md border border-slate-200/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${colors.bg} ${colors.text}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200/60 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 shadow-sm"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
