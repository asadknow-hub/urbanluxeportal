"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LeadPageTabs, type LeadPageView } from "@/components/leads/lead-page-tabs";
import { LeadDocumentsPage, LeadKycPage } from "@/components/leads/lead-documents-kyc-tabs";
import type { DocCategoryChoice } from "@/lib/lead-field-options";
import type { KycPersonRecord } from "@/lib/kyc-form";
import type { LeadDocument } from "@/components/leads/lead-documents";

export function PersonDocumentsKycSection({
  uploadEntityType,
  uploadEntityId,
  customerId,
  leadId,
  customerHref,
  person,
  documents,
  categories,
  canEdit,
  sourcesHint,
  overview,
  propertyChoices = [],
  defaultPropertyId = null,
}: {
  uploadEntityType: string;
  uploadEntityId: string;
  customerId?: string | null;
  leadId?: string | null;
  customerHref?: string;
  person?: KycPersonRecord | null;
  documents: LeadDocument[];
  categories: DocCategoryChoice[];
  canEdit: boolean;
  sourcesHint?: string;
  overview: React.ReactNode;
  propertyChoices?: { id: string; label: string }[];
  defaultPropertyId?: string | null;
}) {
  const router = useRouter();
  const [page, setPage] = useState<LeadPageView>("overview");
  const [optimisticDocs, setOptimisticDocs] = useState(documents);

  useEffect(() => {
    setOptimisticDocs(documents);
  }, [documents]);

  return (
    <>
      <LeadPageTabs value={page} onChange={setPage} kycDisabled={!customerId || !person} />

      {page === "overview" ? overview : null}

      {page === "documents" ? (
        <LeadDocumentsPage
          uploadEntityType={uploadEntityType}
          uploadEntityId={uploadEntityId}
          customerId={customerId}
          documents={optimisticDocs}
          categories={categories}
          canEdit={canEdit}
          sourcesHint={sourcesHint}
          propertyChoices={propertyChoices}
          defaultPropertyId={defaultPropertyId}
          onDocumentSaved={(doc) => {
            if (doc) setOptimisticDocs((prev) => [{ ...doc, category: doc.category || "other" }, ...prev]);
            router.refresh();
          }}
          onDocumentDeleted={(docId) => {
            setOptimisticDocs((prev) => prev.filter((d) => d.id !== docId));
          }}
          onDocumentUpdated={(doc) => {
            setOptimisticDocs((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
          }}
        />
      ) : null}

      {page === "kyc" && customerId && person ? (
        <LeadKycPage
          leadId={leadId ?? ""}
          customerId={customerId}
          customerHref={customerHref}
          person={person}
          canEdit={canEdit}
          documents={optimisticDocs}
          onDocumentSaved={(doc) => {
            if (doc) setOptimisticDocs((prev) => [{ ...doc, category: doc.category || "other" }, ...prev]);
            router.refresh();
          }}
          onDocumentDeleted={(docId) => {
            setOptimisticDocs((prev) => prev.filter((d) => d.id !== docId));
          }}
        />
      ) : page === "kyc" ? (
        <div className="rounded-[14px] border border-border bg-card p-6 text-sm text-muted-foreground">
          Person record required for KYC. Link a lead or customer first.
        </div>
      ) : null}
    </>
  );
}
