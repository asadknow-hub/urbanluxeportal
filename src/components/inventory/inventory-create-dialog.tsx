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
      <DialogContent
        className="!flex max-h-[90vh] w-[min(36rem,95vw)] flex-col gap-0 overflow-hidden rounded-[14px] border border-secondary/25 p-0 shadow-xl sm:max-w-xl"
        closeClassName="text-white/70 hover:bg-white/10 hover:text-white"
      >
        <div className="shrink-0 bg-secondary px-6 py-5 text-center">
          <DialogHeader>
            <DialogTitle
              className="text-center text-[1.15rem] font-normal tracking-[0.12em] text-white uppercase"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              Add property
            </DialogTitle>
          </DialogHeader>
          <p className="mt-1.5 text-[0.78rem] text-white/75">
            Create a Buy, Rent, or Off-plan listing in inventory
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 w-full flex-1 flex-col">
          <div className="scrollbar-gold min-h-0 flex-1 space-y-5 overflow-y-auto bg-card px-6 py-5">
            <div>
              <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Category
              </p>
              <div className="grid grid-cols-3 gap-2">
                {LISTING_TYPES.map((row) => (
                  <button
                    key={row.value}
                    type="button"
                    onClick={() => setListingType(row.value)}
                    className={cn(
                      "rounded-[10px] border px-3 py-2.5 text-sm font-semibold transition-colors",
                      listingType === row.value
                        ? "border-secondary bg-secondary text-white shadow-sm"
                        : "border-border bg-white text-foreground hover:border-secondary/40 hover:bg-secondary/5"
                    )}
                  >
                    {row.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Community">
                <Input
                  value={form.community}
                  onChange={(e) => set("community", e.target.value)}
                  placeholder="Downtown Dubai"
                  className="h-11 rounded-[10px]"
                />
              </Field>
              <Field label="Building">
                <Input
                  value={form.building_name}
                  onChange={(e) => set("building_name", e.target.value)}
                  className="h-11 rounded-[10px]"
                />
              </Field>
              <Field label="Unit">
                <Input
                  value={form.unit_number}
                  onChange={(e) => set("unit_number", e.target.value)}
                  placeholder="1204"
                  className="h-11 rounded-[10px]"
                />
              </Field>
              <Field label="Floor">
                <Input
                  value={form.floor}
                  onChange={(e) => set("floor", e.target.value)}
                  placeholder="Optional"
                  className="h-11 rounded-[10px]"
                />
              </Field>
              <Field label="Type">
                <Select value={form.property_type} onValueChange={(v) => set("property_type", v ?? "apartment")}>
                  <SelectTrigger className="h-11 rounded-[10px]">
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
              </Field>
              <Field label="Bedrooms">
                <Input
                  type="number"
                  min={0}
                  value={form.bedrooms}
                  onChange={(e) => set("bedrooms", e.target.value)}
                  className="h-11 rounded-[10px]"
                />
              </Field>
              <Field label="Bathrooms">
                <Input
                  type="number"
                  min={0}
                  value={form.bathrooms}
                  onChange={(e) => set("bathrooms", e.target.value)}
                  className="h-11 rounded-[10px]"
                />
              </Field>
              <Field label="Price (AED)">
                <Input
                  type="number"
                  min={0}
                  value={form.asking_price_aed}
                  onChange={(e) => set("asking_price_aed", e.target.value)}
                  className="h-11 rounded-[10px]"
                />
              </Field>
            </div>

            {listingType === "sale" ? (
              <CategoryBlock title="Buy details">
                <Field label="Title deed">
                  <Input
                    value={form.title_deed_number}
                    onChange={(e) => set("title_deed_number", e.target.value)}
                    className="h-11 rounded-[10px] bg-white"
                  />
                </Field>
                <Field label="Trakheesi permit">
                  <Input
                    value={form.trakheesi_permit_no}
                    onChange={(e) => set("trakheesi_permit_no", e.target.value)}
                    className="h-11 rounded-[10px] bg-white"
                  />
                </Field>
                <Field label="Service charge (AED)">
                  <Input
                    type="number"
                    min={0}
                    value={form.service_charge_aed}
                    onChange={(e) => set("service_charge_aed", e.target.value)}
                    className="h-11 rounded-[10px] bg-white"
                  />
                </Field>
                <Field label="Mortgage available">
                  <Select value={form.mortgage_available} onValueChange={(v) => set("mortgage_available", v ?? "no")}>
                    <SelectTrigger className="h-11 rounded-[10px] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </CategoryBlock>
            ) : null}

            {listingType === "rent" ? (
              <CategoryBlock title="Rent details">
                <Field label="Frequency">
                  <Select value={form.rent_frequency} onValueChange={(v) => set("rent_frequency", v ?? "yearly")}>
                    <SelectTrigger className="h-11 rounded-[10px] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RENT_FREQUENCIES.map((row) => (
                        <SelectItem key={row.value} value={row.value}>
                          {row.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Cheques">
                  <Input
                    type="number"
                    min={0}
                    value={form.cheques}
                    onChange={(e) => set("cheques", e.target.value)}
                    className="h-11 rounded-[10px] bg-white"
                  />
                </Field>
                <Field label="Security deposit (AED)">
                  <Input
                    type="number"
                    min={0}
                    value={form.security_deposit_aed}
                    onChange={(e) => set("security_deposit_aed", e.target.value)}
                    className="h-11 rounded-[10px] bg-white"
                  />
                </Field>
                <Field label="Furnishing">
                  <Select
                    value={form.furnishing || "none"}
                    onValueChange={(v) => set("furnishing", v === "none" ? "" : v ?? "")}
                  >
                    <SelectTrigger className="h-11 rounded-[10px] bg-white">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      {FURNISHING.map((row) => (
                        <SelectItem key={row.value} value={row.value}>
                          {row.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Available from" className="sm:col-span-2">
                  <Input
                    type="date"
                    value={form.available_from}
                    onChange={(e) => set("available_from", e.target.value)}
                    className="h-11 rounded-[10px] bg-white"
                  />
                </Field>
              </CategoryBlock>
            ) : null}

            {listingType === "off_plan" ? (
              <CategoryBlock title="Off-plan details">
                <Field label="Developer">
                  <Input
                    value={form.developer_name}
                    onChange={(e) => set("developer_name", e.target.value)}
                    className="h-11 rounded-[10px] bg-white"
                  />
                </Field>
                <Field label="Project">
                  <Input
                    value={form.project_name}
                    onChange={(e) => set("project_name", e.target.value)}
                    className="h-11 rounded-[10px] bg-white"
                  />
                </Field>
                <Field label="Payment plan">
                  <Input
                    value={form.payment_plan}
                    onChange={(e) => set("payment_plan", e.target.value)}
                    placeholder="80/20, 70/30…"
                    className="h-11 rounded-[10px] bg-white"
                  />
                </Field>
                <Field label="Handover">
                  <Input
                    type="date"
                    value={form.handover_date}
                    onChange={(e) => set("handover_date", e.target.value)}
                    className="h-11 rounded-[10px] bg-white"
                  />
                </Field>
                <Field label="Oqood" className="sm:col-span-2">
                  <Input
                    value={form.oqood_number}
                    onChange={(e) => set("oqood_number", e.target.value)}
                    className="h-11 rounded-[10px] bg-white"
                  />
                </Field>
              </CategoryBlock>
            ) : null}

            {listingType !== "off_plan" ? (
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Developer">
                  <Input
                    value={form.developer_name}
                    onChange={(e) => set("developer_name", e.target.value)}
                    placeholder="Optional"
                    className="h-11 rounded-[10px]"
                  />
                </Field>
                <Field label="Project">
                  <Input
                    value={form.project_name}
                    onChange={(e) => set("project_name", e.target.value)}
                    placeholder="Optional"
                    className="h-11 rounded-[10px]"
                  />
                </Field>
              </div>
            ) : null}

            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Owner">
                <Select value={form.owner_id || "none"} onValueChange={(v) => set("owner_id", v === "none" ? "" : v ?? "")}>
                  <SelectTrigger className="h-11 rounded-[10px]">
                    <span className="truncate">
                      {owners.find((o) => o.id === form.owner_id)?.name ?? "Unassigned"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Assigned agent">
                <Select
                  value={form.assigned_to || "none"}
                  onValueChange={(v) => set("assigned_to", v === "none" ? "" : v ?? "")}
                >
                  <SelectTrigger className="h-11 rounded-[10px]">
                    <span className="truncate">
                      {agents.find((a) => a.id === form.assigned_to)?.full_name ?? "Unassigned"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Notes">
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className="rounded-[10px]"
                placeholder="Optional notes about this listing"
              />
            </Field>
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-border bg-secondary/5 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-[42px] rounded-full px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="h-[42px] rounded-full bg-secondary px-5 text-white hover:bg-secondary/90"
            >
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save property
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function CategoryBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-[12px] border border-secondary/25 bg-secondary/8 p-4">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-secondary">{title}</p>
      <div className="grid gap-3.5 sm:grid-cols-2">{children}</div>
    </div>
  );
}
