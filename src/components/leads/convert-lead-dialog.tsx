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
import { convertLead, type ConvertLeadInput } from "@/server/leads";
import { formatAEDRange } from "@/lib/money";
import { suggestedPropertyTitle } from "@/lib/lead-flow";
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
  emirates_id?: string | null;
  passport_no?: string | null;
  trn?: string | null;
};

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
      property_title: suggestedPropertyTitle(lead),
      property_community: lead.preferred_areas?.[0] ?? "",
      property_building: "",
      property_unit: "",
      property_ref: "",
      kyc_nationality: lead.nationality ?? "",
      kyc_emirates_id: lead.emirates_id ?? "",
      kyc_passport_no: lead.passport_no ?? "",
      kyc_trn: lead.trn ?? "",
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
    if (!form.buyer_name.trim()) {
      toast.error("Buyer name is required");
      return;
    }
    if (!form.property_title.trim()) {
      toast.error("Property title is required to open the deal");
      return;
    }

    const payload: ConvertLeadInput = {
      property_title: form.property_title.trim(),
      property_community: form.property_community.trim() || null,
      property_building: form.property_building.trim() || null,
      property_unit: form.property_unit.trim() || null,
      property_ref: form.property_ref.trim() || null,
      kyc_nationality: form.kyc_nationality.trim() || null,
      kyc_emirates_id: form.kyc_emirates_id.trim() || null,
      kyc_passport_no: form.kyc_passport_no.trim() || null,
      buyer_name: form.buyer_name.trim(),
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
      <DialogContent className="max-h-[90vh] w-[min(48rem,calc(100vw-2rem))] gap-5 overflow-y-auto p-6 sm:max-w-3xl">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>Deal opened</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              The deal is in your pipeline with this buyer and property. Payment is captured on the deal
              before you mark it closed.
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
              Confirm the buyer, then the property. Lead budget
              {budgetLabel ? ` (${budgetLabel})` : ""} becomes the deal value.
            </p>

            <div className="space-y-4">
              <div className="rounded-[10px] border border-border bg-muted/30 p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Buyer
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="convert-buyer-name">Buyer name *</Label>
                    <Input
                      id="convert-buyer-name"
                      value={form.buyer_name}
                      onChange={(e) => setForm({ ...form, buyer_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="convert-buyer-phone">Phone</Label>
                    <Input
                      id="convert-buyer-phone"
                      value={form.buyer_phone}
                      onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="convert-buyer-email">Email</Label>
                    <Input
                      id="convert-buyer-email"
                      type="email"
                      value={form.buyer_email}
                      onChange={(e) => setForm({ ...form, buyer_email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="convert-kyc-nationality">Nationality</Label>
                    <Input
                      id="convert-kyc-nationality"
                      value={form.kyc_nationality}
                      onChange={(e) => setForm({ ...form, kyc_nationality: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="convert-kyc-eid">Emirates ID</Label>
                    <Input
                      id="convert-kyc-eid"
                      value={form.kyc_emirates_id}
                      onChange={(e) => setForm({ ...form, kyc_emirates_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="convert-kyc-passport">Passport no.</Label>
                    <Input
                      id="convert-kyc-passport"
                      value={form.kyc_passport_no}
                      onChange={(e) => setForm({ ...form, kyc_passport_no: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[10px] border border-border bg-muted/30 p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Property
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="convert-property-title">Property title *</Label>
                    <Input
                      id="convert-property-title"
                      value={form.property_title}
                      onChange={(e) => setForm({ ...form, property_title: e.target.value })}
                      placeholder="e.g. Marina Gate 2 — 2BR sea view"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="convert-community">Community</Label>
                    <Input
                      id="convert-community"
                      value={form.property_community}
                      onChange={(e) => setForm({ ...form, property_community: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="convert-building">Building</Label>
                    <Input
                      id="convert-building"
                      value={form.property_building}
                      onChange={(e) => setForm({ ...form, property_building: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="convert-unit">Unit</Label>
                    <Input
                      id="convert-unit"
                      value={form.property_unit}
                      onChange={(e) => setForm({ ...form, property_unit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="convert-ref">Reference / permit</Label>
                    <Input
                      id="convert-ref"
                      value={form.property_ref}
                      onChange={(e) => setForm({ ...form, property_ref: e.target.value })}
                    />
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
