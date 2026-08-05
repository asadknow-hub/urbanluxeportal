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
import { createLead } from "@/server/leads";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

const SOURCES = [
  { value: "website", label: "Website" },
  { value: "bayut", label: "Bayut" },
  { value: "property_finder", label: "Property Finder" },
  { value: "dubizzle", label: "Dubizzle" },
  { value: "referral", label: "Referral" },
  { value: "walk_in", label: "Walk-in" },
  { value: "social", label: "Social" },
  { value: "other", label: "Other" },
];

const INTERESTS = [
  { value: "buy", label: "Buy" },
  { value: "rent", label: "Rent" },
  { value: "sell", label: "Sell" },
  { value: "off_plan", label: "Off-Plan" },
  { value: "commercial", label: "Commercial" },
];

export function LeadCreateDialog({
  agents,
}: {
  agents: { id: string; full_name: string; role: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    source: "website",
    interest: "buy",
    budget_min: "",
    budget_max: "",
    notes: "",
    assigned_to: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createLead({
        name: form.name,
        phone: form.phone || null,
        email: form.email || undefined,
        source: form.source as any,
        interest: form.interest as any,
        budget_min: form.budget_min ? Number(form.budget_min) * 100 : null,
        budget_max: form.budget_max ? Number(form.budget_max) * 100 : null,
        preferred_areas: [],
        notes: form.notes || null,
        assigned_to: form.assigned_to || null,
      });
      if (result.ok) {
        toast.success("Lead created");
        setOpen(false);
        setForm({
          name: "",
          phone: "",
          email: "",
          source: "website",
          interest: "buy",
          budget_min: "",
          budget_max: "",
          notes: "",
          assigned_to: "",
        });
      } else {
        toast.error(result.error ?? "Failed to create lead");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        )}
      />
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder="Full name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+971501234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => set("source", v ?? "website")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Interest</Label>
              <Select value={form.interest} onValueChange={(v) => set("interest", v ?? "buy")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERESTS.map((i) => (
                    <SelectItem key={i.value} value={i.value}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget_min">Budget Min (AED)</Label>
              <Input
                id="budget_min"
                type="number"
                value={form.budget_min}
                onChange={(e) => set("budget_min", e.target.value)}
                placeholder="500000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_max">Budget Max (AED)</Label>
              <Input
                id="budget_max"
                type="number"
                value={form.budget_max}
                onChange={(e) => set("budget_max", e.target.value)}
                placeholder="2000000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assign to</Label>
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !form.name}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
