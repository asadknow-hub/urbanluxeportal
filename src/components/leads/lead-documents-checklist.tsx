"use client";

import { useMemo, useTransition } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { getSignedUrl } from "@/server/documents";
import { normalizeDocCategory } from "@/lib/document-storage";
import type { DocCategoryChoice } from "@/lib/lead-field-options";
import type { LeadDocument } from "@/components/leads/lead-documents";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExternalLink, Upload } from "lucide-react";
import { toast } from "sonner";

import { LEAD_DOC_CHECKLIST_VALUES } from "@/lib/lead-field-options";

function expiryLabel(date: string | null | undefined): string {
  if (!date) return "—";
  const days = differenceInCalendarDays(parseISO(date), new Date());
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Today";
  return `${days}d`;
}

export function LeadDocumentsChecklist({
  leadId,
  customerId,
  documents,
  categories,
  canEdit,
  onDocumentSaved,
  embedded = false,
}: {
  leadId: string;
  customerId?: string | null;
  documents: LeadDocument[];
  categories: DocCategoryChoice[];
  canEdit: boolean;
  onDocumentSaved?: (doc?: LeadDocument) => void;
  embedded?: boolean;
}) {
  const [, startTransition] = useTransition();

  const rows = useMemo(() => {
    const sorted = [...categories].sort((a, b) => {
      const ai = LEAD_DOC_CHECKLIST_VALUES.indexOf(a.value as (typeof LEAD_DOC_CHECKLIST_VALUES)[number]);
      const bi = LEAD_DOC_CHECKLIST_VALUES.indexOf(b.value as (typeof LEAD_DOC_CHECKLIST_VALUES)[number]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    return sorted.map((cat) => {
      const doc = documents.find((d) => normalizeDocCategory(d.category) === cat.value);
      return { cat, doc };
    });
  }, [categories, documents]);

  function openFile(path: string) {
    startTransition(async () => {
      const result = await getSignedUrl(path);
      if (result.ok && result.data?.url) window.open(result.data.url, "_blank");
      else toast.error(result.error ?? "Could not open file");
    });
  }

  const uploaded = rows.filter((r) => r.doc).length;

  return (
    <div
      className={cn(
        embedded ? "" : "overflow-hidden rounded-[14px] border border-border bg-card"
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
          embedded ? "px-0 pt-0" : "border-b border-border"
        )}
      >
        {!embedded ? (
          <div>
            <h2 className="font-heading text-[1.05rem]" style={{ fontFamily: "var(--font-display), serif" }}>
              Documents
            </h2>
            <p className="text-xs text-muted-foreground">
              {uploaded} of {rows.length} categories uploaded
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {uploaded} of {rows.length} categories uploaded — rows turn green when a file is attached
          </p>
        )}
        {canEdit ? (
          <DocumentUploadDialog
            entityType="lead"
            entityId={leadId}
            categories={categories}
            onSaved={(doc) => onDocumentSaved?.(doc as LeadDocument | undefined)}
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Upload
              </Button>
            }
          />
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5">Document</th>
              <th className="px-4 py-2.5">File</th>
              <th className="px-4 py-2.5 w-28">Expiry</th>
              <th className="px-4 py-2.5">Notes</th>
              <th className="px-4 py-2.5 w-24" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ cat, doc }) => {
              const uploadedRow = !!doc;
              return (
                <tr
                  key={cat.value}
                  className={cn(
                    "border-b border-border/60 transition-colors",
                    uploadedRow ? "bg-emerald-50/80 hover:bg-emerald-50" : "hover:bg-muted/30"
                  )}
                >
                  <td className="px-4 py-2.5 font-medium text-foreground">{cat.label}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {doc ? (
                      <span className="text-foreground">{doc.name}</span>
                    ) : (
                      <span className="italic">Not uploaded</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[0.8rem]">
                    {cat.capture === "expiry" ? (
                      <span
                        className={cn(
                          expiryLabel(doc?.expiry_date).startsWith("Expired") && "text-destructive",
                          expiryLabel(doc?.expiry_date) !== "—" &&
                            !expiryLabel(doc?.expiry_date).startsWith("Expired") &&
                            "text-emerald-700"
                        )}
                      >
                        {expiryLabel(doc?.expiry_date)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-2.5 text-muted-foreground">
                    {cat.capture === "note" ? doc?.notes?.trim() || "—" : doc?.notes?.trim() || "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      {doc ? (
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => openFile(doc.storage_path)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      ) : canEdit ? (
                        <DocumentUploadDialog
                          entityType="lead"
                          entityId={leadId}
                          categories={[cat]}
                          onSaved={(d) => onDocumentSaved?.(d as LeadDocument | undefined)}
                          trigger={
                            <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs">
                              Add
                            </Button>
                          }
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {customerId ? (
        <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          ID documents on the person profile are included in the KYC tab and customer record.
        </p>
      ) : null}
    </div>
  );
}
