"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LeadAreasManager } from "@/components/leads/lead-areas-manager";
import { LeadNationalitiesManager } from "@/components/leads/lead-nationalities-manager";
import { LeadFieldDetailPlaceholder } from "@/components/leads/lead-field-detail";
import { CONFIGURABLE_LEAD_FIELDS, type LeadTableField } from "@/lib/lead-table-fields";
import { snapshotFieldGroups, type LeadSnapshotField } from "@/lib/lead-snapshot-fields";
import { cn } from "@/lib/utils";

function toTableField(field: LeadSnapshotField): LeadTableField {
  return {
    key: field.key,
    label: field.label,
    type: field.kind,
    group: field.group,
    configurable: CONFIGURABLE_LEAD_FIELDS.has(field.key),
  };
}

export function LeadFieldsWorkspace({
  areas,
  nationalities,
  initialField,
}: {
  areas: { id: string; name: string }[];
  nationalities: { id: string; name: string }[];
  initialField?: string;
}) {
  const router = useRouter();
  const groups = snapshotFieldGroups();
  const keys = groups.flatMap((g) => g.fields.map((f) => f.key));
  const [selectedKey, setSelectedKey] = useState(
    initialField && keys.includes(initialField) ? initialField : "preferred_areas"
  );
  const selected = groups.flatMap((g) => g.fields).find((f) => f.key === selectedKey);

  function select(key: string) {
    setSelectedKey(key);
    router.replace(`/settings/leads?tab=fields&field=${encodeURIComponent(key)}`, { scroll: false });
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
      <div className="flex max-h-[calc(100dvh-7.5rem)] flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="shrink-0 border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-foreground">Lead fields</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Same fields as the lead detail page.</p>
        </div>
        <div className="scrollbar-gold min-h-0 flex-1 overflow-y-auto py-2">
          {groups.map((group) => (
            <div key={group.name} className="px-2 py-2">
              <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {group.name}
              </p>
              <ul className="flex flex-col">
                {group.fields.map((field) => {
                  const active = field.key === selectedKey;
                  return (
                    <li key={field.key}>
                      <button
                        type="button"
                        onClick={() => select(field.key)}
                        className={cn(
                          "flex w-full items-baseline justify-between gap-3 rounded-md px-2 py-1.5 text-left",
                          active ? "bg-secondary text-secondary-foreground" : "hover:bg-muted/70"
                        )}
                      >
                        <span className="truncate text-sm">{field.label}</span>
                        <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                          {CONFIGURABLE_LEAD_FIELDS.has(field.key) ? "options" : field.kind}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="scrollbar-gold max-h-[calc(100dvh-7.5rem)] overflow-y-auto xl:sticky xl:top-16">
        {selectedKey === "preferred_areas" ? (
          <LeadAreasManager areas={areas} />
        ) : selectedKey === "nationality" ? (
          <LeadNationalitiesManager nationalities={nationalities} />
        ) : selected ? (
          <LeadFieldDetailPlaceholder field={toTableField(selected)} />
        ) : null}
      </div>
    </div>
  );
}
