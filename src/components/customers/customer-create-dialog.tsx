"use client";

import { useState, useTransition } from "react";
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
import { createCustomer } from "@/server/customers";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

export function CustomerCreateDialog({
  agents,
}: {
  agents: { id: string; full_name: string; role: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    type: "individual",
    name: "",
    phone: "",
    email: "",
    nationality: "",
    emirates_id: "",
    passport_no: "",
    trn: "",
    address: "",
    notes: "",
    assigned_to: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createCustomer({
        type: form.type as "individual" | "company",
        name: form.name,
        phone: form.phone || null,
        email: form.email || undefined,
        nationality: form.nationality || null,
        emirates_id: form.emirates_id || null,
        passport_no: form.passport_no || null,
        trn: form.trn || null,
        address: form.address || null,
        tags: [],
        notes: form.notes || null,
        assigned_to: form.assigned_to || null,
      });
      if (result.ok) {
        toast.success("Customer created");
        setOpen(false);
        setForm({
          type: "individual",
          name: "",
          phone: "",
          email: "",
          nationality: "",
          emirates_id: "",
          passport_no: "",
          trn: "",
          address: "",
          notes: "",
          assigned_to: "",
        });
      } else {
        toast.error(result.error ?? "Failed to create customer");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        )}
      />
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Customer</DialogTitle>
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
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                placeholder="Full name or company"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+971501234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={form.nationality}
                onChange={(e) => set("nationality", e.target.value)}
                placeholder="e.g. Emirati"
              />
            </div>
            <div className="space-y-2">
              <Label>Assign to</Label>
              <Select value={form.assigned_to} onValueChange={(v) => set("assigned_to", v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id ?? ""} value={a.id ?? ""}>
                      {a.full_name ?? ""} ({a.role ?? ""})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.type === "individual" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emirates_id">Emirates ID</Label>
                <Input
                  id="emirates_id"
                  value={form.emirates_id}
                  onChange={(e) => set("emirates_id", e.target.value)}
                  placeholder="784-XXXX-XXXXXXX-X"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passport_no">Passport No</Label>
                <Input
                  id="passport_no"
                  value={form.passport_no}
                  onChange={(e) => set("passport_no", e.target.value)}
                  placeholder="Passport number"
                />
              </div>
            </div>
          )}

          {form.type === "company" && (
            <div className="space-y-2">
              <Label htmlFor="trn">TRN</Label>
              <Input
                id="trn"
                value={form.trn}
                onChange={(e) => set("trn", e.target.value)}
                placeholder="Tax Registration Number"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Street, City"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !form.name}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Customer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
