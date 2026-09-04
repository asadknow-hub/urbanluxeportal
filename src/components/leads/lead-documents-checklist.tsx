"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
import { ChevronLeft, ChevronRight, ExternalLink, Eye, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

type CategoryGroup = {
  cat: DocCategoryChoice;
  docs: LeadDocument[];
};

function expiryDaysHint(date: string | null | undefined): string | null {
  if (!date) return null;
  const days = differenceInCalendarDays(parseISO(date), new Date());
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  return `${days}d left`;
}

function fileStatus(doc: LeadDocument, cat: DocCategoryChoice): { label: string; className: string } {
  if (cat.capture === "expiry" && doc.expiry_date) {
    const days = differenceInCalendarDays(parseISO(doc.expiry_date), new Date());
    if (days < 0) return { label: "Expired", className: "bg-red-100 text-red-800" };
    if (days <= 30) return { label: "Expiring soon", className: "bg-amber-100 text-amber-900" };
  }
  return { label: "Uploaded", className: "bg-emerald-100 text-emerald-800" };
}

function nearestExpiryHint(docs: LeadDocument[], cat: DocCategoryChoice): string | null {
  if (cat.capture !== "expiry") return null;
  const dated = docs
    .map((doc) => doc.expiry_date)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => a.localeCompare(b));
  if (!dated[0]) return null;
  return expiryDaysHint(dated[0]);
}

function scopeCompletedStyles(tone: "client" | "property") {
  if (tone === "property") {
    return {
      card: "border-secondary/35 bg-secondary/8",
      header: "border-b border-secondary/20 bg-secondary/15",
      file: "bg-secondary/5",
    };
  }
  return {
    card: "border-primary/35 bg-primary/8",
    header: "border-b border-primary/20 bg-primary/12",
    file: "bg-primary/5",
  };
}

function StatusPill({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold", className)}>
      {label}
    </span>
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
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(defaultPropertyId ?? null);

  useEffect(() => {
    const ids = propertyChoices.map((p) => p.id);
    if (ids.length === 0) {
      setSelectedPropertyId(null);
      return;
    }
    setSelectedPropertyId((prev) => {
      if (prev && ids.includes(prev)) return prev;
      if (defaultPropertyId && ids.includes(defaultPropertyId)) return defaultPropertyId;
      return ids[0] ?? null;
    });
  }, [propertyChoices, defaultPropertyId]);

  const selectedPropertyIndex = useMemo(() => {
    if (!selectedPropertyId) return -1;
    return propertyChoices.findIndex((p) => p.id === selectedPropertyId);
  }, [propertyChoices, selectedPropertyId]);

  const selectedPropertyLabel =
    propertyChoices.find((p) => p.id === selectedPropertyId)?.label ?? null;

  const groups = useMemo((): CategoryGroup[] => {
    const sorted = [...categories].sort((a, b) => {
      const ai = LEAD_DOC_CHECKLIST_VALUES.indexOf(a.value as (typeof LEAD_DOC_CHECKLIST_VALUES)[number]);
      const bi = LEAD_DOC_CHECKLIST_VALUES.indexOf(b.value as (typeof LEAD_DOC_CHECKLIST_VALUES)[number]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    return sorted.map((cat) => {
      const isPropertyScope = (cat.scope ?? "individual") === "property";
      const docs = documents
        .filter((d) => normalizeDocCategory(d.category) === cat.value)
        .filter((d) => {
          if (!isPropertyScope) return true;
          if (!selectedPropertyId) return !d.property_id;
          // Exact property match; unscoped legacy property docs appear on the first proposed unit only.
          if (d.property_id === selectedPropertyId) return true;
          if (!d.property_id && selectedPropertyIndex <= 0) return true;
          return false;
        })
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      return { cat, docs };
    });
  }, [categories, documents, selectedPropertyId, selectedPropertyIndex]);

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

  function FileActions({ doc, cat }: { doc: LeadDocument; cat: DocCategoryChoice }) {
    return (
      <div className="flex flex-wrap justify-end gap-0.5">
        <Button type="button" size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-[0.68rem]" onClick={() => setPreview(doc)}>
          <Eye className="h-3 w-3" />
          Preview
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-[0.68rem]" onClick={() => openInTab(doc)}>
          <ExternalLink className="h-3 w-3" />
          Open
        </Button>
        {canEdit ? (
          <>
            <Button type="button" size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-[0.68rem]" onClick={() => openEdit(doc, cat)}>
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 gap-1 px-1.5 text-[0.68rem] text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={pending}
              onClick={() => removeDoc(doc)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        ) : null}
      </div>
    );
  }

  const clientGroups = useMemo(
    () => groups.filter((g) => (g.cat.scope ?? "individual") === "individual"),
    [groups]
  );
  const propertyGroups = useMemo(
    () => groups.filter((g) => (g.cat.scope ?? "individual") === "property"),
    [groups]
  );
  const showSplit = clientGroups.length > 0 && propertyGroups.length > 0;

  function renderScopeColumn(title: string, scoped: CategoryGroup[], tone: "client" | "property") {
    if (scoped.length === 0) return null;
    const filled = scoped.filter((g) => g.docs.length > 0).length;
    const activePropertyId = tone === "property" ? selectedPropertyId : null;
    const showPropertySlider = tone === "property" && propertyChoices.length > 1;
    const showPropertyEmpty = tone === "property" && propertyChoices.length === 0;

    return (
      <div className={cn("overflow-hidden rounded-[14px] border border-border bg-card", showSplit && "min-w-0")}>
        <div
          className={cn(
            "flex items-center justify-between gap-2 px-3 py-2.5 text-white",
            tone === "client" ? "bg-primary" : "bg-secondary"
          )}
        >
          <div className="min-w-0">
            <h3 className="font-heading text-[1rem] leading-tight" style={{ fontFamily: "var(--font-display), serif" }}>
              {title}
            </h3>
            <p className="text-[0.68rem] text-white/70">
              {showPropertyEmpty
                ? "Propose a property to attach docs"
                : `${filled} of ${scoped.length} have files`}
            </p>
          </div>
          {canEdit && !showPropertyEmpty ? (
            <DocumentUploadDialog
              entityType={uploadEntityType}
              entityId={uploadEntityId}
              categories={scoped.map((g) => g.cat)}
              propertyId={activePropertyId}
              propertyChoices={tone === "property" ? propertyChoices : []}
              onSaved={(doc) => onDocumentSaved?.(doc as LeadDocument | undefined)}
              trigger={
                <Button
                  size="sm"
                  variant="secondary"
                  className={cn(
                    "h-7 gap-1 border-0 px-2 text-xs shrink-0",
                    tone === "client"
                      ? "bg-white/15 text-white hover:bg-white/25"
                      : "bg-white/20 text-white hover:bg-white/30"
                  )}
                >
                  <Upload className="h-3 w-3" />
                  Upload
                </Button>
              }
            />
          ) : null}
        </div>

        {showPropertySlider ? (
          <div className="flex items-center gap-2 border-b border-border/60 bg-secondary/10 px-2 py-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-8 shrink-0 p-0"
              disabled={selectedPropertyIndex <= 0}
              onClick={() => {
                const prev = propertyChoices[selectedPropertyIndex - 1];
                if (prev) setSelectedPropertyId(prev.id);
              }}
              aria-label="Previous proposed property"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1 text-center">
              <p className="truncate text-[0.82rem] font-semibold text-foreground">
                {selectedPropertyLabel}
              </p>
              <p className="text-[0.68rem] tabular-nums text-muted-foreground">
                {selectedPropertyIndex + 1} of {propertyChoices.length} proposed
              </p>
              <div className="mt-1.5 flex items-center justify-center gap-1.5">
                {propertyChoices.map((choice, index) => (
                  <button
                    key={choice.id}
                    type="button"
                    aria-label={`Show docs for ${choice.label}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      index === selectedPropertyIndex
                        ? "w-5 bg-secondary"
                        : "w-1.5 bg-secondary/35 hover:bg-secondary/55"
                    )}
                    onClick={() => setSelectedPropertyId(choice.id)}
                  />
                ))}
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-8 shrink-0 p-0"
              disabled={selectedPropertyIndex < 0 || selectedPropertyIndex >= propertyChoices.length - 1}
              onClick={() => {
                const next = propertyChoices[selectedPropertyIndex + 1];
                if (next) setSelectedPropertyId(next.id);
              }}
              aria-label="Next proposed property"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : tone === "property" && selectedPropertyLabel ? (
          <div className="border-b border-border/60 bg-secondary/10 px-3 py-2">
            <p className="truncate text-[0.82rem] font-semibold text-foreground">{selectedPropertyLabel}</p>
            <p className="text-[0.68rem] text-muted-foreground">Proposed property</p>
          </div>
        ) : null}

        {showPropertyEmpty ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Link a proposed property on Overview, then upload title deed, floor plan, and other unit docs here.
          </p>
        ) : (
        <div className="divide-y divide-border/50">
          {scoped.map(({ cat, docs }) => {
            const filledStyles = scopeCompletedStyles(tone);
            const cardExpiry = nearestExpiryHint(docs, cat);

            if (docs.length === 0) {
              return (
                <div key={cat.value} className="flex items-center justify-between gap-2 px-3 py-1.5 hover:bg-muted/30">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-[0.84rem] font-medium text-foreground">{cat.label}</p>
                    <StatusPill label="Missing" className="bg-muted text-muted-foreground" />
                  </div>
                  {canEdit ? (
                    <DocumentUploadDialog
                      entityType={uploadEntityType}
                      entityId={uploadEntityId}
                      fixedCategory={cat}
                      propertyId={cat.scope === "property" ? activePropertyId : null}
                      propertyChoices={cat.scope === "property" ? propertyChoices : []}
                      onSaved={(d) => onDocumentSaved?.(d as LeadDocument | undefined)}
                      trigger={
                        <Button type="button" size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-[0.68rem]">
                          <Plus className="h-3 w-3" />
                          Add
                        </Button>
                      }
                    />
                  ) : null}
                </div>
              );
            }

            return (
              <div key={cat.value} className="px-2 py-1.5">
                <div className={cn("overflow-hidden rounded-[10px] border", filledStyles.card)}>
                  <div className={cn("flex items-center justify-between gap-2 px-2.5 py-1.5", filledStyles.header)}>
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="truncate text-[0.84rem] font-semibold text-foreground">{cat.label}</p>
                      {cardExpiry ? (
                        <span
                          className={cn(
                            "text-[0.72rem] font-semibold tabular-nums",
                            cardExpiry.startsWith("Expired") || cardExpiry === "Expires today"
                              ? "text-red-700"
                              : cardExpiry.includes("d left") && Number.parseInt(cardExpiry, 10) <= 30
                                ? "text-amber-800"
                                : tone === "property"
                                  ? "text-secondary"
                                  : "text-primary"
                          )}
                        >
                          {cardExpiry}
                        </span>
                      ) : null}
                      <span className="text-[0.68rem] text-muted-foreground">
                        {docs.length} file{docs.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusPill
                        label={fileStatus(docs[0], cat).label}
                        className={fileStatus(docs[0], cat).className}
                      />
                      {canEdit ? (
                        <DocumentUploadDialog
                          entityType={uploadEntityType}
                          entityId={uploadEntityId}
                          fixedCategory={cat}
                          propertyId={cat.scope === "property" ? activePropertyId : null}
                          propertyChoices={cat.scope === "property" ? propertyChoices : []}
                          onSaved={(d) => onDocumentSaved?.(d as LeadDocument | undefined)}
                          trigger={
                            <Button type="button" size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-[0.68rem]">
                              <Plus className="h-3 w-3" />
                              Add
                            </Button>
                          }
                        />
                      ) : null}
                    </div>
                  </div>
                  <div className="divide-y divide-border/40">
                    {docs.map((doc) => (
                      <div key={doc.id} className={cn("px-2.5 py-1.5", filledStyles.file)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[0.82rem] font-medium text-foreground">{doc.name}</p>
                            <p className="text-[0.68rem] text-muted-foreground">
                              {formatDateTime(doc.created_at)}
                              {cat.capture === "expiry" && doc.expiry_date
                                ? ` · Exp ${formatDate(doc.expiry_date)}${expiryDaysHint(doc.expiry_date) ? ` (${expiryDaysHint(doc.expiry_date)})` : ""}`
                                : cat.capture === "note" && doc.notes
                                  ? ` · ${doc.notes}`
                                  : ""}
                            </p>
                          </div>
                          <StatusPill label={fileStatus(doc, cat).label} className={fileStatus(doc, cat).className} />
                        </div>
                        <FileActions doc={doc} cat={cat} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={cn("grid gap-4", showSplit ? "lg:grid-cols-2" : "grid-cols-1")}>
        {renderScopeColumn("Client docs", clientGroups, "client")}
        {renderScopeColumn("Property docs", propertyGroups, "property")}
      </div>

      {sourcesHint ? (
        <p className="px-1 text-xs text-muted-foreground">{sourcesHint}</p>
      ) : customerId ? (
        <p className="px-1 text-xs text-muted-foreground">
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
