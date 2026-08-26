"use client";

import { useState, useTransition } from "react";
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
  LISTING_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from "@/lib/inventory";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

export function InventoryCreateDialog({
  agents,
  defaultAgentId,
}: {
  agents: { id: string; full_name: string }[];
  defaultAgentId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [form, setForm] = useState({
    community: "",
    building_name: "",
    unit_number: "",
    property_type: "apartment",
    bedrooms: "",
    bathrooms: "",
    floor: "",
    status: "available",
    developer_name: "",
    project_name: "",
    listing_type: "sale",
    asking_price_aed: "",
    trakheesi_permit_no: "",
    assigned_to: defaultAgentId ?? "",
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
        status: form.status,
        developer_name: form.developer_name || null,
        project_name: form.project_name || null,
        listing_type: form.listing_type as "sale" | "rent" | "off_plan",
        asking_price_aed: form.asking_price_aed ? Number(form.asking_price_aed) : null,
        trakheesi_permit_no: form.trakheesi_permit_no || null,
        assigned_to: form.assigned_to || null,
        notes: form.notes || null,
      });
      if (result.ok) {
        toast.success(`Saved ${result.data?.property_code}`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not save unit");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) => (
          <Button {...props}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add unit
          </Button>
        )}
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add inventory unit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="space-y-1.5">
              <Label>Floor</Label>
              <Input value={form.floor} onChange={(e) => set("floor", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v ?? "available")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_STATUSES.map((row) => (
                    <SelectItem key={row.value} value={row.value}>
                      {row.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>List as</Label>
              <Select value={form.listing_type} onValueChange={(v) => set("listing_type", v ?? "sale")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LISTING_TYPES.map((row) => (
                    <SelectItem key={row.value} value={row.value}>
                      {row.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Asking price (AED)</Label>
              <Input type="number" min={0} value={form.asking_price_aed} onChange={(e) => set("asking_price_aed", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Trakheesi permit</Label>
              <Input value={form.trakheesi_permit_no} onChange={(e) => set("trakheesi_permit_no", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Assigned agent</Label>
              <Select value={form.assigned_to || "none"} onValueChange={(v) => set("assigned_to", v === "none" ? "" : v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Agent" />
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
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save unit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
