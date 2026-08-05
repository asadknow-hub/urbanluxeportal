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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search invoice no..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-48 pl-9"
          />
        </form>

        <Select
          value={currentFilters.status ?? "all"}
          onValueChange={(v) => updateFilter("status", v ?? "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
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

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Invoice No</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const colors = getStatusColor(inv.status);
                  const balance = inv.total - inv.amount_paid;
                  return (
                    <tr key={inv.id} className="group hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <Link href={`/invoices/${inv.id}`} className="font-medium text-slate-900 hover:text-emerald-600">
                            {inv.invoice_no}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{getCustomerName(inv.customer)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(inv.issue_date)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(inv.due_date)}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{formatAED(inv.total)}</td>
                      <td className="px-4 py-3 text-emerald-600">{formatAED(inv.amount_paid)}</td>
                      <td className={`px-4 py-3 font-medium ${balance > 0 ? "text-red-600" : "text-slate-400"}`}>
                        {formatAED(balance)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="inline-flex items-center text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-slate-600"
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
