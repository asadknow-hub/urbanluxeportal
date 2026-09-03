"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InventoryCreateDialog } from "@/components/inventory/inventory-create-dialog";
import { propertyLabel } from "@/lib/inventory";
import { addLeadProperty, removeLeadProperty } from "@/server/inventory";
import { toast } from "sonner";
import { Building2, Link2, Loader2, Plus, Search, X } from "lucide-react";
import type { InventoryChoice } from "@/components/crm/viewing-panel";

export type LeadProposedProperty = {
  id: string;
  property_id: string;
  role: string;
  property: {
    id: string;
    property_code: string;
    community: string | null;
    building_name: string | null;
    unit_number: string | null;
    property_type: string;
    bedrooms: number | null;
  } | null;
};

export function LeadProposedPropertySection({
  leadId,
  dealId,
  linked,
  inventory,
  agents,
  defaultAgentId,
  canEdit,
  canCreateProperty,
  defaultListingType,
}: {
  leadId: string;
  dealId?: string | null;
  linked: LeadProposedProperty[];
  inventory: InventoryChoice[];
  agents: { id: string; full_name: string }[];
  defaultAgentId?: string;
  canEdit: boolean;
  canCreateProperty: boolean;
  defaultListingType?: "sale" | "rent" | "off_plan";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const linkedIds = useMemo(() => new Set(linked.map((row) => row.property_id)), [linked]);

  const choices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inventory
      .filter((unit) => !linkedIds.has(unit.id))
      .filter((unit) => {
        if (!q) return true;
        const hay = [unit.property_code, unit.community, unit.building_name, unit.unit_number]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 40);
  }, [inventory, linkedIds, query]);

  function connect(propertyId: string) {
    startTransition(async () => {
      const result = await addLeadProperty({
        leadId,
        propertyId,
        role: "proposed",
        dealId: dealId ?? null,
      });
      if (result.ok) {
        toast.success("Property connected");
        setPickerOpen(false);
        setQuery("");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not connect property");
      }
    });
  }

  function disconnect(propertyId: string) {
    startTransition(async () => {
      const result = await removeLeadProperty(leadId, propertyId);
      if (result.ok) {
        toast.success("Property removed");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not remove");
      }
    });
  }

  return (
    <div className="mt-5 border-t border-border/70 pt-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            Proposed property
          </h3>
          <p className="mt-1 text-sm text-foreground">
            Do you have a property to connect that you are proposing?
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Link a unit from inventory, or create a new Buy / Rent / Off-plan file.
          </p>
        </div>
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
              <DialogTrigger
                render={(props) => (
                  <Button {...props} type="button" size="sm" variant="outline" className="gap-1.5">
                    <Link2 className="h-3.5 w-3.5" />
                    From inventory
                  </Button>
                )}
              />
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Connect from inventory</DialogTitle>
                </DialogHeader>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search code, community, building…"
                    className="pl-9"
                    autoFocus
                  />
                </div>
                <div className="max-h-[320px] space-y-1 overflow-y-auto">
                  {choices.length === 0 ? (
                    <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                      No matching units. Create a new property instead.
                    </p>
                  ) : (
                    choices.map((unit) => (
                      <button
                        key={unit.id}
                        type="button"
                        disabled={pending}
                        onClick={() => connect(unit.id)}
                        className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-transparent px-3 py-2.5 text-left hover:border-border hover:bg-muted/50"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{propertyLabel(unit)}</span>
                          <span className="block text-xs capitalize text-muted-foreground">
                            {unit.property_type.replace(/_/g, " ")}
                            {unit.bedrooms != null ? ` · ${unit.bedrooms} bed` : ""}
                          </span>
                        </span>
                        {pending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                      </button>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {canCreateProperty ? (
              <InventoryCreateDialog
                agents={agents}
                defaultAgentId={defaultAgentId}
                triggerLabel="Create new"
                navigateOnCreate={false}
                defaultListingType={defaultListingType}
                onCreated={async (created) => {
                  const result = await addLeadProperty({
                    leadId,
                    propertyId: created.id,
                    role: "proposed",
                    dealId: dealId ?? null,
                  });
                  if (result.ok) {
                    toast.success("Property created and connected");
                    router.refresh();
                  } else {
                    toast.error(result.error ?? "Created, but could not connect to lead");
                    router.refresh();
                  }
                }}
                trigger={
                  <Button type="button" size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Create new
                  </Button>
                }
              />
            ) : null}
          </div>
        ) : null}
      </div>

      {linked.length === 0 ? (
        <p className="rounded-[12px] border border-dashed border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
          No proposed property yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {linked.map((row) => {
            const unit = row.property;
            const label = unit
              ? propertyLabel(unit)
              : "Property";
            return (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-card px-3 py-2.5"
              >
                <div className="min-w-0">
                  <Link href={`/inventory/${row.property_id}`} className="text-sm font-medium hover:text-primary">
                    {label}
                  </Link>
                  <p className="text-xs capitalize text-muted-foreground">
                    {row.role.replace(/_/g, " ")}
                    {unit?.property_type ? ` · ${unit.property_type.replace(/_/g, " ")}` : ""}
                  </p>
                </div>
                {canEdit ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => disconnect(row.property_id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Disconnect property"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
