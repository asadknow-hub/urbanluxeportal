"use client";

import { useMemo, useState } from "react";
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
import { FileOutput, FileUp, Loader2 } from "lucide-react";

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
}: {
  leadId: string;
  customerId: string;
  customerHref?: string;
  person: KycPersonRecord;
  canEdit: boolean;
  documents?: LeadDocument[];
  onDocumentSaved?: (doc?: LeadDocument) => void;
}) {
  const [previewKey, setPreviewKey] = useState(0);
  const kycState = useKycFormState({
    customerId,
    leadId,
    person,
    canEdit,
    autoSave: true,
    onSaved: () => setPreviewKey((k) => k + 1),
  });

  const latestKycFile = useMemo(() => {
    return [...documents]
      .filter(isKycFileDoc)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
  }, [documents]);

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
            pdfReady={kycState.pdfReady}
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
            <div className="bg-primary px-4 py-3 text-white">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-heading text-[1rem] text-white" style={{ fontFamily: "var(--font-display), serif" }}>
                    KYC file
                  </p>
                  {latestKycFile ? (
                    <p className="mt-0.5 truncate text-[0.75rem] text-white/75" title={latestKycFile.name}>
                      Latest: {latestKycFile.name}
                      <span className="text-white/55"> · {formatDateTime(latestKycFile.created_at)}</span>
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[0.75rem] text-white/70">
                      No saved KYC PDF on file yet
                    </p>
                  )}
                </div>
                {canEdit ? (
                  <div className="flex flex-wrap gap-2">
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
                      Generate &amp; Save the latest
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
                  </div>
                ) : null}
              </div>
            </div>
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
