"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { createCheque, updateChequeStatus } from "@/server/payments";
import { toast } from "sonner";
import { Plus, Loader2, Check, X, AlertTriangle } from "lucide-react";

type PaymentRow = {
  id: string;
  amount: number;
  method: string;
  received_date: string;
  reference: string | null;
  customer: { id: string; name: string } | { id: string; name: string }[] | null;
  invoice: { id: string; invoice_no: string } | null;
};

type ChequeRow = {
  id: string;
  direction: string;
  payee: string | null;
  bank_name: string;
  cheque_no: string;
  amount: number;
  due_date: string;
  status: string;
  bounce_reason: string | null;
  customer: { id: string; name: string } | { id: string; name: string }[] | null;
};

function getCustomerName(c: PaymentRow["customer"] | ChequeRow["customer"]): string {
  if (!c) return "—";
  if (Array.isArray(c)) return c[0]?.name ?? "—";
  return c.name;
}

export function PaymentsTabs({
  activeTab,
  payments,
  cheques,
  customers,
  canManage,
}: {
  activeTab: string;
  payments: PaymentRow[];
  cheques: ChequeRow[];
  customers: { id: string; name: string }[];
  canManage: boolean;
}) {
  const router = useRouter();

  function switchTab(tab: string) {
    if (tab === "payments") {
      router.push("/payments");
    } else {
      router.push("/payments?tab=cheques");
    }
  }

  return (
    <div className="space-y-4">
      {/* Tab buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => switchTab("payments")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === "payments" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          Payments ({payments.length})
        </button>
        <button
          onClick={() => switchTab("cheques")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === "cheques" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          Cheques ({cheques.length})
        </button>
      </div>

      {activeTab === "payments" ? (
        <PaymentsList payments={payments} />
      ) : (
        <ChequesList cheques={cheques} customers={customers} canManage={canManage} />
      )}
    </div>
  );
}

function PaymentsList({ payments }: { payments: PaymentRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  No payments recorded yet.
                </td>
              </tr>
            ) : (
              payments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{formatDate(pay.received_date)}</td>
                  <td className="px-4 py-3 text-slate-600">{getCustomerName(pay.customer)}</td>
                  <td className="px-4 py-3">
                    {pay.invoice ? (
                      <Link href={`/invoices/${pay.invoice.id}`} className="text-emerald-600 hover:text-emerald-700">
                        {pay.invoice.invoice_no}
                      </Link>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 capitalize">
                      {pay.method.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{pay.reference ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatAED(pay.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChequesList({
  cheques,
  customers,
  canManage,
}: {
  cheques: ChequeRow[];
  customers: { id: string; name: string }[];
  canManage: boolean;
}) {
  return (
    <div className="space-y-4">
      {canManage && <ChequeCreateDialog customers={customers} />}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Cheque No</th>
                <th className="px-4 py-3">Direction</th>
                <th className="px-4 py-3">Customer/Payee</th>
                <th className="px-4 py-3">Bank</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
                {canManage && <th className="px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cheques.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="px-4 py-12 text-center text-slate-400">
                    No cheques found.
                  </td>
                </tr>
              ) : (
                cheques.map((cheque) => {
                  const colors = getStatusColor(cheque.status);
                  return (
                    <tr key={cheque.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{cheque.cheque_no}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${cheque.direction === "incoming" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
                          {cheque.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {cheque.direction === "incoming" ? getCustomerName(cheque.customer) : cheque.payee ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{cheque.bank_name}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(cheque.due_date)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">{formatAED(cheque.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
                          {cheque.status}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <ChequeActions cheque={cheque} />
                        </td>
                      )}
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

function ChequeActions({ cheque }: { cheque: ChequeRow }) {
  const [pending, startTransition] = useTransition();
  const [bounceOpen, setBounceOpen] = useState(false);
  const [bounceReason, setBounceReason] = useState("");

  function deposit() {
    startTransition(async () => {
      const result = await updateChequeStatus(cheque.id, "deposited");
      if (result.ok) toast.success("Cheque marked as deposited");
      else toast.error(result.error ?? "Failed");
    });
  }

  function clear() {
    startTransition(async () => {
      const result = await updateChequeStatus(cheque.id, "cleared");
      if (result.ok) toast.success("Cheque cleared");
      else toast.error(result.error ?? "Failed");
    });
  }

  function bounce() {
    startTransition(async () => {
      const result = await updateChequeStatus(cheque.id, "bounced", bounceReason);
      if (result.ok) {
        toast.success("Cheque marked as bounced");
        setBounceOpen(false);
        setBounceReason("");
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  if (cheque.status === "cleared" || cheque.status === "bounced" || cheque.status === "replaced") {
    return <span className="text-xs text-slate-300">—</span>;
  }

  return (
    <div className="flex items-center gap-1">
      {cheque.status === "pending" && (
        <Button size="sm" variant="outline" onClick={deposit} disabled={pending}>
          Deposit
        </Button>
      )}
      {cheque.status === "deposited" && (
        <>
          <Button size="sm" variant="outline" className="text-emerald-600" onClick={clear} disabled={pending}>
            <Check className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
          <Button size="sm" variant="outline" className="text-red-600" onClick={() => setBounceOpen(true)} disabled={pending}>
            <X className="h-3.5 w-3.5 mr-1" />
            Bounce
          </Button>
        </>
      )}
      {cheque.status === "pending" && (
        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setBounceOpen(true)} disabled={pending}>
          <AlertTriangle className="h-3.5 w-3.5" />
        </Button>
      )}

      <Dialog open={bounceOpen} onOpenChange={(v) => !v && setBounceOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark cheque as bounced?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Cheque <span className="font-medium">{cheque.cheque_no}</span> for {formatAED(cheque.amount)}
            </p>
            <div className="space-y-2">
              <Label htmlFor="bounce_reason">Bounce Reason *</Label>
              <Textarea
                id="bounce_reason"
                value={bounceReason}
                onChange={(e) => setBounceReason(e.target.value)}
                placeholder="e.g. Insufficient funds"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBounceOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={bounce} disabled={pending || !bounceReason.trim()}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Mark Bounced
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChequeCreateDialog({
  customers,
}: {
  customers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    direction: "incoming",
    customer_id: "",
    payee: "",
    bank_name: "",
    cheque_no: "",
    amount: "",
    due_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createCheque({
        direction: form.direction as "incoming" | "outgoing",
        customer_id: form.customer_id || null,
        payee: form.payee || null,
        bank_name: form.bank_name,
        cheque_no: form.cheque_no,
        amount: Number(form.amount),
        due_date: form.due_date,
        invoice_id: null,
        deal_id: null,
        property_id: null,
        notes: form.notes || null,
      });
      if (result.ok) {
        toast.success("Cheque added");
        setOpen(false);
        setForm({
          direction: "incoming",
          customer_id: "",
          payee: "",
          bank_name: "",
          cheque_no: "",
          amount: "",
          due_date: new Date().toISOString().split("T")[0],
          notes: "",
        });
      } else {
        toast.error(result.error ?? "Failed to add cheque");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Cheque
          </Button>
        )}
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Cheque</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select value={form.direction} onValueChange={(v) => set("direction", v ?? "incoming")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incoming">Incoming</SelectItem>
                  <SelectItem value="outgoing">Outgoing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={form.due_date}
                onChange={(e) => set("due_date", e.target.value)}
              />
            </div>
          </div>

          {form.direction === "incoming" ? (
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={form.customer_id} onValueChange={(v) => set("customer_id", v ?? "")}>
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
          ) : (
            <div className="space-y-2">
              <Label htmlFor="payee">Payee</Label>
              <Input
                id="payee"
                value={form.payee}
                onChange={(e) => set("payee", e.target.value)}
                placeholder="Payee name"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank *</Label>
              <Input
                id="bank_name"
                value={form.bank_name}
                onChange={(e) => set("bank_name", e.target.value)}
                required
                placeholder="e.g. Emirates NBD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cheque_no">Cheque No *</Label>
              <Input
                id="cheque_no"
                value={form.cheque_no}
                onChange={(e) => set("cheque_no", e.target.value)}
                required
                placeholder="123456"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (AED) *</Label>
            <Input
              id="amount"
              type="number"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              required
              placeholder="50000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cheque_notes">Notes</Label>
            <Textarea
              id="cheque_notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !form.bank_name || !form.cheque_no || !form.amount}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Cheque
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
