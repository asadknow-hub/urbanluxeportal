"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateDealTransaction } from "@/server/deals";
import { PAYMENT_METHODS, dealReadyToFinalize, formatPropertyLine } from "@/lib/deal-transaction";
import { formatAED } from "@/lib/money";
import { toast } from "sonner";
import { Building2, CreditCard, Loader2, ShieldCheck, UserRound } from "lucide-react";

export type DealTransactionDeal = {
  id: string;
  stage: string;
  finalized_at?: string | null;
  property_title: string | null;
  property_community: string | null;
  property_building: string | null;
  property_unit: string | null;
  property_ref: string | null;
  payment_method: string | null;
  payment_deposit: number | null;
  payment_balance: number | null;
  payment_notes: string | null;
  kyc_nationality: string | null;
  kyc_emirates_id: string | null;
  kyc_passport_no: string | null;
  kyc_trn: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  buyer_email: string | null;
};

function filsToAedInput(fils: number | null) {
  return fils != null && fils > 0 ? String(fils / 100) : "";
}

export function DealTransactionForm({
  deal,
  canEdit,
}: {
  deal: DealTransactionDeal;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    property_title: deal.property_title ?? "",
    property_community: deal.property_community ?? "",
    property_building: deal.property_building ?? "",
    property_unit: deal.property_unit ?? "",
    property_ref: deal.property_ref ?? "",
    payment_method: deal.payment_method ?? "",
    payment_deposit: filsToAedInput(deal.payment_deposit),
    payment_balance: filsToAedInput(deal.payment_balance),
    payment_notes: deal.payment_notes ?? "",
    kyc_nationality: deal.kyc_nationality ?? "",
    kyc_emirates_id: deal.kyc_emirates_id ?? "",
    kyc_passport_no: deal.kyc_passport_no ?? "",
    kyc_trn: deal.kyc_trn ?? "",
    buyer_name: deal.buyer_name ?? "",
    buyer_phone: deal.buyer_phone ?? "",
    buyer_email: deal.buyer_email ?? "",
  });

  const readiness = dealReadyToFinalize({ ...deal, ...form });
  const locked = !!deal.finalized_at || deal.stage === "won";

  function save() {
    startTransition(async () => {
      const result = await updateDealTransaction(deal.id, {
        property_title: form.property_title.trim() || null,
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
        kyc_trn: form.kyc_trn.trim() || null,
        buyer_name: form.buyer_name.trim() || null,
        buyer_phone: form.buyer_phone.trim() || null,
        buyer_email: form.buyer_email.trim() || null,
      });
      if (result.ok) {
        toast.success("Transaction details saved");
        router.refresh();
      } else {
        toast.error(result.error ?? "Save failed");
      }
    });
  }

  const sections = [
    {
      icon: Building2,
      title: "Property",
      children: (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Property title / listing</Label>
            <Input
              disabled={!canEdit || locked}
              value={form.property_title}
              onChange={(e) => setForm({ ...form, property_title: e.target.value })}
              placeholder="e.g. Marina Gate 2 — 2BR sea view"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Community</Label>
            <Input disabled={!canEdit || locked} value={form.property_community} onChange={(e) => setForm({ ...form, property_community: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Building</Label>
            <Input disabled={!canEdit || locked} value={form.property_building} onChange={(e) => setForm({ ...form, property_building: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Unit</Label>
            <Input disabled={!canEdit || locked} value={form.property_unit} onChange={(e) => setForm({ ...form, property_unit: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Reference / permit no.</Label>
            <Input disabled={!canEdit || locked} value={form.property_ref} onChange={(e) => setForm({ ...form, property_ref: e.target.value })} />
          </div>
        </div>
      ),
    },
    {
      icon: CreditCard,
      title: "Payment",
      children: (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Method</Label>
            <Select
              value={form.payment_method || "none"}
              onValueChange={(v) => setForm({ ...form, payment_method: !v || v === "none" ? "" : v })}
              disabled={!canEdit || locked}
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
            <Input type="number" min={0} disabled={!canEdit || locked} value={form.payment_deposit} onChange={(e) => setForm({ ...form, payment_deposit: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Balance (AED)</Label>
            <Input type="number" min={0} disabled={!canEdit || locked} value={form.payment_balance} onChange={(e) => setForm({ ...form, payment_balance: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Payment notes</Label>
            <Textarea disabled={!canEdit || locked} value={form.payment_notes} onChange={(e) => setForm({ ...form, payment_notes: e.target.value })} rows={2} />
          </div>
          {(deal.payment_deposit != null || deal.payment_balance != null) && locked && (
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              Recorded: {formatAED(deal.payment_deposit ?? 0)} deposit
              {deal.payment_balance ? ` · ${formatAED(deal.payment_balance)} balance` : ""}
            </p>
          )}
        </div>
      ),
    },
    {
      icon: ShieldCheck,
      title: "KYC",
      children: (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nationality</Label>
            <Input disabled={!canEdit || locked} value={form.kyc_nationality} onChange={(e) => setForm({ ...form, kyc_nationality: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Emirates ID</Label>
            <Input disabled={!canEdit || locked} value={form.kyc_emirates_id} onChange={(e) => setForm({ ...form, kyc_emirates_id: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Passport no.</Label>
            <Input disabled={!canEdit || locked} value={form.kyc_passport_no} onChange={(e) => setForm({ ...form, kyc_passport_no: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>TRN</Label>
            <Input disabled={!canEdit || locked} value={form.kyc_trn} onChange={(e) => setForm({ ...form, kyc_trn: e.target.value })} />
          </div>
        </div>
      ),
    },
    {
      icon: UserRound,
      title: "Buyer contact",
      children: (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Buyer name</Label>
            <Input disabled={!canEdit || locked} value={form.buyer_name} onChange={(e) => setForm({ ...form, buyer_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input disabled={!canEdit || locked} value={form.buyer_phone} onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input disabled={!canEdit || locked} value={form.buyer_email} onChange={(e) => setForm({ ...form, buyer_email: e.target.value })} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {!readiness.ok && deal.stage !== "won" && deal.stage !== "lost" && (
        <div className="rounded-[10px] border border-amber-200/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          Before marking won: complete {readiness.missing.join(", ")}.
        </div>
      )}

      {deal.property_title && (
        <p className="text-sm text-muted-foreground">
          {formatPropertyLine(deal)}
        </p>
      )}

      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.title} className="overflow-hidden rounded-[14px] border border-border bg-card">
            <div className="h-0.5 bg-primary" />
            <div className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              </div>
              {section.children}
            </div>
          </div>
        );
      })}

      {canEdit && !locked && (
        <Button onClick={save} disabled={pending} className="w-full sm:w-auto">
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save transaction details
        </Button>
      )}
    </div>
  );
}
