"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStatusColor } from "@/lib/status-colors";
import { formatPropertyType, propertyLabel } from "@/lib/inventory";
import { assignPropertyOwner, searchInventory } from "@/server/inventory";
import { toast } from "sonner";
import { Building2, ExternalLink, Loader2, Plus, Search, Unlink } from "lucide-react";

export type OwnedPropertyRow = {
  id: string;
  property_code: string;
  community: string | null;
  building_name: string | null;
  unit_number: string | null;
  property_type: string;
  bedrooms: number | null;
  status: string;
};

type SearchHit = {
  id: string;
  property_code: string;
  community: string | null;
  building_name: string | null;
  unit_number: string | null;
  property_type: string;
  bedrooms: number | null;
  status: string;
};

export function CustomerOwnerSection({
  customerId,
  owned,
  canEdit,
}: {
  customerId: string;
  owned: OwnedPropertyRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);

  const ownedIds = useMemo(() => new Set(owned.map((row) => row.id)), [owned]);

  function runSearch(next: string) {
    setQuery(next);
    const q = next.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    setSearching(true);
    startTransition(async () => {
      const result = await searchInventory(q);
      setSearching(false);
      if (result.ok) setHits((result.data ?? []).filter((row) => !ownedIds.has(row.id)));
      else toast.error(result.error ?? "Search failed");
    });
  }

  function linkProperty(propertyId: string) {
    startTransition(async () => {
      const result = await assignPropertyOwner(propertyId, customerId);
      if (result.ok) {
        toast.success("Property linked as owned");
        setPickerOpen(false);
        setQuery("");
        setHits([]);
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not link");
      }
    });
  }

  function unlinkProperty(propertyId: string) {
    startTransition(async () => {
      const result = await assignPropertyOwner(propertyId, null);
      if (result.ok) {
        toast.success("Owner link removed");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not unlink");
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-sky-200/80 bg-sky-50/50">
      <div className="h-0.5 bg-sky-600" />
      <div className="flex items-start justify-between gap-3 border-b border-sky-200/70 bg-sky-100/60 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-sky-950">
            Owner
            <span className="ml-2 font-medium text-sky-800/70">({owned.length})</span>
          </h2>
          <p className="mt-0.5 text-xs text-sky-900/65">Inventory units this person owns</p>
        </div>
        {canEdit ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 border-sky-300 bg-white/80 text-sky-900 hover:bg-white"
            onClick={() => setPickerOpen(true)}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Link property
          </Button>
        ) : null}
      </div>

      {owned.length === 0 ? (
        <p className="px-5 py-6 text-sm text-sky-900/60">No owned inventory linked yet.</p>
      ) : (
        <ul className="divide-y divide-sky-200/60">
          {owned.map((row) => {
            const colors = getStatusColor(row.status);
            return (
              <li key={row.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-200/50 text-sky-800">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/inventory/${row.id}`}
                    className="text-sm font-semibold text-sky-950 hover:underline"
                  >
                    {propertyLabel(row)}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-sky-900/65">
                    <span className="font-medium">{row.property_code}</span>
                    <span aria-hidden>·</span>
                    <span>{formatPropertyType(row.property_type)}</span>
                    {row.bedrooms != null ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>{row.bedrooms} bed</span>
                      </>
                    ) : null}
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${colors.bg} ${colors.text}`}
                    >
                      {row.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/inventory/${row.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-sky-800 hover:underline"
                  >
                    Open
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  {canEdit ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 text-sky-900/70 hover:text-destructive"
                      disabled={pending}
                      onClick={() => unlinkProperty(row.id)}
                    >
                      <Unlink className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link owned property</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => runSearch(e.target.value)}
              placeholder="Search inventory…"
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {searching || pending ? (
              <p className="flex items-center gap-2 px-1 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </p>
            ) : query.trim().length < 2 ? (
              <p className="px-1 py-3 text-sm text-muted-foreground">Type at least 2 characters.</p>
            ) : hits.length === 0 ? (
              <p className="px-1 py-3 text-sm text-muted-foreground">No matching units.</p>
            ) : (
              hits.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted"
                  onClick={() => linkProperty(row.id)}
                >
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{propertyLabel(row)}</span>
                    <span className="block text-xs text-muted-foreground">
                      {row.property_code} · {formatPropertyType(row.property_type)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
