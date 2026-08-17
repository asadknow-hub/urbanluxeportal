"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDeal } from "@/server/deals";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

export function CustomerNewDealDialog({
  customerId,
  customerName,
}: {
  customerId: string;
  customerName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(`Sale — ${customerName}`);
  const [value, setValue] = useState("");

  function handleCreate() {
    startTransition(async () => {
      const result = await createDeal({
        title: title.trim() || `Sale — ${customerName}`,
        customer_id: customerId,
        value: value ? Number(value) : undefined,
      });
      if (result.ok && result.data) {
        toast.success("Deal created");
        setOpen(false);
        router.push(`/pipeline/${result.data.id}`);
      } else {
        toast.error(result.error ?? "Could not create deal");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} size="sm" variant="outline">
            <Plus className="mr-1 h-4 w-4" /> New deal
          </Button>
        )}
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New deal for {customerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-deal-title">Title</Label>
            <Input id="new-deal-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-deal-value">Value (AED)</Label>
            <Input id="new-deal-value" type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" disabled={pending} onClick={handleCreate}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create deal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
