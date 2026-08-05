"use client";

import { useState, useTransition } from "react";
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
import { createProperty } from "@/server/properties";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

const CATEGORIES = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "office", label: "Office" },
  { value: "retail", label: "Retail" },
  { value: "warehouse", label: "Warehouse" },
  { value: "land", label: "Land" },
  { value: "off_plan", label: "Off-Plan" },
];

export function PropertyCreateDialog({
  owners,
  agents,
}: {
  owners: { id: string; name: string; phone: string | null; email: string | null }[];
  agents: { id: string; full_name: string; role: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: "",
    description: "",
    purpose: "sale",
    category: "apartment",
    community: "",
    building: "",
    unit_no: "",
    city: "Dubai",
    bedrooms: "",
    bathrooms: "",
    size_sqft: "",
    parking: "",
    price: "",
    service_charge: "",
    owner_id: "",
    trakheesi_permit_no: "",
    dtcm_permit_no: "",
    furnishing: "",
    assigned_to: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createProperty({
        title: form.title,
        description: form.description || null,
        purpose: form.purpose as "sale" | "rent",
        category: form.category as any,
        community: form.community || null,
        building: form.building || null,
        unit_no: form.unit_no || null,
        city: form.city,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        size_sqft: form.size_sqft ? Number(form.size_sqft) : null,
        parking: form.parking ? Number(form.parking) : null,
        price: Number(form.price),
        service_charge: form.service_charge ? Number(form.service_charge) : null,
        owner_id: form.owner_id || null,
        trakheesi_permit_no: form.trakheesi_permit_no || null,
        dtcm_permit_no: form.dtcm_permit_no || null,
        furnishing: form.furnishing || null,
        amenities: [],
        assigned_to: form.assigned_to || null,
        featured: false,
      });
      if (result.ok) {
        toast.success(`Property created — ${result.data?.ref_no}`);
        setOpen(false);
        setForm({
          title: "",
          description: "",
          purpose: "sale",
          category: "apartment",
          community: "",
          building: "",
          unit_no: "",
          city: "Dubai",
          bedrooms: "",
          bathrooms: "",
          size_sqft: "",
          parking: "",
          price: "",
          service_charge: "",
          owner_id: "",
          trakheesi_permit_no: "",
          dtcm_permit_no: "",
          furnishing: "",
          assigned_to: "",
        });
      } else {
        toast.error(result.error ?? "Failed to create property");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        )}
      />
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Property</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              placeholder="e.g. Marina 2BR Apartment with Sea View"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Property description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Select value={form.purpose} onValueChange={(v) => set("purpose", v ?? "sale")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">For Sale</SelectItem>
                  <SelectItem value="rent">For Rent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v ?? "apartment")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="community">Community</Label>
              <Input
                id="community"
                value={form.community}
                onChange={(e) => set("community", e.target.value)}
                placeholder="e.g. Dubai Marina"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="building">Building</Label>
              <Input
                id="building"
                value={form.building}
                onChange={(e) => set("building", e.target.value)}
                placeholder="e.g. Marina Gate"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Beds</Label>
              <Input
                id="bedrooms"
                type="number"
                value={form.bedrooms}
                onChange={(e) => set("bedrooms", e.target.value)}
                placeholder="2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Baths</Label>
              <Input
                id="bathrooms"
                type="number"
                value={form.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)}
                placeholder="2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size_sqft">Size (sqft)</Label>
              <Input
                id="size_sqft"
                type="number"
                value={form.size_sqft}
                onChange={(e) => set("size_sqft", e.target.value)}
                placeholder="1200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parking">Parking</Label>
              <Input
                id="parking"
                type="number"
                value={form.parking}
                onChange={(e) => set("parking", e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (AED) *</Label>
              <Input
                id="price"
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                required
                placeholder="1500000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_charge">Service Charge (AED/yr)</Label>
              <Input
                id="service_charge"
                type="number"
                value={form.service_charge}
                onChange={(e) => set("service_charge", e.target.value)}
                placeholder="12000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Owner</Label>
              <Select value={form.owner_id} onValueChange={(v) => set("owner_id", v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((o) => (
                    <SelectItem key={o.id ?? ""} value={o.id ?? ""}>
                      {o.name ?? ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign Agent</Label>
              <Select value={form.assigned_to} onValueChange={(v) => set("assigned_to", v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id ?? ""} value={a.id ?? ""}>
                      {a.full_name ?? ""} ({a.role ?? ""})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trakheesi_permit_no">Trakheesi Permit</Label>
              <Input
                id="trakheesi_permit_no"
                value={form.trakheesi_permit_no}
                onChange={(e) => set("trakheesi_permit_no", e.target.value)}
                placeholder="Permit number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="furnishing">Furnishing</Label>
              <Select value={form.furnishing} onValueChange={(v) => set("furnishing", v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="furnished">Furnished</SelectItem>
                  <SelectItem value="semi_furnished">Semi-Furnished</SelectItem>
                  <SelectItem value="unfurnished">Unfurnished</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !form.title || !form.price}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Property
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
