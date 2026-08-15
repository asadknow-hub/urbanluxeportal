// Sources and field mapping for lead capture. Lead table fields live on the Fields hub tab.

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
  ArrowRight,
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

export type LeadInflowTab = "sources" | "mapping";

export function LeadsInflowClient({
  sources,
  statsMap,
  initialTab = "sources",
}: {
  sources: LeadSource[];
  statsMap: Record<string, number>;
  initialTab?: LeadInflowTab;
}) {
  const [tab, setTab] = useState<LeadInflowTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-slate-200">
        <TabButton active={tab === "sources"} onClick={() => setTab("sources")}>
          Sources
        </TabButton>
        <TabButton active={tab === "mapping"} onClick={() => setTab("mapping")}>
          Field Mapping
        </TabButton>
      </div>

      {tab === "sources" && <SourcesTab sources={sources} statsMap={statsMap} />}
      {tab === "mapping" && <MappingTab sources={sources} />}
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

function MappingTab({ sources }: { sources: LeadSource[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(sources[0]?.id ?? null);
  const [mappings, setMappings] = useState<Record<string, string>>({});

  const allTargetFields = STANDARD_LEAD_FIELDS;

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
