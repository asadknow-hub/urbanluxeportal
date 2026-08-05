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
  paid_date: string;
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
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search description, vendor..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-56 pl-9"
          />
        </form>

        <Select
          value={currentFilters.category ?? "all"}
          onValueChange={(v) => updateFilter("category", v ?? "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Receipt</th>
                {canManage && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="px-4 py-12 text-center text-slate-400">
                    No expenses found.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="group hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{formatDate(exp.paid_date)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 capitalize">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{exp.description}</td>
                    <td className="px-4 py-3 text-slate-500">{exp.vendor ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 capitalize">
                      {exp.payment_method?.replace(/_/g, " ") ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">
                      {formatAED(exp.amount)}
                    </td>
                    <td className="px-4 py-3">
                      {exp.receipt_path ? (
                        <FileText className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(exp.id)}
                          disabled={pending}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
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
