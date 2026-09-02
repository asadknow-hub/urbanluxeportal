"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { KycFormActions, KycFormFields, useKycFormState } from "@/components/crm/kyc-form-panel";
import type { KycPersonRecord } from "@/lib/kyc-form";
import { FileText } from "lucide-react";

export function KycFormDialog({
  customerId,
  leadId,
  person,
  canEdit,
}: {
  customerId: string;
  leadId?: string | null;
  person: KycPersonRecord;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const kycState = useKycFormState({ customerId, leadId, person, canEdit, autoSave: false });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" size="sm" variant="outline" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            KYC form
          </Button>
        }
      />
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Individual KYC form</DialogTitle>
          <DialogDescription>
            Matches the Urban Luxe PDF — save here, then download or attach to the person record.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden">
          <KycFormFields
            person={person}
            form={kycState.form}
            setForm={kycState.setForm}
            core={kycState.core}
            setCore={kycState.setCore}
            pending={kycState.pending}
            canEdit={canEdit}
          />
        </div>

        <KycFormActions
          pending={kycState.pending}
          canEdit={canEdit}
          onDownload={kycState.downloadPdf}
          onSavePdf={kycState.savePdfToDocuments}
          onSave={() => kycState.save()}
        />
      </DialogContent>
    </Dialog>
  );
}
