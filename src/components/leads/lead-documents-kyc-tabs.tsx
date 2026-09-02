"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LeadDocumentsChecklist } from "@/components/leads/lead-documents-checklist";
import { KycFormFields, KycFormActions, useKycFormState } from "@/components/crm/kyc-form-panel";
import { KycPdfPreview } from "@/components/crm/kyc-pdf-preview";
import type { DocCategoryChoice } from "@/lib/lead-field-options";
import type { KycPersonRecord } from "@/lib/kyc-form";
import type { LeadDocument } from "@/components/leads/lead-documents";

export function LeadDocumentsPage({
  leadId,
  customerId,
  documents,
  categories,
  canEdit,
  onDocumentSaved,
  onDocumentDeleted,
  onDocumentUpdated,
}: {
  leadId: string;
  customerId?: string | null;
  documents: LeadDocument[];
  categories: DocCategoryChoice[];
  canEdit: boolean;
  onDocumentSaved?: (doc?: LeadDocument) => void;
  onDocumentDeleted?: (docId: string) => void;
  onDocumentUpdated?: (doc: LeadDocument) => void;
}) {
  return (
    <LeadDocumentsChecklist
      leadId={leadId}
      customerId={customerId}
      documents={documents}
      categories={categories}
      canEdit={canEdit}
      onDocumentSaved={onDocumentSaved}
      onDocumentDeleted={onDocumentDeleted}
      onDocumentUpdated={onDocumentUpdated}
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
            onDownload={kycState.downloadPdf}
            onSavePdf={kycState.savePdfToDocuments}
            onSave={() => kycState.save()}
          />
        </div>
        <KycPdfPreview customerId={customerId} refreshKey={previewKey} />
      </div>
    </div>
  );
}

/** Merge lead + customer docs (all files, deduped by id). */
export function useMergedLeadDocuments(
  leadDocuments: LeadDocument[],
  customerDocuments: LeadDocument[] = []
) {
  return useMemo(() => {
    const seen = new Set<string>();
    const merged: LeadDocument[] = [];
    for (const doc of [...leadDocuments, ...customerDocuments]) {
      if (seen.has(doc.id)) continue;
      seen.add(doc.id);
      merged.push(doc);
    }
    return merged.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [leadDocuments, customerDocuments]);
}
