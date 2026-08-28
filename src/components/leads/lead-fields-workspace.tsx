"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LeadAreasManager } from "@/components/leads/lead-areas-manager";
import { LeadNationalitiesManager } from "@/components/leads/lead-nationalities-manager";
import { LeadOptionsManager } from "@/components/leads/lead-options-manager";
import { LeadFieldDetailPlaceholder } from "@/components/leads/lead-field-detail";
import { CONFIGURABLE_LEAD_FIELDS, type LeadTableField } from "@/lib/lead-table-fields";
import { snapshotFieldGroups, type LeadSnapshotField } from "@/lib/lead-snapshot-fields";
import { isLeadOptionField, type LeadFieldOption } from "@/lib/lead-field-options";
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

const OPTION_COPY: Record<string, string> = {
  source: "This list powers Source on add lead and lead detail. Set a default assignee to route new leads from that source.",
  interest: "This list powers Interest on add lead and lead detail.",
  category: "This list powers Category on add lead and lead detail.",
  bedrooms: "This list powers Bedrooms on add lead and lead detail.",
  purpose: "This list powers Purpose on add lead and lead detail.",
  timeframe: "This list powers Timeframe on add lead and lead detail.",
  financing: "This list powers Financing on add lead and lead detail.",
  budget: "Budget bands set min and max on the lead when an agent picks one.",
  doc_category: "This list powers the category dropdown when uploading a document. Each category asks for either an expiry date (passport, visa) or a note (invoice, title deed).",
  tags: "This list powers Tags on lead detail. Agents pick from here instead of typing free text.",
  score: "Score bands label the 0–100 score on lead detail. Set min and max for each band.",
  lost_reason: "Shown when a lead is moved to a lost stage.",
  junk_reason: "Shown when a lead is moved to a junk stage.",
};

export function LeadFieldsWorkspace({
  areas,
  nationalities,
  fieldOptions,
  initialField,
  agents = [],
}: {
  areas: { id: string; name: string }[];
  nationalities: { id: string; name: string }[];
  fieldOptions: Record<string, LeadFieldOption[]>;
  initialField?: string;
  agents?: { id: string; full_name: string }[];
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
      <div className="flex max-h-[calc(100dvh-7.5rem)] flex-col overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="h-0.5 shrink-0 bg-primary" />
        <div className="shrink-0 border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-foreground">Lead fields</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            One catalog for CRM leads. Options here power lead detail and add lead.
          </p>
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
        ) : isLeadOptionField(selectedKey) ? (
          <LeadOptionsManager
            fieldKey={selectedKey}
            title={selected?.label ?? selectedKey}
            description={OPTION_COPY[selectedKey] ?? "This list powers the matching dropdown on leads."}
            options={fieldOptions[selectedKey] ?? []}
            kind={selectedKey === "budget" ? "budget" : selectedKey === "score" ? "score" : "list"}
            agents={agents}
          />
        ) : selected ? (
          <LeadFieldDetailPlaceholder field={toTableField(selected)} />
        ) : null}
      </div>
    </div>
  );
}
