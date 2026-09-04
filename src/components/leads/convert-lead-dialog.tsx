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
import { aedToFils, filsToAED, formatAED, formatAEDRange } from "@/lib/money";
import { propertyLabel } from "@/lib/inventory";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeadProposedProperty } from "@/components/leads/lead-proposed-property";

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

function proposedLabel(row: LeadProposedProperty) {
  if (!row.property) return "Property";
  return propertyLabel(row.property);
}

export function ConvertLeadDialog({
  open,
  onOpenChange,
  lead,
  proposedProperties = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: ConvertLeadPayload;
  proposedProperties?: LeadProposedProperty[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ dealId: string } | null>(null);

  const defaultDealAed = useMemo(() => {
    const fils = lead.budget_max ?? lead.budget_min ?? null;
    return fils != null ? String(filsToAED(fils)) : "";
  }, [lead.budget_min, lead.budget_max]);

  const [confirmedPropertyId, setConfirmedPropertyId] = useState<string>(
    proposedProperties[0]?.property_id ?? ""
  );
  const [dealAmountAed, setDealAmountAed] = useState(defaultDealAed);

  useEffect(() => {
    if (!open) return;
    const first = proposedProperties[0];
    setConfirmedPropertyId(first?.property_id ?? "");
    if (first?.property?.asking_price != null) {
      setDealAmountAed(String(filsToAED(first.property.asking_price)));
    } else {
      setDealAmountAed(defaultDealAed);
    }
    setResult(null);
  }, [open, proposedProperties, defaultDealAed]);

  function handleOpenChange(next: boolean) {
    if (!next) setResult(null);
    onOpenChange(next);
  }

  function handleConvert() {
    const selected = proposedProperties.find((row) => row.property_id === confirmedPropertyId);
    if (!selected?.property) {
      toast.error("Select which property is confirmed");
      return;
    }

    const amountNum = Number(dealAmountAed.replace(/,/g, ""));
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error("Enter a valid deal amount in AED");
      return;
    }

    const unit = selected.property;
    const title = propertyLabel(unit);
    const payload: ConvertLeadInput = {
      dealTitle: title,
      dealValue: aedToFils(amountNum),
      property_id: selected.property_id,
      property_title: title,
      property_community: unit.community,
      property_building: unit.building_name,
      property_unit: unit.unit_number,
      property_ref: unit.property_code,
      property_type: unit.property_type,
      property_snapshot: {
        bedrooms: unit.bedrooms != null ? String(unit.bedrooms) : lead.bedrooms,
        notes: lead.interest ?? null,
      },
      buyer_name: lead.name,
      buyer_phone: lead.phone,
      buyer_email: lead.email,
      kyc_nationality: lead.nationality,
      kyc_emirates_id: lead.emirates_id ?? null,
      kyc_passport_no: lead.passport_no ?? null,
      kyc_trn: lead.trn ?? null,
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
  const ownerRows = [
    { label: "Name", value: lead.name },
    { label: "Phone", value: lead.phone },
    { label: "Email", value: lead.email },
    { label: "Nationality", value: lead.nationality },
    { label: "Emirates ID", value: lead.emirates_id },
    { label: "Passport", value: lead.passport_no },
  ].filter((row) => Boolean(row.value?.trim()));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(36rem,calc(100vw-2rem))] gap-5 overflow-y-auto p-6 sm:max-w-xl">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>Deal opened</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              The deal is in your pipeline with this owner and confirmed property. Payment is captured on
              the deal before you mark it closed.
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
              Confirm the owner, pick the property that closed, and set the deal amount.
            </p>

            <div className="space-y-4">
              <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-emerald-800">
                  Owner
                </p>
                <dl className="grid gap-2 sm:grid-cols-2">
                  {ownerRows.map((row) => (
                    <div key={row.label} className="min-w-0">
                      <dt className="text-[0.68rem] font-semibold uppercase tracking-wide text-emerald-700/80">
                        {row.label}
                      </dt>
                      <dd className="truncate text-sm font-medium text-emerald-950">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                {budgetLabel ? (
                  <p className="mt-3 text-[0.75rem] text-emerald-800">
                    Lead budget: <span className="font-semibold">{budgetLabel}</span>
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Which property is confirmed? *</Label>
                  {proposedProperties.length === 0 ? (
                    <p className="rounded-[10px] border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                      Propose at least one property on Overview before converting.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {proposedProperties.map((row) => {
                        const active = confirmedPropertyId === row.property_id;
                        const price =
                          row.property?.asking_price != null
                            ? formatAED(row.property.asking_price)
                            : null;
                        return (
                          <button
                            key={row.id}
                            type="button"
                            onClick={() => {
                              setConfirmedPropertyId(row.property_id);
                              if (row.property?.asking_price != null) {
                                setDealAmountAed(String(filsToAED(row.property.asking_price)));
                              }
                            }}
                            className={cn(
                              "flex w-full items-start justify-between gap-3 rounded-[10px] border px-3 py-2.5 text-left transition-colors",
                              active
                                ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                                : "border-border bg-card hover:bg-muted/40"
                            )}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {proposedLabel(row)}
                              </p>
                              {price ? (
                                <p className="text-[0.72rem] text-muted-foreground">Asking {price}</p>
                              ) : null}
                            </div>
                            <span
                              className={cn(
                                "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2",
                                active ? "border-primary bg-primary" : "border-muted-foreground/40"
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="convert-deal-amount">Deal amount (AED) *</Label>
                  <Input
                    id="convert-deal-amount"
                    inputMode="decimal"
                    value={dealAmountAed}
                    onChange={(e) => setDealAmountAed(e.target.value)}
                    placeholder="e.g. 2500000"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={pending || proposedProperties.length === 0}
                onClick={handleConvert}
              >
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
