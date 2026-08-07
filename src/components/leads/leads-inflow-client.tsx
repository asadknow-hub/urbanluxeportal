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
} from "lucide-react";
import { cn } from "@/lib/utils";

type LeadSource = {
  id: string;
  kind: string;
  name: string;
  token: string | null;
  secret: string | null;
  config: Record<string, unknown>;
  is_active: boolean;
  stats: Record<string, unknown>;
  created_at: string;
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

export function LeadsInflowClient({
  sources,
  statsMap,
}: {
  sources: LeadSource[];
  statsMap: Record<string, number>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    kind: "web_form",
    name: "",
    token: "",
    secret: "",
  });

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
    setForm({
      kind: source.kind,
      name: source.name,
      token: source.token ?? "",
      secret: source.secret ?? "",
    });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* Add button */}
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(KIND_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                  placeholder="e.g. Main Website Form"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Token / API Key (optional)</Label>
                <Input
                  id="token"
                  value={form.token}
                  onChange={(e) => set("token", e.target.value)}
                  placeholder="API token or key"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret">Secret (optional)</Label>
                <Input
                  id="secret"
                  type="password"
                  value={form.secret}
                  onChange={(e) => set("secret", e.target.value)}
                  placeholder="Webhook secret"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending || !form.name}>
                  {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sources grid */}
      {sources.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <div className="text-center">
            <p className="text-sm text-slate-400">No lead sources configured yet</p>
            <p className="text-xs text-slate-300 mt-1">
              Add sources like website forms, Instagram, Facebook, or portal integrations
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((source) => {
            const Icon = KIND_ICONS[source.kind] ?? MoreHorizontal;
            const colorClass = KIND_COLORS[source.kind] ?? KIND_COLORS.other;
            const leadCount = statsMap[source.id] ?? 0;

            return (
              <div
                key={source.id}
                className={cn(
                  "rounded-xl border bg-white p-4 shadow-sm transition-all",
                  source.is_active ? "border-slate-200" : "border-slate-200 opacity-60"
                )}
              >
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
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      source.is_active
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    {source.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span>{leadCount} leads</span>
                  {source.token && (
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Token set
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => handleEdit(source)}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => handleToggle(source.id, source.is_active)}
                    disabled={pending}
                  >
                    <Power className="mr-1 h-3 w-3" />
                    {source.is_active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(source.id, source.name)}
                    disabled={pending}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
