"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MATCH_ROLES, propertyLabel } from "@/lib/inventory";
import { addDealProperty, removeDealProperty, applyInventoryPropertyToDeal } from "@/server/inventory";
import { toast } from "sonner";
import { Loader2, Plus, X, Building2 } from "lucide-react";
import type { InventoryChoice } from "@/components/crm/viewing-panel";

export type DealPropertyRow = {
  id: string;
  role: string;
  notes: string | null;
  property_id: string;
  property: {
    id: string;
    property_code: string;
    community: string | null;
    building_name: string | null;
    unit_number: string | null;
    property_type: string;
    bedrooms: number | null;
    status: string;
  } | null;
};

export function DealShortlist({
  dealId,
  items,
  properties,
  canEdit,
}: {
  dealId: string;
  items: DealPropertyRow[];
  properties: InventoryChoice[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [propertyId, setPropertyId] = useState("");
  const [role, setRole] = useState("shortlisted");

  function handleAdd() {
    if (!propertyId) {
      toast.error("Pick a unit");
      return;
    }
    startTransition(async () => {
      const result = await addDealProperty({ dealId, propertyId, role });
      if (result.ok) {
        toast.success("Added to shortlist");
        setPropertyId("");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not add");
      }
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      const result = await removeDealProperty(dealId, id);
      if (result.ok) router.refresh();
      else toast.error(result.error ?? "Could not remove");
    });
  }

  function handleUseForDeal(propertyId: string) {
    startTransition(async () => {
      const result = await applyInventoryPropertyToDeal(dealId, propertyId);
      if (result.ok) {
        toast.success("Property applied to deal");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not apply property");
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card p-5">
      <div className="-mx-5 -mt-5 mb-4 h-0.5 bg-primary" />
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Shortlist</h2>
        <Link href="/inventory" className="text-xs text-muted-foreground hover:text-foreground">
          Inventory
        </Link>
      </div>

      {canEdit ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <Select value={propertyId || "none"} onValueChange={(v) => setPropertyId(v === "none" ? "" : v ?? "")}>
            <SelectTrigger className="min-w-[220px] flex-1">
              <SelectValue placeholder="Add a unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Pick a unit</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {propertyLabel(property)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={role} onValueChange={(v) => setRole(v ?? "shortlisted")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATCH_ROLES.map((row) => (
                <SelectItem key={row.value} value={row.value}>
                  {row.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAdd} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No units shortlisted yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-2 rounded-[10px] border border-border/70 px-3 py-2">
              <div>
                <Link
                  href={`/inventory/${item.property_id}`}
                  className="text-sm font-medium hover:text-primary"
                >
                  {item.property ? propertyLabel(item.property) : "Unit"}
                </Link>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {MATCH_ROLES.find((row) => row.value === item.role)?.label ?? item.role}
                </p>
              </div>
              {canEdit ? (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    disabled={pending}
                    onClick={() => handleUseForDeal(item.property_id)}
                  >
                    <Building2 className="h-3 w-3" />
                    Use for deal
                  </Button>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => handleRemove(item.property_id)}
                    aria-label="Remove from shortlist"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
