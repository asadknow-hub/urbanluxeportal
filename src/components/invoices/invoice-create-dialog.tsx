"use client";

import { useState, useTransition } from "react";
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
import { createInvoice } from "@/server/invoices";
import { formatAED } from "@/lib/money";
import { toast } from "sonner";
import { Plus, Loader2, Trash2 } from "lucide-react";

type LineItem = {
  description: string;
  qty: string;
  unit_price: string;
};

export function InvoiceCreateDialog({
  customers,
}: {
  customers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { description: "", qty: "1", unit_price: "" },
  ]);

  function addItem() {
    setItems([...items, { description: "", qty: "1", unit_price: "" }]);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof LineItem, value: string) {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.qty) * Number(item.unit_price) || 0),
    0
  );
  const discountAmount = Number(discount) || 0;
  const taxable = subtotal - discountAmount;
  const vat = taxable * 0.05;
  const total = taxable + vat;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }
    if (items.some((i) => !i.description || !i.qty || !i.unit_price)) {
      toast.error("Please fill all line items");
      return;
    }

    startTransition(async () => {
      const result = await createInvoice({
        customer_id: customerId,
        deal_id: null,
        issue_date: issueDate,
        due_date: dueDate,
        notes: notes || null,
        items: items.map((i) => ({
          description: i.description,
          qty: Number(i.qty),
          unit_price: Number(i.unit_price),
        })),
        discount: discountAmount,
      });
      if (result.ok) {
        toast.success(`Invoice ${result.data?.invoice_no} created`);
        setOpen(false);
        setCustomerId("");
        setNotes("");
        setDiscount("");
        setItems([{ description: "", qty: "1", unit_price: "" }]);
      } else {
        toast.error(result.error ?? "Failed to create invoice");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} className="bg-emerald-500 hover:bg-emerald-600 shadow-sm rounded-full px-6 font-medium">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        )}
      />
      <DialogContent 
        className="max-w-4xl sm:max-w-4xl w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[60vw] max-h-[90vh] overflow-y-auto p-0 border-0 rounded-[1.5rem] shadow-2xl"
        closeClassName="text-slate-300 hover:text-white hover:bg-slate-800/50"
      >
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4 sm:p-5 text-white relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-bold tracking-tight">Create New Invoice</DialogTitle>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Customer *</Label>
              <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:ring-emerald-500/20">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  {customers.map((c) => (
                    <SelectItem key={c.id ?? ""} value={c.id ?? ""}>
                      {c.name ?? ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="issue_date" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Issue Date</Label>
              <Input
                id="issue_date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="due_date" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Line Items</Label>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    className="flex-1 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.qty}
                    onChange={(e) => updateItem(idx, "qty", e.target.value)}
                    className="w-24 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
                  />
                  <Input
                    type="number"
                    placeholder="Unit Price"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                    className="w-32 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
                  />
                  <span className="pt-3 text-sm font-semibold text-slate-700 min-w-[90px] text-right">
                    {formatAED((Number(item.qty) * Number(item.unit_price) || 0) * 100)}
                  </span>
                  {items.length > 1 && (
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(idx)} className="mt-1 h-9 w-9 hover:bg-red-50 hover:text-red-600 rounded-full">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="rounded-full font-medium shadow-sm hover:bg-slate-50 border-slate-200/60 text-slate-600">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Line Item
            </Button>
          </div>

          <div className="rounded-[1.5rem] bg-slate-50/80 border border-slate-100 p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Subtotal</span>
              <span className="font-semibold text-slate-700">{formatAED(subtotal * 100)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Discount (AED)</span>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="w-32 text-right h-9 rounded-lg border-slate-200 bg-white"
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">VAT (5%)</span>
              <span className="font-semibold text-slate-700">{formatAED(vat * 100)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-4 mt-2">
              <span className="font-bold text-slate-700">Total</span>
              <span className="font-extrabold text-lg text-emerald-600">{formatAED(total * 100)}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="notes" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for the invoice..."
              rows={3}
              className="rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-full px-6 font-medium shadow-sm">
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !customerId} className="rounded-full px-5 bg-emerald-500 hover:bg-emerald-600 font-medium shadow-sm">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Invoice
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
