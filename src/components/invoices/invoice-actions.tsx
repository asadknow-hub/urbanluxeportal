"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { recordPayment, voidInvoice } from "@/server/invoices";
import { formatAED } from "@/lib/money";
import { toast } from "sonner";
import { DollarSign, Ban, Loader2 } from "lucide-react";

export function InvoiceActions({
  invoiceId,
  customerId,
  status,
  balance,
  userRole,
}: {
  invoiceId: string;
  customerId: string;
  status: string;
  balance: number;
  userRole: string;
}) {
  const [pending, startTransition] = useTransition();
  const [payOpen, setPayOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [payment, setPayment] = useState({
    amount: String(balance / 100),
    method: "cash",
    received_date: new Date().toISOString().split("T")[0],
    reference: "",
    notes: "",
  });

  function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await recordPayment(invoiceId, {
        customer_id: customerId,
        amount: Number(payment.amount),
        method: payment.method,
        received_date: payment.received_date,
        reference: payment.reference || undefined,
        notes: payment.notes || undefined,
      });
      if (result.ok) {
        toast.success("Payment recorded");
        setPayOpen(false);
      } else {
        toast.error(result.error ?? "Failed to record payment");
      }
    });
  }

  function handleVoid() {
    startTransition(async () => {
      const result = await voidInvoice(invoiceId);
      if (result.ok) {
        toast.success("Invoice voided");
        setVoidOpen(false);
      } else {
        toast.error(result.error ?? "Failed to void invoice");
      }
    });
  }

  const canManage = ["admin", "manager", "accountant"].includes(userRole);
  const canRecordPayment = canManage && balance > 0 && status !== "void";

  return (
    <div className="space-y-2">
      {canRecordPayment && (
        <Button
          onClick={() => setPayOpen(true)}
          disabled={pending}
          className="w-full bg-emerald-500 hover:bg-emerald-600"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      )}

      {canManage && status !== "void" && status !== "paid" && (
        <Button
          onClick={() => setVoidOpen(true)}
          disabled={pending}
          variant="outline"
          className="w-full text-red-600"
        >
          <Ban className="h-4 w-4 mr-2" />
          Void Invoice
        </Button>
      )}

      {status === "void" && (
        <p className="text-center text-sm text-slate-400">This invoice has been voided.</p>
      )}

      {status === "paid" && (
        <p className="text-center text-sm text-emerald-600">Fully paid.</p>
      )}

      {/* Record payment dialog */}
      <Dialog open={payOpen} onOpenChange={(v) => !v && setPayOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Balance Due</span>
                <span className="font-bold text-red-600">{formatAED(balance)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (AED) *</Label>
              <Input
                id="amount"
                type="number"
                value={payment.amount}
                onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                required
                placeholder="Amount"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Method</Label>
                <Select
                  value={payment.method}
                  onValueChange={(v) => setPayment({ ...payment, method: v ?? "cash" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="received_date">Received Date</Label>
                <Input
                  id="received_date"
                  type="date"
                  value={payment.received_date}
                  onChange={(e) => setPayment({ ...payment, received_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                value={payment.reference}
                onChange={(e) => setPayment({ ...payment, reference: e.target.value })}
                placeholder="Cheque no, transfer ref..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay_notes">Notes</Label>
              <Textarea
                id="pay_notes"
                value={payment.notes}
                onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
                rows={2}
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending} className="bg-emerald-500 hover:bg-emerald-600">
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Void confirmation */}
      <Dialog open={voidOpen} onOpenChange={(v) => !v && setVoidOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void this invoice?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            This will mark the invoice as void. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setVoidOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVoid} disabled={pending} variant="destructive">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Void Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
