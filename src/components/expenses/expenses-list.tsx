"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { deleteExpense } from "@/server/expenses";
import { toast } from "sonner";
import { Search, Trash2, FileText, Loader2 } from "lucide-react";

export type ExpenseRow = {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  vendor: string | null;
  payment_method: string | null;
  reference: string | null;
  receipt_path: string | null;
};

const CATEGORIES = [
  "office",
  "marketing",
  "utilities",
  "salaries",
  "commission",
  "software",
  "travel",
  "legal",
  "maintenance",
  "other",
];

export function ExpensesList({
  expenses,
  currentFilters,
  canManage,
}: {
  expenses: ExpenseRow[];
  currentFilters: { q?: string; category?: string };
  canManage: boolean;
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
    router.push(`/expenses?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("q", searchValue);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteExpense(id);
      if (result.ok) {
        toast.success("Expense deleted");
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 p-2 bg-slate-100/80 backdrop-blur-md rounded-[1.25rem] w-fit border border-slate-200/60 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search description, vendor..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-64 pl-10 h-10 rounded-xl bg-white border-slate-200 shadow-sm focus-visible:ring-emerald-500/20"
          />
        </form>

        <Select
          value={currentFilters.category ?? "all"}
          onValueChange={(v) => updateFilter("category", v ?? "all")}
        >
          <SelectTrigger className="w-40 h-10 rounded-xl bg-white border-slate-200 shadow-sm focus:ring-emerald-500/20">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-xl">
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-xl shadow-slate-200/40 border border-slate-100 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/30 to-slate-100/20 pointer-events-none"></div>
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <th className="px-6 py-5 whitespace-nowrap">Date</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Description</th>
                <th className="px-6 py-5">Vendor</th>
                <th className="px-6 py-5">Method</th>
                <th className="px-6 py-5 text-right">Amount</th>
                <th className="px-6 py-5 text-center">Receipt</th>
                {canManage && <th className="px-6 py-5"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="px-6 py-16 text-center text-slate-400 font-medium">
                    No expenses found.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="group hover:bg-red-50/30 transition-colors duration-200">
                    <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap group-hover:text-red-700 transition-colors">{formatDate(exp.expense_date)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-semibold group-hover:text-red-800 transition-colors">{exp.description}</td>
                    <td className="px-4 py-3 text-slate-500 font-medium">{exp.vendor ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-100">
                        {exp.payment_method?.replace(/_/g, " ") ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-red-600">
                      {formatAED(exp.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {exp.receipt_path ? (
                        <div className="flex justify-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer transition-colors">
                            <FileText className="h-4 w-4" />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(exp.id)}
                          disabled={pending}
                          className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
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
