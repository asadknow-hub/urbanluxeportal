"use client";

import { useMemo, useState, useTransition } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { DocumentPreviewDialog } from "@/components/documents/document-preview-dialog";
import { deleteDocument, getSignedUrl, updateDocument } from "@/server/documents";
import { normalizeDocCategory } from "@/lib/document-storage";
import { LEAD_DOC_CHECKLIST_VALUES, type DocCategoryChoice } from "@/lib/lead-field-options";
import { formatDate, formatDateTime } from "@/lib/dates";
import type { LeadDocument } from "@/components/leads/lead-documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ExternalLink, Eye, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

type CategoryGroup = {
  cat: DocCategoryChoice;
  docs: LeadDocument[];
};

const ROW_GRID =
  "grid grid-cols-[minmax(140px,1.3fr)_6.5rem_8.5rem_8.5rem_minmax(80px,1fr)_minmax(260px,auto)] items-center gap-x-3";

function expiryDaysHint(date: string | null | undefined): string | null {
  if (!date) return null;
  const days = differenceInCalendarDays(parseISO(date), new Date());
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  return `${days}d left`;
}

function docStatus(doc: LeadDocument | undefined, cat: DocCategoryChoice): { label: string; className: string } {
  if (!doc) {
    return { label: "Not uploaded", className: "bg-white/15 text-white/90" };
  }
  if (cat.capture === "expiry" && doc.expiry_date) {
    const days = differenceInCalendarDays(parseISO(doc.expiry_date), new Date());
    if (days < 0) return { label: "Expired", className: "bg-red-500/20 text-red-100" };
    if (days <= 30) return { label: "Expiring soon", className: "bg-amber-400/25 text-amber-100" };
  }
  return { label: "Uploaded", className: "bg-emerald-500/20 text-emerald-100" };
}

function fileStatus(doc: LeadDocument, cat: DocCategoryChoice): { label: string; className: string } {
  if (cat.capture === "expiry" && doc.expiry_date) {
    const days = differenceInCalendarDays(parseISO(doc.expiry_date), new Date());
    if (days < 0) return { label: "Expired", className: "bg-red-100 text-red-800" };
    if (days <= 30) return { label: "Expiring soon", className: "bg-amber-100 text-amber-900" };
  }
  return { label: "Uploaded", className: "bg-emerald-100 text-emerald-800" };
}

function StatusPill({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold", className)}>
      {label}
    </span>
  );
}

function FileRowCells({
  doc,
  cat,
}: {
  doc: LeadDocument;
  cat: DocCategoryChoice;
}) {
  const status = fileStatus(doc, cat);
  const expiryHint = doc.expiry_date ? expiryDaysHint(doc.expiry_date) : null;

  return (
    <>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{doc.name}</p>
      </div>
      <StatusPill label={status.label} className={status.className} />
      <span className="font-mono text-[0.76rem] text-foreground">{formatDateTime(doc.created_at)}</span>
      <div className="text-[0.82rem]">
        {cat.capture === "expiry" ? (
          doc.expiry_date ? (
            <div>
              <span className="font-mono text-[0.76rem] text-foreground">{formatDate(doc.expiry_date)}</span>
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
      </div>
      <span className="truncate text-muted-foreground">{doc.notes?.trim() || "—"}</span>
    </>
  );
}

export function LeadDocumentsChecklist({
  uploadEntityType,
  uploadEntityId,
  customerId,
  documents,
  categories,
  canEdit,
  onDocumentSaved,
  onDocumentDeleted,
  onDocumentUpdated,
  embedded = false,
  sourcesHint,
  propertyChoices = [],
  defaultPropertyId = null,
}: {
  uploadEntityType: string;
  uploadEntityId: string;
  customerId?: string | null;
  documents: LeadDocument[];
  categories: DocCategoryChoice[];
  canEdit: boolean;
  onDocumentSaved?: (doc?: LeadDocument) => void;
  onDocumentDeleted?: (docId: string) => void;
  onDocumentUpdated?: (doc: LeadDocument) => void;
  embedded?: boolean;
  sourcesHint?: string;
  propertyChoices?: { id: string; label: string }[];
  defaultPropertyId?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<LeadDocument | null>(null);
  const [editing, setEditing] = useState<{ doc: LeadDocument; cat: DocCategoryChoice } | null>(null);
  const [editName, setEditName] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const groups = useMemo((): CategoryGroup[] => {
    const sorted = [...categories].sort((a, b) => {
      const ai = LEAD_DOC_CHECKLIST_VALUES.indexOf(a.value as (typeof LEAD_DOC_CHECKLIST_VALUES)[number]);
      const bi = LEAD_DOC_CHECKLIST_VALUES.indexOf(b.value as (typeof LEAD_DOC_CHECKLIST_VALUES)[number]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    return sorted.map((cat) => ({
      cat,
      docs: documents
        .filter((d) => normalizeDocCategory(d.category) === cat.value)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    }));
  }, [categories, documents]);

  const categoriesWithDocs = useMemo(
    () => groups.filter((g) => g.docs.length > 0).length,
    [groups]
  );

  function openInTab(doc: LeadDocument) {
    startTransition(async () => {
      const result = await getSignedUrl(doc.storage_path);
      if (result.ok && result.data?.url) window.open(result.data.url, "_blank", "noopener,noreferrer");
      else toast.error(result.error ?? "Could not open file");
    });
  }

  function openEdit(doc: LeadDocument, cat: DocCategoryChoice) {
    setEditing({ doc, cat });
    setEditName(doc.name);
    setEditExpiry(doc.expiry_date ?? "");
    setEditNotes(doc.notes ?? "");
  }

  function saveEdit() {
    if (!editing || !editName.trim()) return;
    const { doc, cat } = editing;
    const name = editName.trim();
    const expiry_date = cat.capture === "expiry" ? editExpiry || null : null;
    const notes = cat.capture === "note" ? editNotes.trim() || null : doc.notes?.trim() || null;
    const updated: LeadDocument = { ...doc, name, expiry_date, notes };
    onDocumentUpdated?.(updated);
    setEditing(null);
    startTransition(async () => {
      const result = await updateDocument(doc.id, { name, expiry_date, notes });
      if (!result.ok) {
        onDocumentUpdated?.(doc);
        toast.error(result.error ?? "Could not update document");
      } else {
        toast.success("Document updated");
      }
    });
  }

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

  function FileActions({ doc, cat, compact = false }: { doc: LeadDocument; cat: DocCategoryChoice; compact?: boolean }) {
    const btn = compact ? "h-7 gap-1 px-2 text-xs" : "h-7 gap-1 px-2.5 text-xs";
    return (
      <div className="flex flex-wrap justify-end gap-1">
        <Button type="button" size="sm" variant="outline" className={btn} onClick={() => setPreview(doc)}>
          <Eye className="h-3 w-3" />
          Preview
        </Button>
        <Button type="button" size="sm" variant="outline" className={btn} onClick={() => openInTab(doc)}>
          <ExternalLink className="h-3 w-3" />
          Open
        </Button>
        {canEdit ? (
          <>
            <Button type="button" size="sm" variant="outline" className={btn} onClick={() => openEdit(doc, cat)}>
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={cn(btn, "text-destructive hover:bg-destructive/10 hover:text-destructive")}
              disabled={pending}
              onClick={() => removeDoc(doc)}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn(embedded ? "" : "overflow-hidden rounded-[14px] border border-border bg-card")}>
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
            {categoriesWithDocs} of {categories.length} categories have files
          </p>
        )}
        {canEdit ? (
          <DocumentUploadDialog
            entityType={uploadEntityType}
            entityId={uploadEntityId}
            categories={categories}
            propertyId={defaultPropertyId}
            propertyChoices={propertyChoices}
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

      <div className="hidden border-b border-border bg-muted/40 px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground lg:grid lg:grid-cols-[minmax(140px,1.3fr)_6.5rem_8.5rem_8.5rem_minmax(80px,1fr)_minmax(260px,auto)] lg:gap-x-3">
        <span>Document</span>
        <span>Status</span>
        <span>Uploaded</span>
        <span>Expiry</span>
        <span>Notes</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="overflow-x-auto">
      <div className="min-w-[980px] divide-y divide-border/60">
        {(["individual", "property"] as const).map((scope) => {
          const scoped = groups.filter((g) => (g.cat.scope ?? "individual") === scope);
          if (scoped.length === 0) return null;
          return (
            <div key={scope}>
              <div className="bg-muted/50 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {scope === "property" ? "Property documents" : "Individual documents"}
              </div>
              {scoped.map(({ cat, docs }) => {
          const headerStatus = docStatus(docs[0], cat);

          if (docs.length === 0) {
            return (
              <div key={cat.value} className={cn(ROW_GRID, "px-4 py-3 hover:bg-muted/20")}>
                <p className="font-medium text-foreground">{cat.label}</p>
                <StatusPill label="Not uploaded" className="bg-muted text-muted-foreground" />
                <span className="text-muted-foreground">—</span>
                <span className="text-muted-foreground">—</span>
                <span className="text-muted-foreground">—</span>
                <div className="flex justify-end">
                  {canEdit ? (
                    <DocumentUploadDialog
                      entityType={uploadEntityType}
                      entityId={uploadEntityId}
                      fixedCategory={cat}
                      propertyId={cat.scope === "property" ? defaultPropertyId : null}
                      propertyChoices={cat.scope === "property" ? propertyChoices : []}
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
              </div>
            );
          }

          return (
            <div key={cat.value} className="px-4 py-3">
              <div className="overflow-hidden rounded-[12px] border border-primary/30 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-primary px-4 py-3 text-primary-foreground">
                  <div className="min-w-0">
                    <p className="font-heading text-[1rem] font-semibold" style={{ fontFamily: "var(--font-display), serif" }}>
                      {cat.label}
                    </p>
                    <p className="text-[0.72rem] text-white/65">
                      {docs.length} file{docs.length === 1 ? "" : "s"} uploaded
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill label={headerStatus.label} className={headerStatus.className} />
                    {canEdit ? (
                      <DocumentUploadDialog
                        entityType={uploadEntityType}
                        entityId={uploadEntityId}
                        fixedCategory={cat}
                        propertyId={cat.scope === "property" ? defaultPropertyId : null}
                        propertyChoices={cat.scope === "property" ? propertyChoices : []}
                        onSaved={(d) => onDocumentSaved?.(d as LeadDocument | undefined)}
                        trigger={
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 gap-1 border-0 bg-secondary px-2.5 text-xs text-secondary-foreground hover:bg-secondary/90"
                          >
                            <Plus className="h-3 w-3" />
                            Add new
                          </Button>
                        }
                      />
                    ) : null}
                  </div>
                </div>

                <div className="divide-y divide-border/70 bg-card">
                  {docs.map((doc, idx) => (
                    <div
                      key={doc.id}
                      className={cn(
                        ROW_GRID,
                        "gap-y-2 px-4 py-3",
                        idx % 2 === 0 ? "bg-emerald-50/40" : "bg-white"
                      )}
                    >
                      <FileRowCells doc={doc} cat={cat} />
                      <FileActions doc={doc} cat={cat} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
              })}
            </div>
          );
        })}
      </div>
      </div>

      {sourcesHint ? (
        <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">{sourcesHint}</p>
      ) : customerId ? (
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

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit document</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-4">
              <div className="rounded-[10px] border border-border bg-muted/40 px-3 py-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
                <p className="text-sm font-medium text-foreground">{editing.cat.label}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_doc_name">Name</Label>
                <Input id="edit_doc_name" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              {editing.cat.capture === "expiry" ? (
                <div className="space-y-2">
                  <Label htmlFor="edit_doc_expiry">Expiry date</Label>
                  <Input
                    id="edit_doc_expiry"
                    type="date"
                    value={editExpiry}
                    onChange={(e) => setEditExpiry(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="edit_doc_notes">Note</Label>
                  <Input
                    id="edit_doc_notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Optional note"
                  />
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button disabled={!editName.trim() || pending} onClick={saveEdit}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
