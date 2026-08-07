// ─── Leads Inflow Client Component ─────────────────────────────
//
// This component manages three tabs:
//   1. Sources — CRUD for lead_sources (where leads come from)
//   2. Field Configuration — CRUD for custom_field_defs (what fields leads have)
//   3. Field Mapping — configure how raw incoming data maps to lead fields
//
// ARCHITECTURE NOTES:
//   - Custom fields are stored in leads.custom JSONB, keyed by field def key
//   - Deleting a field definition is SOFT (is_active = false)
//     Data in leads.custom[key] is PRESERVED, not deleted
//   - Re-activating a field with the same key makes old data visible again
//   - Field keys are immutable after creation (prevents data orphaning)
//   - Field mapping on lead_sources translates raw incoming field names
//     to lead field keys (e.g., "full_name" -> "name")

"use client";

import { useState, useTransition, useEffect } from "react";
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
import {
  createLeadSource,
  updateLeadSource,
  toggleLeadSource,
  deleteLeadSource,
  createCustomFieldDef,
  updateCustomFieldDef,
  deleteCustomFieldDef,
  reactivateCustomFieldDef,
  updateLeadSourceMapping,
} from "@/server/leads";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Globe,
  Camera,
  Share2,
  Search,
  Building2,
  ShoppingBag,
  Users,
  Zap,
  Upload,
  MoreHorizontal,
  Trash2,
  Power,
  Pencil,
  Settings2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────

type LeadSource = {
  id: string;
  kind: string;
  name: string;
  token: string | null;
  secret: string | null;
  config: Record<string, unknown>;
  field_mapping: Record<string, unknown>;
  is_active: boolean;
  stats: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type FieldDef = {
  id: string;
  entity: string;
  key: string;
  label: string;
  type: string;
  options: Array<{ value: string; label: string }> | null;
  required: boolean;
  show_on_card: boolean;
  show_in_list: boolean;
  group_name: string | null;
  sort: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

// ─── Constants ─────────────────────────────────────────────────

const KIND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  web_form: Globe,
  instagram: Camera,
  facebook: Share2,
  google_ads: Search,
  property_finder: Building2,
  bayut: Building2,
  dubizzle: ShoppingBag,
  referral: Users,
  walk_in: Users,
  api: Zap,
  import: Upload,
  other: MoreHorizontal,
};

const KIND_LABELS: Record<string, string> = {
  web_form: "Web Form",
  instagram: "Instagram",
  facebook: "Facebook",
  google_ads: "Google Ads",
  property_finder: "Property Finder",
  bayut: "Bayut",
  dubizzle: "Dubizzle",
  referral: "Referral",
  walk_in: "Walk-in",
  api: "API",
  import: "Import",
  other: "Other",
};

const KIND_COLORS: Record<string, string> = {
  web_form: "bg-blue-50 text-blue-600 border-blue-200",
  instagram: "bg-pink-50 text-pink-600 border-pink-200",
  facebook: "bg-indigo-50 text-indigo-600 border-indigo-200",
  google_ads: "bg-amber-50 text-amber-600 border-amber-200",
  property_finder: "bg-emerald-50 text-emerald-600 border-emerald-200",
  bayut: "bg-red-50 text-red-600 border-red-200",
  dubizzle: "bg-orange-50 text-orange-600 border-orange-200",
  referral: "bg-purple-50 text-purple-600 border-purple-200",
  walk_in: "bg-teal-50 text-teal-600 border-teal-200",
  api: "bg-slate-50 text-slate-600 border-slate-200",
  import: "bg-cyan-50 text-cyan-600 border-cyan-200",
  other: "bg-gray-50 text-gray-600 border-gray-200",
};

const FIELD_TYPES: Record<string, string> = {
  text: "Text",
  textarea: "Text Area",
  number: "Number",
  money: "Money (AED)",
  select: "Select (dropdown)",
  multiselect: "Multi-Select",
  date: "Date",
  checkbox: "Checkbox",
  phone: "Phone",
  url: "URL",
};

// Standard lead fields that can be mapped to (not custom fields)
const STANDARD_LEAD_FIELDS = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "source", label: "Source" },
  { key: "interest", label: "Interest" },
  { key: "budget_min", label: "Budget Min" },
  { key: "budget_max", label: "Budget Max" },
  { key: "preferred_areas", label: "Preferred Areas" },
  { key: "notes", label: "Notes" },
  { key: "language", label: "Language" },
  { key: "financing", label: "Financing" },
  { key: "timeframe", label: "Timeframe" },
  { key: "purpose", label: "Purpose" },
  { key: "bedrooms", label: "Bedrooms" },
  { key: "category", label: "Category" },
  { key: "tags", label: "Tags" },
];

type Tab = "sources" | "fields" | "mapping";

// ─── Main Component ────────────────────────────────────────────

export function LeadsInflowClient({
  sources,
  fieldDefs,
  statsMap,
}: {
  sources: LeadSource[];
  fieldDefs: FieldDef[];
  statsMap: Record<string, number>;
}) {
  const [tab, setTab] = useState<Tab>("sources");

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200">
        <TabButton active={tab === "sources"} onClick={() => setTab("sources")}>
          Sources
        </TabButton>
        <TabButton active={tab === "fields"} onClick={() => setTab("fields")}>
          Field Configuration
        </TabButton>
        <TabButton active={tab === "mapping"} onClick={() => setTab("mapping")}>
          Field Mapping
        </TabButton>
      </div>

      {tab === "sources" && <SourcesTab sources={sources} statsMap={statsMap} />}
      {tab === "fields" && <FieldsTab fieldDefs={fieldDefs} />}
      {tab === "mapping" && <MappingTab sources={sources} fieldDefs={fieldDefs} />}
    </div>
  );
}

// ─── Tab Button ────────────────────────────────────────────────

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
        active
          ? "border-emerald-500 text-emerald-600"
          : "border-transparent text-slate-500 hover:text-slate-700"
      )}
    >
      {children}
    </button>
  );
}

// ─── Sources Tab ───────────────────────────────────────────────

function SourcesTab({ sources, statsMap }: { sources: LeadSource[]; statsMap: Record<string, number> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ kind: "web_form", name: "", token: "", secret: "" });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm({ kind: "web_form", name: "", token: "", secret: "" });
    setEditId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      if (editId) {
        const result = await updateLeadSource(editId, {
          kind: form.kind as any,
          name: form.name,
          token: form.token || null,
          secret: form.secret || null,
        });
        if (result.ok) {
          toast.success("Source updated");
          setOpen(false);
          resetForm();
          router.refresh();
        } else {
          toast.error(result.error ?? "Failed");
        }
      } else {
        const result = await createLeadSource({
          kind: form.kind as any,
          name: form.name,
          token: form.token || null,
          secret: form.secret || null,
        } as any);
        if (result.ok) {
          toast.success("Source created");
          setOpen(false);
          resetForm();
          router.refresh();
        } else {
          toast.error(result.error ?? "Failed");
        }
      }
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleLeadSource(id, !current);
      if (result.ok) {
        toast.success(`Source ${!current ? "activated" : "deactivated"}`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteLeadSource(id);
      if (result.ok) {
        toast.success("Source deleted");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleEdit(source: LeadSource) {
    setEditId(source.id);
    setForm({ kind: source.kind, name: source.name, token: source.token ?? "", secret: source.secret ?? "" });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger
            render={(props) => (
              <Button {...props} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="mr-2 h-4 w-4" />
                Add Source
              </Button>
            )}
          />
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Source" : "Add Lead Source"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Source Type</Label>
                <Select value={form.kind} onValueChange={(v) => set("kind", v ?? "web_form")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(KIND_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Main Website Form" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">Token / API Key (optional)</Label>
                <Input id="token" value={form.token} onChange={(e) => set("token", e.target.value)} placeholder="API token or key" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secret">Secret (optional)</Label>
                <Input id="secret" type="password" value={form.secret} onChange={(e) => set("secret", e.target.value)} placeholder="Webhook secret" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" disabled={pending || !form.name}>
                  {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {sources.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <div className="text-center">
            <p className="text-sm text-slate-400">No lead sources configured yet</p>
            <p className="text-xs text-slate-300 mt-1">Add sources like website forms, Instagram, Facebook, or portal integrations</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((source) => {
            const Icon = KIND_ICONS[source.kind] ?? MoreHorizontal;
            const colorClass = KIND_COLORS[source.kind] ?? KIND_COLORS.other;
            const leadCount = statsMap[source.id] ?? 0;
            return (
              <div key={source.id} className={cn("rounded-xl border bg-white p-4 shadow-sm transition-all", source.is_active ? "border-slate-200" : "border-slate-200 opacity-60")}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg border", colorClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{source.name}</h3>
                      <p className="text-xs text-slate-400">{KIND_LABELS[source.kind] ?? source.kind}</p>
                    </div>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", source.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                    {source.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span>{leadCount} leads</span>
                  {source.token && <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Token set</span>}
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleEdit(source)}><Pencil className="mr-1 h-3 w-3" />Edit</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleToggle(source.id, source.is_active)} disabled={pending}><Power className="mr-1 h-3 w-3" />{source.is_active ? "Disable" : "Enable"}</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-600" onClick={() => handleDelete(source.id, source.name)} disabled={pending}><Trash2 className="mr-1 h-3 w-3" />Delete</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Fields Tab ────────────────────────────────────────────────
//
// This tab manages custom field definitions.
// Fields are stored in custom_field_defs (metadata) and leads.custom (data).
// Deleting = soft delete (is_active = false). Data is PRESERVED.

function FieldsTab({ fieldDefs }: { fieldDefs: FieldDef[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    key: "",
    label: "",
    type: "text",
    group_name: "",
    required: false,
    show_on_card: false,
    show_in_list: false,
    optionsText: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm({ key: "", label: "", type: "text", group_name: "", required: false, show_on_card: false, show_in_list: false, optionsText: "" });
    setEditId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      let options: Array<{ value: string; label: string }> | null = null;
      if (form.type === "select" || form.type === "multiselect") {
        if (form.optionsText.trim()) {
          const lines = form.optionsText.trim().split("\n").map((l) => l.trim()).filter(Boolean);
          if (lines.length === 0) {
            toast.error("Please add at least one option");
            return;
          }
          options = lines.map((line) => {
            const colonIdx = line.indexOf(":");
            if (colonIdx > 0) {
              const value = line.slice(0, colonIdx).trim();
              const label = line.slice(colonIdx + 1).trim();
              return { value, label: label || value };
            }
            const value = line.toLowerCase().replace(/\s+/g, "_");
            return { value, label: line };
          });
        }
      }

      if (editId) {
        const result = await updateCustomFieldDef(editId, {
          label: form.label,
          type: form.type as any,
          options,
          required: form.required,
          show_on_card: form.show_on_card,
          show_in_list: form.show_in_list,
          group_name: form.group_name || null,
        });
        if (result.ok) {
          toast.success("Field updated");
          setOpen(false);
          resetForm();
          router.refresh();
        } else {
          toast.error(result.error ?? "Failed");
        }
      } else {
        const result = await createCustomFieldDef({
          key: form.key,
          label: form.label,
          type: form.type as any,
          options,
          required: form.required,
          show_on_card: form.show_on_card,
          show_in_list: form.show_in_list,
          group_name: form.group_name || null,
        } as any);
        if (result.ok) {
          toast.success("Field created");
          setOpen(false);
          resetForm();
          router.refresh();
        } else {
          toast.error(result.error ?? "Failed");
        }
      }
    });
  }

  function handleEdit(def: FieldDef) {
    setEditId(def.id);
    setForm({
      key: def.key,
      label: def.label,
      type: def.type,
      group_name: def.group_name ?? "",
      required: def.required,
      show_on_card: def.show_on_card,
      show_in_list: def.show_in_list,
      optionsText: def.options ? def.options.map((o) => o.value === o.label ? o.label : `${o.value}:${o.label}`).join("\n") : "",
    });
    setOpen(true);
  }

  function handleDelete(def: FieldDef) {
    if (!confirm(`Deactivate field "${def.label}"?\n\nData in existing leads will be PRESERVED but hidden.\nYou can re-activate later to see the data again.`)) return;
    startTransition(async () => {
      const result = await deleteCustomFieldDef(def.id);
      if (result.ok) {
        toast.success("Field deactivated (data preserved)");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleReactivate(def: FieldDef) {
    startTransition(async () => {
      const result = await reactivateCustomFieldDef(def.id);
      if (result.ok) {
        toast.success("Field re-activated");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  const activeFields = fieldDefs.filter((f) => f.is_active);
  const inactiveFields = fieldDefs.filter((f) => !f.is_active);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
        <p className="font-semibold mb-1">What are custom fields?</p>
        <p>Custom fields are extra fields you can add to every lead beyond the standard ones (name, phone, email, budget, etc.).
        They appear on the lead detail page and can be edited just like standard fields.</p>
        <p className="mt-1">For example: Visa Status, Referred By, Pre-Approval Amount, Nationality, etc.</p>
        <p className="mt-1 text-blue-500">Deleting a field <strong>preserves existing data</strong> — it only hides the field. Re-activating makes data visible again.</p>
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger
            render={(props) => (
              <Button {...props} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="mr-2 h-4 w-4" />
                Add Field
              </Button>
            )}
          />
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Field" : "Add Custom Field"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key">Key (snake_case) *</Label>
                <Input
                  id="key"
                  value={form.key}
                  onChange={(e) => set("key", e.target.value)}
                  required={!editId}
                  disabled={!!editId}
                  placeholder="e.g. visa_status"
                  className={editId ? "bg-slate-50 text-slate-400" : ""}
                />
                {editId && <p className="text-xs text-slate-400">Key cannot be changed after creation (prevents data orphaning)</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label *</Label>
                <Input id="label" value={form.label} onChange={(e) => set("label", e.target.value)} required placeholder="e.g. Visa Status" />
              </div>
              <div className="space-y-2">
                <Label>Field Type</Label>
                <Select value={form.type} onValueChange={(v) => set("type", v ?? "text")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FIELD_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(form.type === "select" || form.type === "multiselect") && (
                <div className="space-y-2">
                  <Label htmlFor="optionsText">Options (one per line)</Label>
                  <Textarea
                    id="optionsText"
                    value={form.optionsText}
                    onChange={(e) => set("optionsText", e.target.value)}
                    placeholder={`Cash\nMortgage\nPre-approved\nNot sure`}
                    rows={4}
                  />
                  <p className="text-xs text-slate-400">Each line becomes a dropdown option. Use <code>value:Label</code> format for custom values (e.g. <code>cash:Cash Buyer</code>)</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="group_name">Group Name (optional)</Label>
                <Input id="group_name" value={form.group_name} onChange={(e) => set("group_name", e.target.value)} placeholder="e.g. Background" />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.required} onChange={(e) => set("required", e.target.checked)} />
                  Required
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.show_on_card} onChange={(e) => set("show_on_card", e.target.checked)} />
                  Show on board card
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.show_in_list} onChange={(e) => set("show_in_list", e.target.checked)} />
                  Show in list view
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" disabled={pending || (!editId && !form.key) || !form.label}>
                  {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {activeFields.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Active Fields ({activeFields.length})</h3>
          <div className="space-y-2">
            {activeFields.map((def) => (
              <div key={def.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900">{def.label}</span>
                    <span className="text-xs text-slate-400 font-mono">{def.key} · {FIELD_TYPES[def.type] ?? def.type}</span>
                  </div>
                  {def.group_name && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{def.group_name}</span>}
                  {def.required && <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-500">required</span>}
                  {def.show_on_card && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-500">on card</span>}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleEdit(def)}><Pencil className="mr-1 h-3 w-3" />Edit</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-600" onClick={() => handleDelete(def)} disabled={pending}><Trash2 className="mr-1 h-3 w-3" />Deactivate</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inactiveFields.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-400">Inactive Fields ({inactiveFields.length})</h3>
          <p className="text-xs text-slate-400">Data in leads.custom is preserved. Re-activate to make it visible again.</p>
          <div className="space-y-2">
            {inactiveFields.map((def) => (
              <div key={def.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 opacity-70">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-600">{def.label}</span>
                    <span className="text-xs text-slate-400 font-mono">{def.key} · {FIELD_TYPES[def.type] ?? def.type}</span>
                  </div>
                  {def.deleted_at && <span className="text-xs text-slate-400">Deactivated {new Date(def.deleted_at).toLocaleDateString()}</span>}
                </div>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 hover:text-emerald-700" onClick={() => handleReactivate(def)} disabled={pending}>
                  <RotateCcw className="mr-1 h-3 w-3" />Re-activate
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {fieldDefs.length === 0 && (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <div className="text-center">
            <Settings2 className="mx-auto h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400 mt-2">No custom fields defined yet</p>
            <p className="text-xs text-slate-300 mt-1">Add fields like visa status, referred by, or pre-approval amount</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mapping Tab ───────────────────────────────────────────────
//
// This tab lets admins configure how raw incoming data from each source
// maps to lead fields. The mapping is stored in lead_sources.field_mapping.
//
// Format: { "raw_field_name": "lead_field_key" }
// For custom fields: { "raw_field_name": "custom.field_key" }
//
// If field_mapping is empty {}, the system assumes raw field names
// already match lead field keys (identity mapping).

function MappingTab({ sources, fieldDefs }: { sources: LeadSource[]; fieldDefs: FieldDef[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(sources[0]?.id ?? null);
  const [mappings, setMappings] = useState<Record<string, string>>({});

  const selectedSource = sources.find((s) => s.id === selectedSourceId);
  const activeFieldDefs = fieldDefs.filter((f) => f.is_active);

  const allTargetFields = [
    ...STANDARD_LEAD_FIELDS,
    ...activeFieldDefs.map((f) => ({ key: `custom.${f.key}`, label: `${f.label} (custom)` })),
  ];

  // Load mapping when source changes
  function loadMapping(sourceId: string) {
    const source = sources.find((s) => s.id === sourceId);
    const rawMapping = source?.field_mapping as Record<string, unknown> | undefined;
    if (rawMapping && typeof rawMapping === "object") {
      const stringMap: Record<string, string> = {};
      for (const [k, v] of Object.entries(rawMapping)) {
        stringMap[k] = String(v);
      }
      setMappings(stringMap);
    } else {
      setMappings({});
    }
  }

  // Initialize on mount
  useEffect(() => {
    if (selectedSourceId) loadMapping(selectedSourceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSourceId]);

  function handleSourceChange(sourceId: string) {
    setSelectedSourceId(sourceId);
  }

  function addMapping() {
    const key = `field_${Date.now()}`;
    setMappings((prev) => ({ ...prev, [key]: "" }));
  }

  function updateMappingKey(oldKey: string, newKey: string) {
    setMappings((prev) => {
      const next = { ...prev };
      const value = next[oldKey];
      delete next[oldKey];
      next[newKey] = value;
      return next;
    });
  }

  function updateMappingValue(key: string, value: string) {
    setMappings((prev) => ({ ...prev, [key]: value }));
  }

  function removeMapping(key: string) {
    setMappings((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleSave() {
    if (!selectedSourceId) return;
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(mappings)) {
      if (k.trim() && v.trim()) {
        clean[k.trim()] = v.trim();
      }
    }
    startTransition(async () => {
      const result = await updateLeadSourceMapping(selectedSourceId, clean);
      if (result.ok) {
        toast.success("Field mapping saved");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  if (sources.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
        <div className="text-center">
          <p className="text-sm text-slate-400">No lead sources to configure mapping for</p>
          <p className="text-xs text-slate-300 mt-1">Add a source first in the Sources tab</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
        <strong>Field Mapping</strong> defines how raw incoming data from a source translates to your lead fields.
        For example, a web form might send <code>full_name</code> which maps to <code>name</code>.
        For custom fields, use the <code>custom.</code> prefix (e.g., <code>custom.visa_status</code>).
        If no mapping is set, the system assumes field names already match.
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm whitespace-nowrap">Source:</Label>
        <Select value={selectedSourceId ?? undefined} onValueChange={(v) => handleSourceChange(v ?? "")}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Select source" /></SelectTrigger>
          <SelectContent>
            {sources.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {Object.entries(mappings).length === 0 && (
          <p className="text-sm text-slate-400 py-4 text-center">No mappings configured. Fields will use identity mapping (raw name = lead field).</p>
        )}
        {Object.entries(mappings).map(([rawKey, leadField]) => (
          <div key={rawKey} className="flex items-center gap-2">
            <Input
              value={rawKey}
              onChange={(e) => updateMappingKey(rawKey, e.target.value)}
              placeholder="Raw field name"
              className="flex-1"
            />
            <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
            <Select value={leadField} onValueChange={(v) => updateMappingValue(rawKey, v ?? "")}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Lead field" /></SelectTrigger>
              <SelectContent>
                {allTargetFields.map((f) => (
                  <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeMapping(rawKey)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={addMapping}>
          <Plus className="mr-2 h-4 w-4" />
          Add Mapping
        </Button>
        <Button onClick={handleSave} disabled={pending || !selectedSourceId} size="sm" className="bg-emerald-500 hover:bg-emerald-600">
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Mapping
        </Button>
      </div>
    </div>
  );
}
