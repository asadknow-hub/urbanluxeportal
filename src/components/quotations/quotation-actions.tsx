"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { updateQuotationStatus, convertQuotationToInvoice } from "@/server/quotations";
import { toast } from "sonner";
import { Send, Check, X, FileText, Loader2 } from "lucide-react";
import Link from "next/link";

export function QuotationActions({
  quotationId,
  status,
  userRole,
}: {
  quotationId: string;
  status: string;
  userRole: string;
}) {
  const [pending, startTransition] = useTransition();
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertedInvoice, setConvertedInvoice] = useState<{ id: string; invoice_no: string } | null>(null);

  function send() {
    startTransition(async () => {
      const result = await updateQuotationStatus(quotationId, "sent");
      if (result.ok) {
        toast.success("Quotation sent");
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function accept() {
    startTransition(async () => {
      const result = await updateQuotationStatus(quotationId, "accepted");
      if (result.ok) {
        toast.success("Quotation accepted");
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function reject() {
    startTransition(async () => {
      const result = await updateQuotationStatus(quotationId, "rejected");
      if (result.ok) {
        toast.success("Quotation rejected");
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function convert() {
    startTransition(async () => {
      const result = await convertQuotationToInvoice(quotationId);
      if (result.ok && result.data) {
        toast.success(`Invoice ${result.data.invoice_no} created`);
        setConvertedInvoice({ id: result.data.invoice_id, invoice_no: result.data.invoice_no });
      } else {
        toast.error(result.error ?? "Failed to convert");
      }
    });
  }

  const canEdit = ["admin", "manager", "agent", "accountant"].includes(userRole);

  return (
    <div className="space-y-2">
      {status === "draft" && canEdit && (
        <Button onClick={send} disabled={pending} className="w-full" variant="outline">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Mark as Sent
        </Button>
      )}

      {status === "sent" && canEdit && (
        <>
          <Button onClick={accept} disabled={pending} className="w-full bg-emerald-500 hover:bg-emerald-600">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
            Mark Accepted
          </Button>
          <Button onClick={reject} disabled={pending} variant="outline" className="w-full text-red-600">
            <X className="h-4 w-4 mr-2" />
            Mark Rejected
          </Button>
        </>
      )}

      {status === "accepted" && canEdit && (
        <Button onClick={() => setConvertOpen(true)} disabled={pending} className="w-full bg-purple-600 hover:bg-purple-700">
          <FileText className="h-4 w-4 mr-2" />
          Convert to Invoice
        </Button>
      )}

      {/* Convert confirmation dialog */}
      <Dialog open={convertOpen} onOpenChange={(v) => !v && setConvertOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Invoice?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            This will create a new invoice with the same line items and totals. The quotation will be marked as accepted.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setConvertOpen(false)}>
              Cancel
            </Button>
            <Button onClick={convert} disabled={pending} className="bg-purple-600 hover:bg-purple-700">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Convert
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success dialog with link to invoice */}
      <Dialog open={!!convertedInvoice} onOpenChange={(v) => !v && setConvertedInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invoice Created!</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Invoice <span className="font-medium text-slate-900">{convertedInvoice?.invoice_no}</span> has been created from this quotation.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Link href={`/invoices/${convertedInvoice?.id}`}>
              <Button className="bg-emerald-500 hover:bg-emerald-600">
                View Invoice
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
