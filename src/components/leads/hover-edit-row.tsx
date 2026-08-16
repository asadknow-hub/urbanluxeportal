"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HoverEditRow({
  label,
  display,
  editing,
  canEdit,
  onEdit,
  trailing,
  className,
  children,
}: {
  label: string;
  display: ReactNode;
  editing: boolean;
  canEdit: boolean;
  onEdit: () => void;
  trailing?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  if (editing) {
    return (
      <div className={cn("rounded-lg bg-muted/60 px-3 py-2", className)}>
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <div className="mt-1">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors", canEdit && "hover:bg-muted/70", className)}>
      <button
        type="button"
        disabled={!canEdit}
        onClick={onEdit}
        className="min-w-0 flex-1 text-left disabled:cursor-default"
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm text-foreground">{display}</div>
      </button>
      {trailing}
    </div>
  );
}

export function BlurSaveInput({
  value,
  type = "text",
  onSave,
  onCancel,
}: {
  value: string;
  type?: string;
  onSave: (next: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  function commit() {
    const next = ref.current?.value ?? "";
    if (next.trim() === value.trim()) {
      onCancel();
      return;
    }
    onSave(next);
  }

  return (
    <input
      ref={ref}
      type={type}
      defaultValue={value}
      className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
        if (e.key === "Escape") onCancel();
      }}
    />
  );
}
