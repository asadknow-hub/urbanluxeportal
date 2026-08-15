import { leadTableFieldGroups, type LeadTableField } from "@/lib/lead-table-fields";

export function LeadTableFieldsColumn({ fields }: { fields: LeadTableField[] }) {
  const groups = leadTableFieldGroups(fields);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-foreground">Lead table fields</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Live columns on the leads table. New database fields appear here automatically.
        </p>
      </div>
      {fields.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Could not read lead columns yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {groups.map((group) => (
            <div key={group.name} className="px-4 py-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {group.name}
              </p>
              <ul className="flex flex-col gap-1">
                {group.fields.map((field) => (
                  <li key={field.key} className="flex items-baseline justify-between gap-3 rounded-md px-1 py-1.5">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{field.label}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{field.key}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
                      {field.type}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
