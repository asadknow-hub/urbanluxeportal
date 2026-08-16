import Link from "next/link";
import { leadTableFieldGroups, type LeadTableField } from "@/lib/lead-table-fields";
import { cn } from "@/lib/utils";

export function LeadTableFieldsColumn({
  fields,
  selectedKey,
}: {
  fields: LeadTableField[];
  selectedKey: string;
}) {
  const groups = leadTableFieldGroups(fields);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-foreground">Lead table fields</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Click a field to open its options on the right.
        </p>
      </div>
      <div className="divide-y divide-border">
        {groups.map((group) => (
          <div key={group.name} className="px-2 py-3">
            <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {group.name}
            </p>
            <ul className="flex flex-col">
              {group.fields.map((field) => {
                const selected = field.key === selectedKey;
                return (
                  <li key={field.key}>
                    <Link
                      href={`/settings/leads?tab=fields&field=${encodeURIComponent(field.key)}`}
                      className={cn(
                        "flex items-baseline justify-between gap-3 rounded-md px-2 py-1.5",
                        selected ? "bg-secondary text-secondary-foreground" : "hover:bg-muted/70"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-sm">{field.label}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{field.key}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                        {field.configurable ? "options" : field.type}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
