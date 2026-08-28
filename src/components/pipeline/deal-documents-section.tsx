"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { LeadDocumentsList, type LeadDocument } from "@/components/leads/lead-documents";
import type { DocCategoryChoice } from "@/lib/lead-field-options";

export function DealDocumentsSection({
  dealId,
  initialDocuments,
  categories,
  canEdit,
}: {
  dealId: string;
  initialDocuments: LeadDocument[];
  categories: DocCategoryChoice[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);

  return (
    <section className="overflow-hidden rounded-[14px] border border-border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-foreground">Documents</h2>
        <span className="font-mono text-xs text-muted-foreground">{documents.length}</span>
      </div>

      {canEdit && (
        <DocumentUploadDialog
          entityType="deal"
          entityId={dealId}
          categories={categories}
          onSaved={(doc) => {
            if (doc) {
              setDocuments((prev) => [{ ...doc, category: doc.category || "other" }, ...prev]);
            }
            router.refresh();
          }}
          trigger={
            <span className="mb-4 block cursor-pointer rounded-[10px] border border-dashed border-border px-4 py-5 text-center transition-colors hover:border-primary hover:bg-muted/40">
              <b className="text-sm font-semibold text-primary">Attach a document</b>
              <p className="mt-1 text-xs text-muted-foreground">MOU, Form F, KYC, and other deal files</p>
            </span>
          }
        />
      )}

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents yet.</p>
      ) : (
        <LeadDocumentsList documents={documents} onChange={setDocuments} categories={categories} />
      )}
    </section>
  );
}
