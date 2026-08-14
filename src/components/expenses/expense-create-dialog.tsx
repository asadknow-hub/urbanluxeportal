"use client";

import { useState, useTransition, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createExpense } from "@/server/expenses";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Loader2, Upload } from "lucide-react";

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

export function ExpenseCreateDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    category: "office",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    vendor: "",
    payment_method: "cash",
    reference: "",
    notes: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleReceiptUpload(file: File | null) {
    if (!file) return;
    setUploading(true);

    const supabase = createSupabaseBrowserClient();
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
    const fileName = `${crypto.randomUUID()}${ext ? "." + ext : ""}`;
    const path = `expense/${fileName}`;

    const { error } = await supabase.storage
      .from("documents")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      toast.error(`Upload failed: ${error.message}`);
    } else {
      setReceiptPath(path);
      toast.success("Receipt uploaded");
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createExpense({
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
        expense_date: form.expense_date,
        vendor: form.vendor || null,
        payment_method: form.payment_method || null,
        reference: form.reference || null,
        notes: form.notes || null,
        receipt_path: receiptPath,
      });
      if (result.ok) {
        toast.success("Expense created");
        setOpen(false);
        setForm({
          category: "office",
          description: "",
          amount: "",
          expense_date: new Date().toISOString().split("T")[0],
          vendor: "",
          payment_method: "cash",
          reference: "",
          notes: "",
        });
        setReceiptPath(null);
      } else {
        toast.error(result.error ?? "Failed to create expense");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} className="bg-emerald-500 hover:bg-emerald-600 shadow-sm rounded-full px-6 font-medium">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        )}
      />
      <DialogContent 
        className="max-w-4xl sm:max-w-4xl w-[95vw] sm:w-[90vw] md:w-[60vw] max-h-[90vh] overflow-y-auto p-0 border-0 rounded-[2rem] shadow-2xl"
        closeClassName="text-slate-300 hover:text-white hover:bg-slate-800/50"
      >
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-bold tracking-tight">Record New Expense</DialogTitle>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Category *</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v ?? "office")}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:ring-emerald-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="expense_date" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Date *</Label>
              <Input
                id="expense_date"
                type="date"
                value={form.expense_date}
                onChange={(e) => set("expense_date", e.target.value)}
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Description *</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              required
              placeholder="What was this expense for?"
              className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label htmlFor="amount" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Amount (AED) *</Label>
              <Input
                id="amount"
                type="number"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                required
                placeholder="500"
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="vendor" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Vendor</Label>
              <Input
                id="vendor"
                value={form.vendor}
                onChange={(e) => set("vendor", e.target.value)}
                placeholder="Supplier name"
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Payment Method</Label>
              <Select value={form.payment_method} onValueChange={(v) => set("payment_method", v ?? "cash")}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:ring-emerald-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="reference" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Reference</Label>
              <Input
                id="reference"
                value={form.reference}
                onChange={(e) => set("reference", e.target.value)}
                placeholder="Receipt no, transfer ref..."
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Receipt upload */}
          <div className="space-y-2.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Receipt</Label>
            <div className="rounded-[1rem] border-2 border-dashed border-slate-200/60 bg-slate-50/30 p-6 text-center hover:bg-slate-50 transition-colors">
              <input
                ref={inputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleReceiptUpload(e.target.files?.[0] ?? null)}
                className="hidden"
                id="receipt-upload"
              />
              <label
                htmlFor="receipt-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white border border-slate-200 shadow-sm px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                ) : (
                  <Upload className="h-4 w-4 text-emerald-500" />
                )}
                {uploading ? "Uploading..." : receiptPath ? "Receipt uploaded ✓" : "Click to upload receipt"}
              </label>
            </div>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="notes" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Optional notes..."
              className="rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-full px-6 font-medium shadow-sm">
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !form.description || !form.amount} className="rounded-full px-8 bg-emerald-500 hover:bg-emerald-600 font-medium shadow-sm">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
