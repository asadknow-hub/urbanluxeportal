"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertLead } from "@/server/leads";
import { filsToAED } from "@/lib/money";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";

export function ConvertLeadDialog({
  open,
  onOpenChange,
  lead,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    id: string;
    name: string;
    interest: string | null;
    budget_min: number | null;
    budget_max: number | null;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const defaultTitle = `${String(lead.interest ?? "deal").replace(/_/g, " ")} — ${lead.name}`;
  const defaultValue = filsToAED(lead.budget_max ?? lead.budget_min);
  const [title, setTitle] = useState(defaultTitle);
  const [value, setValue] = useState(defaultValue ? String(defaultValue) : "");
  const [result, setResult] = useState<{ customerId: string; dealId: string } | null>(null);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setResult(null);
      setTitle(defaultTitle);
      setValue(defaultValue ? String(defaultValue) : "");
    }
    onOpenChange(next);
  }

  function handleConvert() {
    startTransition(async () => {
      const converted = await convertLead(lead.id, {
        dealTitle: title.trim() || defaultTitle,
        dealValue: value ? Number(value) : undefined,
      });
      if (converted.ok && converted.data) {
        toast.success("Converted to customer and deal");
        setResult(converted.data);
        router.refresh();
      } else {
        toast.error(converted.error ?? "Conversion failed");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>Converted</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {lead.name} is now a prospect with an inquiry deal. Work the deal; winning it marks the customer active.
            </p>
            <DialogFooter className="gap-2 sm:justify-start">
              <Link
                href={`/pipeline/${result.dealId}`}
                className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
              >
                Open deal <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link
                href={`/customers/${result.customerId}`}
                className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium"
              >
                Open customer
              </Link>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Convert to customer + deal</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Creates a prospect customer and a pipeline deal. Duplicate phone numbers reuse the existing customer.
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="deal-title">Deal title</Label>
                <Input id="deal-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deal-value">Deal value (AED)</Label>
                <Input
                  id="deal-value"
                  type="number"
                  min={0}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="From lead budget"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" disabled={pending} onClick={handleConvert}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Convert
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
