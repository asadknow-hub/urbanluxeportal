"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateCustomer } from "@/server/customers";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";

export type CustomerEditData = {
  id: string;
  type: "individual" | "company";
  name: string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  emirates_id: string | null;
  passport_no: string | null;
  trn: string | null;
  address: string | null;
  notes: string | null;
  call_numbers?: string[];
  assigned_to: string | null;
};

export function CustomerEditDialog({
  customer,
  agents,
  canEdit,
}: {
  customer: CustomerEditData;
  agents: { id: string; full_name: string; role: string }[];
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [form, setForm] = useState({
    type: customer.type,
    name: customer.name,
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    nationality: customer.nationality ?? "",
    emirates_id: customer.emirates_id ?? "",
    passport_no: customer.passport_no ?? "",
    trn: customer.trn ?? "",
    address: customer.address ?? "",
    notes: customer.notes ?? "",
    call_numbers: (customer.call_numbers ?? []).join(", "),
    assigned_to: customer.assigned_to ?? "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      type: customer.type,
      name: customer.name,
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      nationality: customer.nationality ?? "",
      emirates_id: customer.emirates_id ?? "",
      passport_no: customer.passport_no ?? "",
      trn: customer.trn ?? "",
      address: customer.address ?? "",
      notes: customer.notes ?? "",
      call_numbers: (customer.call_numbers ?? []).join(", "),
      assigned_to: customer.assigned_to ?? "",
    });
  }, [open, customer]);

  if (!canEdit) return null;

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateCustomer(customer.id, {
        type: form.type as "individual" | "company",
        name: form.name,
        phone: form.phone || null,
        email: form.email || undefined,
        nationality: form.nationality || null,
        emirates_id: form.emirates_id || null,
        passport_no: form.passport_no || null,
        trn: form.trn || null,
        address: form.address || null,
        notes: form.notes || null,
        call_numbers: form.call_numbers
          .split(/[,;\n]+/)
          .map((n) => n.trim())
          .filter(Boolean),
        assigned_to: form.assigned_to || null,
      });
      if (result.ok) {
        toast.success("Profile updated");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not save");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} variant="outline" size="sm" className="h-8 gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      />
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit person</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v ?? "individual")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-name">Name *</Label>
              <Input
                id="cust-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cust-phone">Phone</Label>
              <Input id="cust-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-email">Email</Label>
              <Input
                id="cust-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cust-call-numbers">Other numbers</Label>
            <Input
              id="cust-call-numbers"
              value={form.call_numbers}
              onChange={(e) => set("call_numbers", e.target.value)}
              placeholder="Comma-separated"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cust-nationality">Nationality</Label>
              <Input
                id="cust-nationality"
                value={form.nationality}
                onChange={(e) => set("nationality", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Assign to</Label>
              <Select value={form.assigned_to || "none"} onValueChange={(v) => set("assigned_to", v === "none" ? "" : v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.type === "individual" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cust-eid">Emirates ID</Label>
                <Input
                  id="cust-eid"
                  value={form.emirates_id}
                  onChange={(e) => set("emirates_id", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-passport">Passport</Label>
                <Input
                  id="cust-passport"
                  value={form.passport_no}
                  onChange={(e) => set("passport_no", e.target.value)}
                />
              </div>
            </div>
          )}

          {form.type === "company" && (
            <div className="space-y-2">
              <Label htmlFor="cust-trn">TRN</Label>
              <Input id="cust-trn" value={form.trn} onChange={(e) => set("trn", e.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cust-address">Address</Label>
            <Input id="cust-address" value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cust-notes">Notes</Label>
            <Textarea id="cust-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !form.name.trim()}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
