"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Check, Search, X } from "lucide-react";

export function PreferredAreasPicker({
  value,
  onChange,
  areas,
  label = "Preferred Areas",
  description = "Search and select one or more Dubai communities.",
  className,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  areas: string[];
  label?: string;
  description?: string;
  className?: string;
}) {
  const [search, setSearch] = useState("");
  const selected = new Set(value);

  const filteredAreas = useMemo(() => {
    const term = search.trim().toLowerCase();
    return areas.filter((area) => {
      if (selected.has(area)) return false;
      if (!term) return true;
      return area.toLowerCase().includes(term);
    });
  }, [areas, search, selected]);

  function addArea(area: string) {
    if (value.includes(area)) return;
    onChange([...value, area]);
    setSearch("");
  }

  function removeArea(area: string) {
    onChange(value.filter((item) => item !== area));
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1">
        <Label className="text-xs font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap gap-2">
          {value.length > 0 ? (
            value.map((area) => (
              <span
                key={area}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
              >
                {area}
                <button
                  type="button"
                  onClick={() => removeArea(area)}
                  className="rounded-full p-0.5 hover:bg-background/60"
                  aria-label={`Remove ${area}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No areas selected yet.</p>
          )}
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={areas.length ? "Search areas..." : "No areas configured yet"}
            className="pl-9"
            disabled={areas.length === 0}
          />
        </div>

        <ScrollArea className="mt-3 h-52 rounded-xl border border-border bg-muted/40">
          <div className="grid gap-1 p-2">
            {areas.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                Add Dubai areas in Lead Settings, then they will appear here.
              </div>
            ) : filteredAreas.length > 0 ? (
              filteredAreas.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => addArea(area)}
                  className="group flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                >
                  <span>{area}</span>
                  <Check className="h-4 w-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                No areas match your search.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
