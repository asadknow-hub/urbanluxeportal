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
import { createOwner } from "@/server/properties";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

export function OwnerCreateDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    emirates_id: "",
    passport_no: "",
    notes: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createOwner({
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        emirates_id: form.emirates_id || undefined,
        passport_no: form.passport_no || undefined,
        notes: form.notes || undefined,
      });
      if (result.ok) {
        toast.success("Owner added");
        setOpen(false);
        setForm({ name: "", phone: "", email: "", emirates_id: "", passport_no: "", notes: "" });
      } else {
        toast.error(result.error ?? "Failed to add owner");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Owner
          </Button>
        )}
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Property Owner</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder="Owner full name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+9715xxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="owner@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emirates_id">Emirates ID</Label>
              <Input
                id="emirates_id"
                value={form.emirates_id}
                onChange={(e) => set("emirates_id", e.target.value)}
                placeholder="784-xxxx-xxxxxxx-x"
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

          <div className="space-y-2">
            <Label htmlFor="owner_notes">Notes</Label>
            <Textarea
              id="owner_notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !form.name}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Owner
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
