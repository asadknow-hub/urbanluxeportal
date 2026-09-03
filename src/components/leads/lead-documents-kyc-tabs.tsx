"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { LeadDocumentsChecklist } from "@/components/leads/lead-documents-checklist";
import { KycFormFields, KycFormActions, useKycFormState } from "@/components/crm/kyc-form-panel";
import { KycPdfPreview } from "@/components/crm/kyc-pdf-preview";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/dates";
import type { DocCategoryChoice } from "@/lib/lead-field-options";
import type { KycPersonRecord } from "@/lib/kyc-form";
import type { LeadDocument } from "@/components/leads/lead-documents";
import { mergePersonDocumentsByStoragePath } from "@/lib/person-documents";
import { deleteDocument, getSignedUrl } from "@/server/documents";
import { Download, ExternalLink, FileOutput, FileUp, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

function isKycFileDoc(doc: LeadDocument) {
  const name = doc.name.toLowerCase();
  const notes = (doc.notes ?? "").toLowerCase();
  return name.includes("kyc") || notes.includes("kyc");
}

export function LeadDocumentsPage({
  uploadEntityType,
  uploadEntityId,
  customerId,
  documents,
  categories,
  canEdit,
  onDocumentSaved,
  onDocumentDeleted,
  onDocumentUpdated,
  sourcesHint,
  propertyChoices,
  defaultPropertyId,
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
  sourcesHint?: string;
  propertyChoices?: { id: string; label: string }[];
  defaultPropertyId?: string | null;
}) {
  return (
    <LeadDocumentsChecklist
      uploadEntityType={uploadEntityType}
      uploadEntityId={uploadEntityId}
      customerId={customerId}
      documents={documents}
      categories={categories}
      canEdit={canEdit}
      onDocumentSaved={onDocumentSaved}
      onDocumentDeleted={onDocumentDeleted}
      onDocumentUpdated={onDocumentUpdated}
      sourcesHint={sourcesHint}
      propertyChoices={propertyChoices}
      defaultPropertyId={defaultPropertyId}
    />
  );
}

export function LeadKycPage({
  leadId,
  customerId,
  customerHref,
  person,
  canEdit,
  documents = [],
  onDocumentSaved,
  onDocumentDeleted,
}: {
  leadId: string;
  customerId: string;
  customerHref?: string;
  person: KycPersonRecord;
  canEdit: boolean;
  documents?: LeadDocument[];
  onDocumentSaved?: (doc?: LeadDocument) => void;
  onDocumentDeleted?: (docId: string) => void;
}) {
  const [previewKey, setPreviewKey] = useState(0);
  const [docPending, startDocTransition] = useTransition();
  const kycState = useKycFormState({
    customerId,
    leadId,
    person,
    canEdit,
    autoSave: true,
    onSaved: () => setPreviewKey((k) => k + 1),
  });

  const kycFiles = useMemo(() => {
    return [...documents]
      .filter(isKycFileDoc)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [documents]);

  function openDoc(doc: LeadDocument) {
    startDocTransition(async () => {
      const result = await getSignedUrl(doc.storage_path);
      if (result.ok && result.data?.url) window.open(result.data.url, "_blank", "noopener,noreferrer");
      else toast.error(result.error ?? "Could not open file");
    });
  }

  function downloadDoc(doc: LeadDocument) {
    startDocTransition(async () => {
      const result = await getSignedUrl(doc.storage_path);
      if (!result.ok || !result.data?.url) {
        toast.error(result.error ?? "Could not download file");
        return;
      }
      const a = document.createElement("a");
      a.href = result.data.url;
      a.download = doc.name.endsWith(".pdf") ? doc.name : `${doc.name}.pdf`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  }

  function removeDoc(doc: LeadDocument) {
    if (!window.confirm(`Delete “${doc.name}”?`)) return;
    startDocTransition(async () => {
      const result = await deleteDocument(doc.id);
      if (result.ok) {
        onDocumentDeleted?.(doc.id);
        toast.success("KYC file deleted");
      } else {
        toast.error(result.error ?? "Could not delete");
      }
    });
  }

  return (
    <div className="space-y-3">
      {customerHref ? (
        <div className="flex justify-end">
          <Link href={customerHref} className="text-xs font-medium text-secondary hover:underline">
            Open person profile
          </Link>
        </div>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="flex min-h-[560px] flex-col rounded-[14px] border border-border bg-card p-4">
          <KycFormFields
            person={person}
            form={kycState.form}
            setForm={kycState.setForm}
            core={kycState.core}
            setCore={kycState.setCore}
            pending={kycState.pending}
            canEdit={canEdit}
          />
          <KycFormActions
            pending={kycState.pending}
            canEdit={canEdit}
            pdfReady={false}
            showPdfActions={false}
            onSave={() => kycState.save()}
            onGenerate={() => kycState.generatePdf()}
            onPreview={() => kycState.previewPdf()}
            onDownload={() => kycState.downloadPdf()}
          />
        </div>
        <KycPdfPreview
          customerId={customerId}
          refreshKey={previewKey}
          fileBar={
            <>
              <div className="bg-primary px-4 py-3 text-white">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="font-heading text-[1rem] text-white"
                      style={{ fontFamily: "var(--font-display), serif" }}
                    >
                      KYC file
                    </p>
                    <p className="mt-0.5 text-[0.75rem] text-white/70">
                      {kycFiles.length === 0
                        ? "No saved KYC PDFs on file yet"
                        : `${kycFiles.length} saved file${kycFiles.length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canEdit ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          disabled={kycState.pending}
                          className="h-8 gap-1.5 border-0 bg-white text-primary hover:bg-white/90"
                          onClick={() => kycState.generateAndSavePdf()}
                        >
                          {kycState.pending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <FileOutput className="h-3.5 w-3.5" />
                          )}
                          Generate & Save the latest
                        </Button>
                        <DocumentUploadDialog
                          entityType="customer"
                          entityId={customerId}
                          fixedCategory={{
                            value: "other",
                            label: "Signed KYC",
                            capture: "note",
                            scope: "individual",
                          }}
                          fixedNotes="Signed KYC form"
                          onSaved={(doc) => {
                            onDocumentSaved?.(doc as LeadDocument | undefined);
                            setPreviewKey((k) => k + 1);
                          }}
                          trigger={
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 gap-1.5 border-0 bg-white/20 text-white hover:bg-white/30"
                            >
                              <FileUp className="h-3.5 w-3.5" />
                              Upload a signed copy
                            </Button>
                          }
                        />
                      </>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      disabled={kycState.pending}
                      className="h-8 gap-1.5 border-0 bg-white/20 text-white hover:bg-white/30"
                      onClick={() => {
                        kycState.generatePdf();
                      }}
                    >
                      {kycState.pending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileOutput className="h-3.5 w-3.5" />
                      )}
                      Generate PDF
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 gap-1.5 border-0 bg-white/20 text-white hover:bg-white/30"
                      onClick={() => kycState.downloadPdf()}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 px-3 py-3">
                {kycFiles.length === 0 ? (
                  <p className="rounded-[10px] border border-dashed border-primary/20 bg-white/80 px-3 py-5 text-center text-sm text-muted-foreground">
                    Generate &amp; save or upload a signed copy to keep KYC on file.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {kycFiles.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center justify-between gap-3 rounded-[10px] border border-primary/15 bg-white px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[0.84rem] font-medium text-foreground">{doc.name}</p>
                          <p className="text-[0.68rem] text-muted-foreground">
                            {formatDateTime(doc.created_at)}
                            {doc.notes ? ` · ${doc.notes}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 px-1.5 text-[0.68rem]"
                            disabled={docPending}
                            onClick={() => openDoc(doc)}
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 px-1.5 text-[0.68rem]"
                            disabled={docPending}
                            onClick={() => downloadDoc(doc)}
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                          {canEdit ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 px-1.5 text-[0.68rem] text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={docPending}
                              onClick={() => removeDoc(doc)}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          }
        />
      </div>
    </div>
  );
}

/** Merge documents from lead, deal, customer, etc. (deduped by storage_path; later sources win). */
export function useMergedPersonDocuments(...sources: LeadDocument[][]) {
  return useMemo(
    () => mergePersonDocumentsByStoragePath(...sources),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flatten source arrays for stable deps
    sources.flatMap((batch) => batch.map((doc) => `${doc.id}:${doc.storage_path}`))
  );
}

/** @deprecated Use useMergedPersonDocuments */
export function useMergedLeadDocuments(
  leadDocuments: LeadDocument[],
  customerDocuments: LeadDocument[] = []
) {
  return useMergedPersonDocuments(leadDocuments, customerDocuments);
}
