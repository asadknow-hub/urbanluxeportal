"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadDocumentsChecklist } from "@/components/leads/lead-documents-checklist";
import { KycFormFields, KycFormActions, useKycFormState } from "@/components/crm/kyc-form-panel";
import { KycPdfPreview } from "@/components/crm/kyc-pdf-preview";
import { normalizeDocCategory } from "@/lib/document-storage";
import type { DocCategoryChoice } from "@/lib/lead-field-options";
import type { KycPersonRecord } from "@/lib/kyc-form";
import type { LeadDocument } from "@/components/leads/lead-documents";

function LeadKycWorkspace({
  leadId,
  customerId,
  person,
  canEdit,
}: {
  leadId: string;
  customerId: string;
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
  );
}

export function LeadDocumentsKycTabs({
  leadId,
  customerId,
  customerHref,
  person,
  leadDocuments,
  customerDocuments = [],
  docCategories,
  canEdit,
  onLeadDocumentSaved,
}: {
  leadId: string;
  customerId?: string | null;
  customerHref?: string;
  person?: KycPersonRecord | null;
  leadDocuments: LeadDocument[];
  customerDocuments?: LeadDocument[];
  docCategories: DocCategoryChoice[];
  canEdit: boolean;
  onLeadDocumentSaved?: (doc?: LeadDocument) => void;
}) {
  const mergedDocuments = useMemo(() => {
    const byCategory = new Map<string, LeadDocument>();
    for (const doc of [...leadDocuments, ...customerDocuments]) {
      const key = normalizeDocCategory(doc.category);
      if (!byCategory.has(key)) byCategory.set(key, doc);
    }
    return Array.from(byCategory.values());
  }, [leadDocuments, customerDocuments]);

  return (
    <section className="overflow-hidden rounded-[14px] border border-border bg-card">
      <Tabs defaultValue="documents" className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <TabsList>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="kyc" disabled={!person || !customerId}>
              KYC
            </TabsTrigger>
          </TabsList>
          {customerHref ? (
            <Link href={customerHref} className="text-xs font-medium text-primary hover:underline">
              Person profile
            </Link>
          ) : null}
        </div>

        <TabsContent value="documents" className="mt-0 p-4">
          <LeadDocumentsChecklist
            leadId={leadId}
            customerId={customerId}
            documents={mergedDocuments}
            categories={docCategories}
            canEdit={canEdit}
            embedded
            onDocumentSaved={onLeadDocumentSaved}
          />
        </TabsContent>

        <TabsContent value="kyc" className="mt-0 p-4">
          {!person || !customerId ? (
            <p className="text-sm text-muted-foreground">Person record required for KYC.</p>
          ) : (
            <LeadKycWorkspace
              leadId={leadId}
              customerId={customerId}
              person={person}
              canEdit={canEdit}
            />
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
