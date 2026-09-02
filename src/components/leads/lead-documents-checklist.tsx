"use client";

import { useMemo, useState, useTransition } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { DocumentPreviewDialog } from "@/components/documents/document-preview-dialog";
import { deleteDocument } from "@/server/documents";
import { normalizeDocCategory } from "@/lib/document-storage";
import { LEAD_DOC_CHECKLIST_VALUES, type DocCategoryChoice } from "@/lib/lead-field-options";
import { formatDate, formatDateTime } from "@/lib/dates";
import type { LeadDocument } from "@/components/leads/lead-documents";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

type ChecklistRow =
  | { kind: "empty"; cat: DocCategoryChoice }
  | { kind: "doc"; cat: DocCategoryChoice; doc: LeadDocument };

function expiryDaysHint(date: string | null | undefined): string | null {
  if (!date) return null;
  const days = differenceInCalendarDays(parseISO(date), new Date());
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  return `${days}d left`;
}

function docStatus(
  row: ChecklistRow
): { label: string; className: string } {
  if (row.kind === "empty") {
    return {
      label: "Not uploaded",
      className: "bg-muted text-muted-foreground",
    };
  }
  const { cat, doc } = row;
  if (cat.capture === "expiry" && doc.expiry_date) {
    const days = differenceInCalendarDays(parseISO(doc.expiry_date), new Date());
    if (days < 0) {
      return { label: "Expired", className: "bg-red-100 text-red-800" };
    }
    if (days <= 30) {
      return { label: "Expiring soon", className: "bg-amber-100 text-amber-900" };
    }
  }
  return { label: "Uploaded", className: "bg-emerald-100 text-emerald-800" };
}

function StatusBadge({ row }: { row: ChecklistRow }) {
  const status = docStatus(row);
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold", status.className)}>
      {status.label}
    </span>
  );
}

export function LeadDocumentsChecklist({
  leadId,
  customerId,
  documents,
  categories,
  canEdit,
  onDocumentSaved,
  onDocumentDeleted,
  embedded = false,
}: {
  leadId: string;
  customerId?: string | null;
  documents: LeadDocument[];
  categories: DocCategoryChoice[];
  canEdit: boolean;
  onDocumentSaved?: (doc?: LeadDocument) => void;
  onDocumentDeleted?: (docId: string) => void;
  embedded?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<LeadDocument | null>(null);

  const rows = useMemo(() => {
    const sorted = [...categories].sort((a, b) => {
      const ai = LEAD_DOC_CHECKLIST_VALUES.indexOf(a.value as (typeof LEAD_DOC_CHECKLIST_VALUES)[number]);
      const bi = LEAD_DOC_CHECKLIST_VALUES.indexOf(b.value as (typeof LEAD_DOC_CHECKLIST_VALUES)[number]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    const result: ChecklistRow[] = [];
    for (const cat of sorted) {
      const docs = documents
        .filter((d) => normalizeDocCategory(d.category) === cat.value)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      if (docs.length === 0) {
        result.push({ kind: "empty", cat });
      } else {
        for (const doc of docs) {
          result.push({ kind: "doc", cat, doc });
        }
      }
    }
    return result;
  }, [categories, documents]);

  const categoriesWithDocs = useMemo(() => {
    const set = new Set<string>();
    for (const doc of documents) set.add(normalizeDocCategory(doc.category));
    return set.size;
  }, [documents]);

  function removeDoc(doc: LeadDocument) {
    if (!window.confirm(`Delete "${doc.name}"?`)) return;
    onDocumentDeleted?.(doc.id);
    startTransition(async () => {
      const result = await deleteDocument(doc.id);
      if (!result.ok) {
        onDocumentSaved?.(doc);
        toast.error(result.error ?? "Could not delete document");
      } else {
        toast.success("Document deleted");
      }
    });
  }

  function showCategoryLabel(row: ChecklistRow, index: number): boolean {
    if (index === 0) return true;
    const prev = rows[index - 1];
    return prev.cat.value !== row.cat.value;
  }

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
              {categoriesWithDocs} of {categories.length} categories have files
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {categoriesWithDocs} of {categories.length} categories have files — rows turn green when uploaded
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
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5">Document</th>
              <th className="px-4 py-2.5 w-32">Status</th>
              <th className="px-4 py-2.5 w-36">Uploaded</th>
              <th className="px-4 py-2.5 w-36">Expiry</th>
              <th className="px-4 py-2.5">Notes</th>
              <th className="px-4 py-2.5 w-[220px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const uploadedRow = row.kind === "doc";
              const cat = row.cat;
              const doc = row.kind === "doc" ? row.doc : undefined;
              const showLabel = showCategoryLabel(row, index);
              const expiryHint = doc?.expiry_date ? expiryDaysHint(doc.expiry_date) : null;

              return (
                <tr
                  key={row.kind === "doc" ? row.doc.id : `empty-${cat.value}`}
                  className={cn(
                    "border-b border-border/60 transition-colors",
                    uploadedRow ? "bg-emerald-50/70 hover:bg-emerald-50" : "hover:bg-muted/30"
                  )}
                >
                  <td className="px-4 py-2.5">
                    {showLabel ? (
                      <p className="font-medium text-foreground">{cat.label}</p>
                    ) : (
                      <p className="pl-3 text-xs text-muted-foreground">↳ additional file</p>
                    )}
                    {doc ? (
                      <p className={cn("truncate text-[0.82rem] text-muted-foreground", showLabel ? "mt-0.5" : "")}>
                        {doc.name}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge row={row} />
                  </td>
                  <td className="px-4 py-2.5 text-[0.82rem] text-muted-foreground">
                    {doc ? (
                      <span className="font-mono text-[0.78rem] text-foreground">{formatDateTime(doc.created_at)}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[0.82rem]">
                    {cat.capture === "expiry" && doc ? (
                      doc.expiry_date ? (
                        <div>
                          <span className="font-mono text-[0.78rem] text-foreground">{formatDate(doc.expiry_date)}</span>
                          {expiryHint ? (
                            <span
                              className={cn(
                                "mt-0.5 block text-[0.72rem]",
                                expiryHint.startsWith("Expired") ? "text-destructive" : "text-muted-foreground"
                              )}
                            >
                              {expiryHint}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="italic text-muted-foreground">No date set</span>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-2.5 text-muted-foreground">
                    {doc?.notes?.trim() || "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {doc ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={() => setPreview(doc)}
                          >
                            <Eye className="h-3 w-3" />
                            Preview
                          </Button>
                          {canEdit ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={pending}
                                onClick={() => removeDoc(doc)}
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                              <DocumentUploadDialog
                                entityType="lead"
                                entityId={leadId}
                                fixedCategory={cat}
                                onSaved={(d) => onDocumentSaved?.(d as LeadDocument | undefined)}
                                trigger={
                                  <Button type="button" size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs">
                                    <Plus className="h-3 w-3" />
                                    Add new
                                  </Button>
                                }
                              />
                            </>
                          ) : null}
                        </>
                      ) : canEdit ? (
                        <DocumentUploadDialog
                          entityType="lead"
                          entityId={leadId}
                          fixedCategory={cat}
                          onSaved={(d) => onDocumentSaved?.(d as LeadDocument | undefined)}
                          trigger={
                            <Button type="button" size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs">
                              <Plus className="h-3 w-3" />
                              Add new
                            </Button>
                          }
                        />
                      ) : (
                        <span className="text-xs italic text-muted-foreground">—</span>
                      )}
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

      {preview ? (
        <DocumentPreviewDialog
          open={!!preview}
          onOpenChange={(open) => {
            if (!open) setPreview(null);
          }}
          title={preview.name}
          storagePath={preview.storage_path}
          mimeType={preview.mime_type}
        />
      ) : null}
    </div>
  );
}
