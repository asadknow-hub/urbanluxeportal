"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, Search } from "lucide-react";

export function NationalityPicker({
  value,
  options,
  onChange,
  autoFocus,
  onCancel,
}: {
  value: string;
  options: string[];
  onChange: (next: string) => void;
  autoFocus?: boolean;
  onCancel?: () => void;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term ? options.filter((item) => item.toLowerCase().includes(term)) : options;
    return list.slice(0, 80);
  }, [options, search]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search nationality"
          className="h-8 pl-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancel?.();
          }}
        />
      </div>
      <div className="max-h-48 overflow-y-auto rounded-md border border-border">
        <button
          type="button"
          className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
          onClick={() => onChange("")}
        >
          Clear
        </button>
        {filtered.map((item) => (
          <button
            key={item}
            type="button"
            className={cn(
              "flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-muted",
              item === value && "bg-secondary"
            )}
            onClick={() => onChange(item)}
          >
            {item}
            {item === value && <Check className="h-3.5 w-3.5" />}
          </button>
        ))}
      </div>
    </div>
  );
}
