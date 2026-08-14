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
      <div className="flex gap-2 p-1.5 bg-slate-100/80 backdrop-blur-md rounded-[1rem] w-fit border border-slate-200/60 shadow-sm">
        <button
          onClick={() => switchTab("payments")}
          className={`rounded-[0.75rem] px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
            activeTab === "payments" 
              ? "bg-white text-slate-900 shadow-sm" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          Payments
          <span className={`ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
            activeTab === "payments" ? "bg-slate-100 text-slate-600" : "bg-slate-200/50 text-slate-500"
          }`}>
            {payments.length}
          </span>
        </button>
        <button
          onClick={() => switchTab("cheques")}
          className={`rounded-[0.75rem] px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
            activeTab === "cheques" 
              ? "bg-white text-slate-900 shadow-sm" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          Cheques
          <span className={`ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
            activeTab === "cheques" ? "bg-slate-100 text-slate-600" : "bg-slate-200/50 text-slate-500"
          }`}>
            {cheques.length}
          </span>
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
    <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/40 border border-slate-100 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/30 to-slate-100/20 pointer-events-none"></div>
      <div className="overflow-x-auto relative z-10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <th className="px-6 py-5 whitespace-nowrap">Date</th>
              <th className="px-6 py-5">Customer</th>
              <th className="px-6 py-5">Invoice</th>
              <th className="px-6 py-5">Method</th>
              <th className="px-6 py-5">Reference</th>
              <th className="px-6 py-5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-medium">
                  No payments recorded yet.
                </td>
              </tr>
            ) : (
              payments.map((pay) => (
                <tr key={pay.id} className="group hover:bg-emerald-50/30 transition-colors duration-200">
                  <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap group-hover:text-emerald-700 transition-colors">{formatDate(pay.received_date)}</td>
                  <td className="px-6 py-4 text-slate-700 font-semibold group-hover:text-emerald-800 transition-colors">{getCustomerName(pay.customer)}</td>
                  <td className="px-6 py-4">
                    {pay.invoice ? (
                      <Link href={`/invoices/${pay.invoice.id}`} className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 font-medium hover:bg-emerald-100 transition-colors">
                        {pay.invoice.invoice_no}
                      </Link>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {pay.method.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-mono">{pay.reference ?? "—"}</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatAED(pay.amount)}</td>
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
    <div className="space-y-6">
      {canManage && (
        <div className="flex justify-end">
          <ChequeCreateDialog customers={customers} />
        </div>
      )}

      <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/40 border border-slate-100 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/30 to-slate-100/20 pointer-events-none"></div>
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <th className="px-6 py-5 whitespace-nowrap">Cheque No</th>
                <th className="px-6 py-5">Direction</th>
                <th className="px-6 py-5">Customer/Payee</th>
                <th className="px-6 py-5">Bank</th>
                <th className="px-6 py-5 whitespace-nowrap">Due Date</th>
                <th className="px-6 py-5 text-right">Amount</th>
                <th className="px-6 py-5 text-center">Status</th>
                {canManage && <th className="px-6 py-5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cheques.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="px-6 py-16 text-center text-slate-400 font-medium">
                    No cheques found.
                  </td>
                </tr>
              ) : (
                cheques.map((cheque) => {
                  const colors = getStatusColor(cheque.status);
                  return (
                    <tr key={cheque.id} className="group hover:bg-emerald-50/30 transition-colors duration-200">
                      <td className="px-6 py-4 font-bold text-slate-700 font-mono group-hover:text-emerald-800 transition-colors">{cheque.cheque_no}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${cheque.direction === "incoming" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
                          {cheque.direction}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700 group-hover:text-emerald-800 transition-colors">
                        {cheque.direction === "incoming" ? getCustomerName(cheque.customer) : cheque.payee ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{cheque.bank_name}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap group-hover:text-emerald-700 transition-colors">{formatDate(cheque.due_date)}</td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-800">{formatAED(cheque.amount)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${colors.bg} ${colors.text}`}>
                          {cheque.status}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-6 py-4">
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
    <div className="flex justify-end items-center gap-1.5">
      {cheque.status === "pending" && (
        <Button size="sm" variant="outline" onClick={deposit} disabled={pending} className="h-8 rounded-full text-xs font-medium shadow-sm hover:bg-slate-50">
          Deposit
        </Button>
      )}
      {cheque.status === "deposited" && (
        <>
          <Button size="sm" variant="outline" className="h-8 rounded-full text-xs font-medium text-emerald-600 border-emerald-200 hover:bg-emerald-50 shadow-sm" onClick={clear} disabled={pending}>
            <Check className="h-3 w-3 mr-1" />
            Clear
          </Button>
          <Button size="sm" variant="outline" className="h-8 rounded-full text-xs font-medium text-red-600 border-red-200 hover:bg-red-50 shadow-sm" onClick={() => setBounceOpen(true)} disabled={pending}>
            <X className="h-3 w-3 mr-1" />
            Bounce
          </Button>
        </>
      )}
      {cheque.status === "pending" && (
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setBounceOpen(true)} disabled={pending}>
          <AlertTriangle className="h-4 w-4" />
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
          <Button {...props} className="bg-emerald-500 hover:bg-emerald-600 shadow-sm rounded-full px-6 font-medium">
            <Plus className="mr-2 h-4 w-4" />
            Add Cheque
          </Button>
        )}
      />
      <DialogContent 
        className="max-w-2xl sm:max-w-2xl w-[95vw] sm:w-[90vw] md:w-[60vw] overflow-hidden p-0 border-0 rounded-[2rem] shadow-2xl"
        closeClassName="text-slate-300 hover:text-white hover:bg-slate-800/50"
      >
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-8 text-white relative">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-bold tracking-tight">Record New Cheque</DialogTitle>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Direction</Label>
              <Select value={form.direction} onValueChange={(v) => set("direction", v ?? "incoming")}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:ring-emerald-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  <SelectItem value="incoming">Incoming</SelectItem>
                  <SelectItem value="outgoing">Outgoing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="due_date" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={form.due_date}
                onChange={(e) => set("due_date", e.target.value)}
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
              />
            </div>
          </div>

          {form.direction === "incoming" ? (
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Customer *</Label>
              <Select value={form.customer_id} onValueChange={(v) => set("customer_id", v ?? "")}>
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
          ) : (
            <div className="space-y-2.5">
              <Label htmlFor="payee" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Payee *</Label>
              <Input
                id="payee"
                value={form.payee}
                onChange={(e) => set("payee", e.target.value)}
                placeholder="Payee name"
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label htmlFor="bank_name" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Bank *</Label>
              <Input
                id="bank_name"
                value={form.bank_name}
                onChange={(e) => set("bank_name", e.target.value)}
                required
                placeholder="e.g. Emirates NBD"
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="cheque_no" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cheque No *</Label>
              <Input
                id="cheque_no"
                value={form.cheque_no}
                onChange={(e) => set("cheque_no", e.target.value)}
                required
                placeholder="123456"
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="amount" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Amount (AED) *</Label>
            <Input
              id="amount"
              type="number"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              required
              placeholder="50000"
              className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="cheque_notes" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Notes</Label>
            <Textarea
              id="cheque_notes"
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
            <Button type="submit" disabled={pending || !form.bank_name || !form.cheque_no || !form.amount} className="rounded-full px-8 bg-emerald-500 hover:bg-emerald-600 font-medium shadow-sm">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Cheque
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
