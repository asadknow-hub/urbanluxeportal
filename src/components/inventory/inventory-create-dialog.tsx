"use client";

import { useState, useTransition, cloneElement, isValidElement, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createProperty } from "@/server/inventory";
import {
  FURNISHING,
  LISTING_TYPES,
  PROPERTY_TYPES,
  RENT_FREQUENCIES,
} from "@/lib/inventory";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type ListingKind = "sale" | "rent" | "off_plan";

export function InventoryCreateDialog({
  agents,
  defaultAgentId,
  owners = [],
  triggerLabel = "Add property",
  trigger,
  navigateOnCreate = true,
  onCreated,
  defaultListingType,
}: {
  agents: { id: string; full_name: string }[];
  defaultAgentId?: string;
  owners?: { id: string; name: string }[];
  triggerLabel?: string;
  trigger?: ReactNode;
  navigateOnCreate?: boolean;
  onCreated?: (data: { id: string; property_code: string }) => void | Promise<void>;
  defaultListingType?: ListingKind;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [listingType, setListingType] = useState<ListingKind>(defaultListingType ?? "sale");
  const [form, setForm] = useState({
    community: "",
    building_name: "",
    unit_number: "",
    property_type: "apartment",
    bedrooms: "",
    bathrooms: "",
    floor: "",
    developer_name: "",
    project_name: "",
    asking_price_aed: "",
    trakheesi_permit_no: "",
    title_deed_number: "",
    service_charge_aed: "",
    mortgage_available: "no",
    furnishing: "",
    available_from: "",
    rent_frequency: "yearly",
    security_deposit_aed: "",
    cheques: "",
    payment_plan: "",
    handover_date: "",
    oqood_number: "",
    assigned_to: defaultAgentId ?? "",
    owner_id: "",
    notes: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createProperty({
        community: form.community || null,
        building_name: form.building_name || null,
        unit_number: form.unit_number || null,
        property_type: form.property_type,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        floor: form.floor || null,
        status: listingType === "off_plan" ? "off_plan" : "available",
        developer_name: form.developer_name || null,
        project_name: form.project_name || null,
        project_type: listingType === "off_plan" ? "off_plan" : "ready",
        listing_type: listingType,
        asking_price_aed: form.asking_price_aed ? Number(form.asking_price_aed) : null,
        trakheesi_permit_no: form.trakheesi_permit_no || null,
        title_deed_number: form.title_deed_number || null,
        oqood_number: form.oqood_number || null,
        furnishing: (form.furnishing || null) as "furnished" | "semi" | "unfurnished" | null,
        available_from: form.available_from || null,
        rent_frequency: listingType === "rent" ? (form.rent_frequency as "yearly" | "monthly" | "weekly") : null,
        security_deposit_aed: form.security_deposit_aed ? Number(form.security_deposit_aed) : null,
        cheques: form.cheques ? Number(form.cheques) : null,
        service_charge_aed: form.service_charge_aed ? Number(form.service_charge_aed) : null,
        payment_plan: form.payment_plan || null,
        handover_date: form.handover_date || null,
        mortgage_available: listingType === "sale" ? form.mortgage_available === "yes" : null,
        assigned_to: form.assigned_to || null,
        owner_id: form.owner_id || null,
        notes: form.notes || null,
      });
      if (result.ok) {
        toast.success(`Saved ${result.data?.property_code}`);
        setOpen(false);
        if (result.data && onCreated) await onCreated(result.data);
        if (navigateOnCreate && result.data?.id) {
          router.push(`/inventory/${result.data.id}`);
        }
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not save property");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) =>
          trigger && isValidElement(trigger) ? (
            cloneElement(trigger, props as never)
          ) : (
            <Button {...props}>
              <Plus className="mr-1.5 h-4 w-4" />
              {triggerLabel}
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add property</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Category
            </p>
            <div className="grid grid-cols-3 gap-2">
              {LISTING_TYPES.map((row) => (
                <button
                  key={row.value}
                  type="button"
                  onClick={() => setListingType(row.value)}
                  className={cn(
                    "rounded-[10px] border px-3 py-2.5 text-sm font-semibold",
                    listingType === row.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  )}
                >
                  {row.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Community</Label>
              <Input value={form.community} onChange={(e) => set("community", e.target.value)} placeholder="Downtown Dubai" />
            </div>
            <div className="space-y-1.5">
              <Label>Building</Label>
              <Input value={form.building_name} onChange={(e) => set("building_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input value={form.unit_number} onChange={(e) => set("unit_number", e.target.value)} placeholder="1204" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.property_type} onValueChange={(v) => set("property_type", v ?? "apartment")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((row) => (
                    <SelectItem key={row.value} value={row.value}>
                      {row.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Bedrooms</Label>
              <Input type="number" min={0} value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Bathrooms</Label>
              <Input type="number" min={0} value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Price (AED)</Label>
              <Input type="number" min={0} value={form.asking_price_aed} onChange={(e) => set("asking_price_aed", e.target.value)} />
            </div>
          </div>

          {listingType === "sale" ? (
            <div className="grid gap-3 rounded-[12px] border border-border bg-muted/20 p-3 sm:grid-cols-2">
              <p className="sm:col-span-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Buy</p>
              <div className="space-y-1.5">
                <Label>Title deed</Label>
                <Input value={form.title_deed_number} onChange={(e) => set("title_deed_number", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Trakheesi permit</Label>
                <Input value={form.trakheesi_permit_no} onChange={(e) => set("trakheesi_permit_no", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Service charge (AED)</Label>
                <Input type="number" min={0} value={form.service_charge_aed} onChange={(e) => set("service_charge_aed", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Mortgage available</Label>
                <Select value={form.mortgage_available} onValueChange={(v) => set("mortgage_available", v ?? "no")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {listingType === "rent" ? (
            <div className="grid gap-3 rounded-[12px] border border-[#fdba74] bg-[#fff7ed] p-3 sm:grid-cols-2">
              <p className="sm:col-span-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#9a3412]">Rent</p>
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Select value={form.rent_frequency} onValueChange={(v) => set("rent_frequency", v ?? "yearly")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RENT_FREQUENCIES.map((row) => (
                      <SelectItem key={row.value} value={row.value}>{row.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cheques</Label>
                <Input type="number" min={0} value={form.cheques} onChange={(e) => set("cheques", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Security deposit (AED)</Label>
                <Input type="number" min={0} value={form.security_deposit_aed} onChange={(e) => set("security_deposit_aed", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Furnishing</Label>
                <Select value={form.furnishing || "none"} onValueChange={(v) => set("furnishing", v === "none" ? "" : v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    {FURNISHING.map((row) => (
                      <SelectItem key={row.value} value={row.value}>{row.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Available from</Label>
                <Input type="date" value={form.available_from} onChange={(e) => set("available_from", e.target.value)} />
              </div>
            </div>
          ) : null}

          {listingType === "off_plan" ? (
            <div className="grid gap-3 rounded-[12px] border border-[#c4b5fd] bg-[#f5f3ff] p-3 sm:grid-cols-2">
              <p className="sm:col-span-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#5b21b6]">Off-plan</p>
              <div className="space-y-1.5">
                <Label>Developer</Label>
                <Input value={form.developer_name} onChange={(e) => set("developer_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Project</Label>
                <Input value={form.project_name} onChange={(e) => set("project_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Payment plan</Label>
                <Input value={form.payment_plan} onChange={(e) => set("payment_plan", e.target.value)} placeholder="80/20, 70/30…" />
              </div>
              <div className="space-y-1.5">
                <Label>Handover</Label>
                <Input type="date" value={form.handover_date} onChange={(e) => set("handover_date", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Oqood</Label>
                <Input value={form.oqood_number} onChange={(e) => set("oqood_number", e.target.value)} />
              </div>
            </div>
          ) : null}

          {listingType !== "off_plan" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Developer</Label>
                <Input value={form.developer_name} onChange={(e) => set("developer_name", e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <Label>Project</Label>
                <Input value={form.project_name} onChange={(e) => set("project_name", e.target.value)} placeholder="Optional" />
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Select value={form.owner_id || "none"} onValueChange={(v) => set("owner_id", v === "none" ? "" : v ?? "")}>
                <SelectTrigger>
                  <span className="truncate">{owners.find((o) => o.id === form.owner_id)?.name ?? "Unassigned"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>{owner.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assigned agent</Label>
              <Select value={form.assigned_to || "none"} onValueChange={(v) => set("assigned_to", v === "none" ? "" : v ?? "")}>
                <SelectTrigger>
                  <span className="truncate">{agents.find((a) => a.id === form.assigned_to)?.full_name ?? "Unassigned"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save property"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
