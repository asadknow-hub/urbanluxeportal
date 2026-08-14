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
import { PreferredAreasPicker } from "@/components/leads/preferred-areas-picker";
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
  { value: "off_plan", label: "Off Plan" },
  { value: "commercial", label: "Commercial" },
];

export function LeadCreateDialog({
  agents,
}: {
  agents: { id: string; full_name: string; role: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
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
    preferred_areas: [] as string[],
    language: "en",
    financing: "",
    timeframe: "",
    purpose: "",
    bedrooms: "",
    category: "",
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
        preferred_areas: form.preferred_areas,
        notes: form.notes || null,
        assigned_to: form.assigned_to || null,
        language: form.language || null,
        financing: form.financing || null,
        timeframe: form.timeframe || null,
        purpose: form.purpose || null,
        bedrooms: form.bedrooms || null,
        category: form.category || null,
        tags: [],
        custom: {},
      });
      if (result.ok) {
        toast.success("Lead created");
        setOpen(false);
        if (result.data?.id) {
          router.push(`/leads/${result.data.id}`);
        } else {
          router.push("/leads");
        }
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
          preferred_areas: [],
          language: "en",
          financing: "",
          timeframe: "",
          purpose: "",
          bedrooms: "",
          category: "",
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
          <Button {...props} className="bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20 border-0 h-11 px-6 rounded-xl font-bold transition-all">
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        )}
      />
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Required fields row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-medium">Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                placeholder="Full name"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs font-medium">Phone <span className="text-red-500">*</span></Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
                placeholder="+971501234567"
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@example.com"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Source <span className="text-red-500">*</span></Label>
              <Select value={form.source} onValueChange={(v) => set("source", v ?? "website")}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Interest <span className="text-red-500">*</span></Label>
              <Select value={form.interest} onValueChange={(v) => set("interest", v ?? "buy")}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTERESTS.map((i) => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Assign to</Label>
              <Select value={form.assigned_to} onValueChange={(v) => set("assigned_to", v ?? "")}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Unassigned" /></SelectTrigger>
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

          {/* Budget + Property details */}
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Property Requirements</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="budget_min" className="text-xs font-medium">Budget Min (AED)</Label>
                <Input id="budget_min" type="number" value={form.budget_min} onChange={(e) => set("budget_min", e.target.value)} placeholder="500000" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="budget_max" className="text-xs font-medium">Budget Max (AED)</Label>
                <Input id="budget_max" type="number" value={form.budget_max} onChange={(e) => set("budget_max", e.target.value)} placeholder="2000000" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Bedrooms</Label>
                <Select value={form.bedrooms} onValueChange={(v) => set("bedrooms", v ?? "")}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="1">1 BR</SelectItem>
                    <SelectItem value="2">2 BR</SelectItem>
                    <SelectItem value="3">3 BR</SelectItem>
                    <SelectItem value="4">4 BR</SelectItem>
                    <SelectItem value="5+">5+ BR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Category</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v ?? "")}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="penthouse">Penthouse</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Lead details */}
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Lead Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Financing</Label>
                <Select value={form.financing} onValueChange={(v) => set("financing", v ?? "")}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Unknown" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mortgage">Mortgage</SelectItem>
                    <SelectItem value="pre_approved">Pre-approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Timeframe</Label>
                <Select value={form.timeframe} onValueChange={(v) => set("timeframe", v ?? "")}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Unknown" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="1_month">1 Month</SelectItem>
                    <SelectItem value="3_months">3 Months</SelectItem>
                    <SelectItem value="6_months">6 Months</SelectItem>
                    <SelectItem value="1_year">1 Year+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Purpose</Label>
                <Select value={form.purpose} onValueChange={(v) => set("purpose", v ?? "")}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Unknown" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="end_use">End Use</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="rental_yield">Rental Yield</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Language</Label>
                <Select value={form.language} onValueChange={(v) => set("language", v ?? "en")}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t border-slate-100 pt-3">
            <PreferredAreasPicker
              value={form.preferred_areas}
              onChange={(next) => setForm((prev) => ({ ...prev, preferred_areas: next }))}
            />
          </div>

          {/* Notes */}
          <div className="border-t border-slate-100 pt-3">
            <div className="space-y-1">
              <Label htmlFor="notes" className="text-xs font-medium">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Any additional notes..."
                rows={2}
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending || !form.name || !form.phone}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
