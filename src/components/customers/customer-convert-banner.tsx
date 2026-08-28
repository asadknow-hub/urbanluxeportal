"use client";

import { useState } from "react";
import { ConvertLeadDialog, type ConvertLeadPayload } from "@/components/leads/convert-lead-dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CustomerConvertBanner({
  lead,
  canEdit,
}: {
  lead: ConvertLeadPayload;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!canEdit) return null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-primary/25 bg-primary/5 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Ready to open a deal?</p>
          <p className="text-xs text-muted-foreground">
            Convert the linked lead with property and KYC mapped from the requirement profile.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          Convert to deal
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      <ConvertLeadDialog open={open} onOpenChange={setOpen} lead={lead} />
    </>
  );
}
