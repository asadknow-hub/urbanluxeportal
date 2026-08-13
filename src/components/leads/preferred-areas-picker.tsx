"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DUBAI_AREAS } from "@/lib/lead-format";
import { cn } from "@/lib/utils";
import { Check, Search, X } from "lucide-react";

export function PreferredAreasPicker({
  value,
  onChange,
  label = "Preferred Areas",
  description = "Search and select one or more Dubai communities.",
  className,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  description?: string;
  className?: string;
}) {
  const [search, setSearch] = useState("");

  const filteredAreas = useMemo(() => {
    const term = search.trim().toLowerCase();
    return DUBAI_AREAS.filter((area) => {
      if (value.includes(area)) return false;
      if (!term) return true;
      return area.toLowerCase().includes(term);
    });
  }, [search, value]);

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
        <p className="text-xs text-slate-400">{description}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {value.length > 0 ? (
            value.map((area) => (
              <span
                key={area}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"
              >
                {area}
                <button
                  type="button"
                  onClick={() => removeArea(area)}
                  className="rounded-full p-0.5 text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700"
                  aria-label={`Remove ${area}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          ) : (
            <p className="text-xs text-slate-400">No areas selected yet.</p>
          )}
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Dubai areas..."
            className="pl-9"
          />
        </div>

        <ScrollArea className="mt-3 h-52 rounded-xl border border-slate-100 bg-slate-50">
          <div className="grid gap-1 p-2">
            {filteredAreas.length > 0 ? (
              filteredAreas.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => addArea(area)}
                  className={cn(
                    "group flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white hover:text-slate-900",
                    "text-slate-600"
                  )}
                >
                  <span>{area}</span>
                  <Check className="h-4 w-4 text-emerald-500 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-sm text-slate-400">
                No areas match your search.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
