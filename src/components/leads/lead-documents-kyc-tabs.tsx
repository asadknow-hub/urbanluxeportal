"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LeadDocumentsChecklist } from "@/components/leads/lead-documents-checklist";
import { KycFormFields, KycFormActions, useKycFormState } from "@/components/crm/kyc-form-panel";
import { KycPdfPreview } from "@/components/crm/kyc-pdf-preview";
import type { DocCategoryChoice } from "@/lib/lead-field-options";
import type { KycPersonRecord } from "@/lib/kyc-form";
import type { LeadDocument } from "@/components/leads/lead-documents";
import { mergePersonDocumentsByStoragePath } from "@/lib/person-documents";

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
    />
  );
}

export function LeadKycPage({
  leadId,
  customerId,
  customerHref,
  person,
  canEdit,
}: {
  leadId: string;
  customerId: string;
  customerHref?: string;
  person: KycPersonRecord;
  canEdit: boolean;
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
        <KycPdfPreview customerId={customerId} refreshKey={previewKey} />
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
