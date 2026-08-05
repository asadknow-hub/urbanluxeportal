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
    paid_date: new Date().toISOString().split("T")[0],
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
        paid_date: form.paid_date,
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
          paid_date: new Date().toISOString().split("T")[0],
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
          <Button {...props} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        )}
      />
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v ?? "office")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paid_date">Date</Label>
              <Input
                id="paid_date"
                type="date"
                value={form.paid_date}
                onChange={(e) => set("paid_date", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              required
              placeholder="What was this expense for?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (AED) *</Label>
              <Input
                id="amount"
                type="number"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                required
                placeholder="500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                value={form.vendor}
                onChange={(e) => set("vendor", e.target.value)}
                placeholder="Supplier name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={form.payment_method} onValueChange={(v) => set("payment_method", v ?? "cash")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                value={form.reference}
                onChange={(e) => set("reference", e.target.value)}
                placeholder="Receipt no, transfer ref..."
              />
            </div>
          </div>

          {/* Receipt upload */}
          <div className="space-y-2">
            <Label>Receipt</Label>
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-3 text-center">
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
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? "Uploading..." : receiptPath ? "Receipt uploaded ✓" : "Upload receipt"}
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !form.description || !form.amount}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
