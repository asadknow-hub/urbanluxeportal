import type { LeadTableField } from "@/lib/lead-table-fields";

export function LeadFieldDetailPlaceholder({ field }: { field: LeadTableField }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-foreground">{field.label}</h2>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{field.key}</p>
      </div>
      <div className="space-y-3 px-4 py-5">
        <p className="text-sm text-muted-foreground">
          This field is stored on every lead as <span className="font-mono text-foreground">{field.type}</span>.
          A managed options list has not been attached yet.
        </p>
        <p className="text-sm text-muted-foreground">
          Click <span className="font-medium text-foreground">Preferred Areas</span> on the left to edit a live list
          (Excel, paste, or one-by-one). Other fields will get the same treatment when you need them.
        </p>
      </div>
    </div>
  );
}
