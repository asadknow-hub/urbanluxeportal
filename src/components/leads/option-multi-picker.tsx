"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, Search, X } from "lucide-react";

export function OptionMultiPicker({
  value,
  options,
  onChange,
  emptyLabel = "None selected yet.",
}: {
  value: string[];
  options: { value: string; label: string }[];
  onChange: (next: string[]) => void;
  emptyLabel?: string;
}) {
  const [search, setSearch] = useState("");
  const selected = new Set(value);

  function isSelected(option: { value: string; label: string }) {
    return selected.has(option.value) || selected.has(option.label);
  }

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return options.filter((option) => {
      if (isSelected(option)) return false;
      if (!term) return true;
      return option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term);
    });
  }, [options, search, value]);

  function add(option: { value: string; label: string }) {
    if (isSelected(option)) return;
    onChange([...value.filter((item) => item !== option.label), option.value]);
    setSearch("");
  }

  function remove(option: { value: string; label: string }) {
    onChange(value.filter((item) => item !== option.value && item !== option.label));
  }

  const chosen = options.filter((option) => isSelected(option));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {chosen.length > 0 ? (
          chosen.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
            >
              {option.label}
              <button
                type="button"
                onClick={() => remove(option)}
                className="rounded-full p-0.5 hover:bg-background/60"
                aria-label={`Remove ${option.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">{emptyLabel}</p>
        )}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="h-8 pl-8 text-sm"
        />
      </div>
      <div className="max-h-40 space-y-0.5 overflow-y-auto">
        {visible.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn("flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted")}
            onClick={() => add(option)}
          >
            {option.label}
            <Check className="h-3.5 w-3.5 opacity-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
