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
import { createQuotation } from "@/server/quotations";
import { formatAED } from "@/lib/money";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, FileText } from "lucide-react";

type LineItem = {
  description: string;
  qty: string;
  unit_price: string;
};

export function QuotationCreateDialog({
  customers,
}: {
  customers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
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
      const result = await createQuotation({
        customer_id: customerId,
        deal_id: null,
        issue_date: issueDate,
        valid_until: validUntil || null,
        notes: notes || null,
        terms: terms || null,
        items: items.map((i) => ({
          description: i.description,
          qty: Number(i.qty),
          unit_price: Number(i.unit_price),
        })),
        discount: discountAmount,
      });
      if (result.ok) {
        toast.success(`Quotation ${result.data?.quote_no} created`);
        setOpen(false);
        // Reset
        setCustomerId("");
        setValidUntil("");
        setNotes("");
        setTerms("");
        setDiscount("");
        setItems([{ description: "", qty: "1", unit_price: "" }]);
      } else {
        toast.error(result.error ?? "Failed to create quotation");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="mr-2 h-4 w-4" />
            New Quotation
          </Button>
        )}
      />
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Quotation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer + dates */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id ?? ""} value={c.id ?? ""}>
                      {c.name ?? ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue_date">Issue Date</Label>
              <Input
                id="issue_date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input
                id="valid_until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <Label>Line Items</Label>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.qty}
                    onChange={(e) => updateItem(idx, "qty", e.target.value)}
                    className="w-20"
                  />
                  <Input
                    type="number"
                    placeholder="Unit Price"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                    className="w-32"
                  />
                  <span className="pt-2 text-sm font-medium text-slate-600 min-w-[80px] text-right">
                    {formatAED((Number(item.qty) * Number(item.unit_price) || 0) * 100)}
                  </span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(idx)}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Line
            </Button>
          </div>

          {/* Totals */}
          <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-700">{formatAED(subtotal * 100)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Discount (AED)</span>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="w-28 text-right"
              />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">VAT (5%)</span>
              <span className="font-medium text-slate-700">{formatAED(vat * 100)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="font-semibold text-slate-700">Total</span>
              <span className="font-bold text-slate-900">{formatAED(total * 100)}</span>
            </div>
          </div>

          {/* Notes + Terms */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Payment terms, validity..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !customerId}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Quotation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
