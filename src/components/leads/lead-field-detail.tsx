import type { LeadTableField } from "@/lib/lead-table-fields";

export function LeadFieldDetailPlaceholder({
  field,
  description,
}: {
  field: LeadTableField;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-foreground">{field.label}</h2>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{field.key}</p>
      </div>
      <div className="space-y-3 px-4 py-5">
        <p className="text-sm text-muted-foreground">
          {description ?? (
            <>
              Free-text field on the lead. Agents edit it on the lead detail page. Stored as{" "}
              <span className="font-mono text-foreground">{field.type}</span>.
            </>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          Picklists (Source, Interest, Tags, and so on) are managed from the matching item in this same Fields list.
        </p>
      </div>
    </div>
  );
}
