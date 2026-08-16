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
import { type LeadFieldOption } from "@/lib/lead-field-options";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

export function LeadCreateDialog({
  agents,
  areas,
  nationalities,
  fieldOptions,
}: {
  agents: { id: string; full_name: string; role: string }[];
  areas: string[];
  nationalities: string[];
  fieldOptions: Record<string, LeadFieldOption[]>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const sources = fieldOptions.source ?? [];
  const interests = fieldOptions.interest ?? [];
  const categories = fieldOptions.category ?? [];
  const bedrooms = fieldOptions.bedrooms ?? [];
  const purposes = fieldOptions.purpose ?? [];
  const timeframes = fieldOptions.timeframe ?? [];
  const financings = fieldOptions.financing ?? [];
  const budgets = fieldOptions.budget ?? [];

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    source: sources[0]?.value ?? "",
    interest: interests[0]?.value ?? "",
    budget_min: "",
    budget_max: "",
    notes: "",
    assigned_to: "",
    preferred_areas: [] as string[],
    nationality: "",
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
        source: form.source,
        interest: form.interest,
        budget_min: form.budget_min ? Number(form.budget_min) * 100 : null,
        budget_max: form.budget_max ? Number(form.budget_max) * 100 : null,
        preferred_areas: form.preferred_areas,
        notes: form.notes || null,
        assigned_to: form.assigned_to || null,
        nationality: form.nationality || null,
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
          source: sources[0]?.value ?? "",
          interest: interests[0]?.value ?? "",
          budget_min: "",
          budget_max: "",
          notes: "",
          assigned_to: "",
          preferred_areas: [],
          nationality: "",
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
          <Button {...props} size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add lead
          </Button>
        )}
      />
      <DialogContent 
        className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-3xl md:max-w-4xl"
      >
        <DialogHeader className="border-b border-border bg-card p-5">
          <DialogTitle className="text-xl font-semibold">New lead</DialogTitle>
          <p className="text-sm text-muted-foreground">Capture prospect details</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Required fields row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Name <span className="text-primary">*</span></Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                placeholder="Full name"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">Phone <span className="text-primary">*</span></Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
                placeholder="+971501234567"
                className="h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@example.com"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Source <span className="text-primary">*</span></Label>
              <Select value={form.source || undefined} onValueChange={(v) => set("source", v ?? "")}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {sources.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Interest <span className="text-primary">*</span></Label>
              <Select value={form.interest || undefined} onValueChange={(v) => set("interest", v ?? "")}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {interests.map((i) => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Assign to</Label>
              <Select value={form.assigned_to} onValueChange={(v) => set("assigned_to", v ?? "")}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Unassigned" /></SelectTrigger>
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
          <div className="rounded-xl border border-border bg-muted/40 p-5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Property Requirements</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-medium text-muted-foreground">Budget</Label>
                <Select
                  value={
                    budgets.find(
                      (b) =>
                        Number(b.extra.min_fils) === Number(form.budget_min) * 100 &&
                        Number(b.extra.max_fils) === Number(form.budget_max) * 100
                    )?.value
                  }
                  onValueChange={(v) => {
                    const band = budgets.find((b) => b.value === v);
                    if (!band) return;
                    setForm((prev) => ({
                      ...prev,
                      budget_min: String(Number(band.extra.min_fils) / 100),
                      budget_max: String(Number(band.extra.max_fils) / 100),
                    }));
                  }}
                >
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select a band" /></SelectTrigger>
                  <SelectContent>
                    {budgets.map((b) => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Bedrooms</Label>
                <Select value={form.bedrooms || undefined} onValueChange={(v) => set("bedrooms", v ?? "")}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    {bedrooms.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Category</Label>
                <Select value={form.category || undefined} onValueChange={(v) => set("category", v ?? "")}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Lead details */}
          <div className="rounded-xl border border-border bg-muted/40 p-5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Lead Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Financing</Label>
                <Select value={form.financing || undefined} onValueChange={(v) => set("financing", v ?? "")}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Unknown" /></SelectTrigger>
                  <SelectContent>
                    {financings.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Timeframe</Label>
                <Select value={form.timeframe || undefined} onValueChange={(v) => set("timeframe", v ?? "")}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Unknown" /></SelectTrigger>
                  <SelectContent>
                    {timeframes.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Purpose</Label>
                <Select value={form.purpose || undefined} onValueChange={(v) => set("purpose", v ?? "")}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Unknown" /></SelectTrigger>
                  <SelectContent>
                    {purposes.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Nationality</Label>
                <Select value={form.nationality || undefined} onValueChange={(v) => set("nationality", v ?? "")}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {nationalities.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Areas */}
          <div className="rounded-xl border border-border bg-muted/40 p-5">
            <PreferredAreasPicker
              areas={areas}
              value={form.preferred_areas}
              onChange={(next) => setForm((prev) => ({ ...prev, preferred_areas: next }))}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-medium text-muted-foreground">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
              className="text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" className="h-11 px-6" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="h-11 px-5" disabled={pending || !form.name || !form.phone}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
