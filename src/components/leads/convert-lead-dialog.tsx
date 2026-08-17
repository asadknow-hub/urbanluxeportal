"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { convertLead, type ConvertLeadInput } from "@/server/leads";
import { formatAEDRange } from "@/lib/money";
import { suggestedPropertyTitle } from "@/lib/lead-flow";
import { PAYMENT_METHODS } from "@/lib/deal-transaction";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";

export type ConvertLeadPayload = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  interest: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_areas: string[] | null;
  bedrooms: string | null;
  category: string | null;
  financing: string | null;
};

function mapFinancingToPayment(financing: string | null) {
  if (!financing || financing === "undecided") return "";
  if (financing === "mortgage" || financing === "cash" || financing === "cheque") return financing;
  return "";
}

export function ConvertLeadDialog({
  open,
  onOpenChange,
  lead,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: ConvertLeadPayload;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ dealId: string } | null>(null);

  const defaults = useMemo(
    () => ({
      dealTitle: lead.name,
      property_title: suggestedPropertyTitle(lead),
      property_community: lead.preferred_areas?.[0] ?? "",
      property_building: "",
      property_unit: "",
      property_ref: "",
      payment_method: mapFinancingToPayment(lead.financing),
      payment_deposit: "",
      payment_balance: "",
      payment_notes: "",
      kyc_nationality: lead.nationality ?? "",
      kyc_emirates_id: "",
      kyc_passport_no: "",
      buyer_name: lead.name,
      buyer_phone: lead.phone ?? "",
      buyer_email: lead.email ?? "",
    }),
    [lead]
  );

  const [form, setForm] = useState(defaults);

  useEffect(() => {
    if (open) setForm(defaults);
  }, [open, defaults]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setResult(null);
      setForm(defaults);
    }
    onOpenChange(next);
  }

  function handleConvert() {
    if (!form.property_title.trim()) {
      toast.error("Property title is required to open the deal");
      return;
    }

    const payload: ConvertLeadInput = {
      dealTitle: form.dealTitle.trim() || lead.name,
      property_title: form.property_title.trim(),
      property_community: form.property_community.trim() || null,
      property_building: form.property_building.trim() || null,
      property_unit: form.property_unit.trim() || null,
      property_ref: form.property_ref.trim() || null,
      payment_method: form.payment_method || null,
      payment_deposit: form.payment_deposit ? Number(form.payment_deposit) : null,
      payment_balance: form.payment_balance ? Number(form.payment_balance) : null,
      payment_notes: form.payment_notes.trim() || null,
      kyc_nationality: form.kyc_nationality.trim() || null,
      kyc_emirates_id: form.kyc_emirates_id.trim() || null,
      kyc_passport_no: form.kyc_passport_no.trim() || null,
      buyer_name: form.buyer_name.trim() || lead.name,
      buyer_phone: form.buyer_phone.trim() || null,
      buyer_email: form.buyer_email.trim() || null,
    };

    startTransition(async () => {
      const converted = await convertLead(lead.id, payload);
      if (converted.ok && converted.data) {
        toast.success("Deal opened");
        setResult({ dealId: converted.data.dealId });
        router.refresh();
      } else {
        toast.error(converted.error ?? "Conversion failed");
      }
    });
  }

  const budgetLabel = formatAEDRange(lead.budget_min, lead.budget_max);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>Deal opened</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              The deal is in your pipeline with property and buyer details from this lead. When you mark it won, a
              customer record is created with the property and documents.
            </p>
            <DialogFooter className="gap-2 sm:justify-start">
              <Link
                href={`/pipeline/${result.dealId}`}
                className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
              >
                Open deal <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Convert to deal</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Capture execution details now. Budget from the lead
              {budgetLabel ? ` (${budgetLabel})` : ""} carries over automatically — no need to re-enter it.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="deal-title">Deal name</Label>
                <Input
                  id="deal-title"
                  value={form.dealTitle}
                  onChange={(e) => setForm({ ...form, dealTitle: e.target.value })}
                  placeholder={lead.name}
                />
              </div>

              <div className="rounded-[10px] border border-border bg-muted/30 p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Property</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Property title *</Label>
                    <Input
                      value={form.property_title}
                      onChange={(e) => setForm({ ...form, property_title: e.target.value })}
                      placeholder="e.g. Marina Gate 2 — 2BR sea view"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Community</Label>
                    <Input value={form.property_community} onChange={(e) => setForm({ ...form, property_community: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Building</Label>
                    <Input value={form.property_building} onChange={(e) => setForm({ ...form, property_building: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Unit</Label>
                    <Input value={form.property_unit} onChange={(e) => setForm({ ...form, property_unit: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Reference / permit</Label>
                    <Input value={form.property_ref} onChange={(e) => setForm({ ...form, property_ref: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="rounded-[10px] border border-border bg-muted/30 p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Payment</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Method</Label>
                    <Select
                      value={form.payment_method || "none"}
                      onValueChange={(v) => setForm({ ...form, payment_method: !v || v === "none" ? "" : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not set</SelectItem>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Deposit (AED)</Label>
                    <Input type="number" min={0} value={form.payment_deposit} onChange={(e) => setForm({ ...form, payment_deposit: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Notes</Label>
                    <Textarea rows={2} value={form.payment_notes} onChange={(e) => setForm({ ...form, payment_notes: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="rounded-[10px] border border-border bg-muted/30 p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Buyer & KYC</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Buyer name</Label>
                    <Input value={form.buyer_name} onChange={(e) => setForm({ ...form, buyer_name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={form.buyer_phone} onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input value={form.buyer_email} onChange={(e) => setForm({ ...form, buyer_email: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nationality</Label>
                    <Input value={form.kyc_nationality} onChange={(e) => setForm({ ...form, kyc_nationality: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Emirates ID</Label>
                    <Input value={form.kyc_emirates_id} onChange={(e) => setForm({ ...form, kyc_emirates_id: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Passport no.</Label>
                    <Input value={form.kyc_passport_no} onChange={(e) => setForm({ ...form, kyc_passport_no: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" disabled={pending} onClick={handleConvert}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Open deal
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
