"use client";

import { useState, useTransition, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createDocument } from "@/server/documents";
import { toast } from "sonner";
import { Plus, Loader2, Upload, FileCheck2, X } from "lucide-react";

const CATEGORIES = [
  "emirates_id",
  "passport",
  "title_deed",
  "noc",
  "contract",
  "permit",
  "invoice",
  "receipt",
  "other",
];

export function DocumentUploadDialog({
  triggerLabel = "Upload Document",
  entityType,
  entityId,
}: {
  triggerLabel?: string;
  entityType?: string;
  entityId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    path: string;
    name: string;
    mime: string;
    size: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    category: "other",
    entity_type: entityType ?? "",
    expiry_date: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFileUpload(file: File | null) {
    if (!file) return;
    setUploading(true);

    const supabase = createSupabaseBrowserClient();
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
    const fileName = `${crypto.randomUUID()}${ext ? "." + ext : ""}`;
    const path = `general/${fileName}`;

    const { error } = await supabase.storage
      .from("documents")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      toast.error(`Upload failed: ${error.message}`);
    } else {
      setUploadedFile({
        path,
        name: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
      });
      if (!form.name) set("name", file.name.replace(/\.[^.]+$/, ""));
      toast.success("File uploaded");
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }
    startTransition(async () => {
      const result = await createDocument({
        name: form.name || uploadedFile.name,
        storage_path: uploadedFile.path,
        mime_type: uploadedFile.mime,
        size_bytes: uploadedFile.size,
        category: form.category,
        entity_type: (entityType ?? form.entity_type) || null,
        entity_id: entityId ?? null,
        expiry_date: form.expiry_date || null,
      });
      if (result.ok) {
        toast.success("Document saved");
        setOpen(false);
        setUploadedFile(null);
        setForm({ name: "", category: "other", entity_type: entityType ?? "", expiry_date: "" });
      } else {
        toast.error(result.error ?? "Failed to save document");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="mr-2 h-4 w-4" />
            {triggerLabel}
          </Button>
        )}
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload area */}
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center">
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf,.docx,.xlsx"
              onChange={(e) => handleFileUpload(e.target.files?.[0] ?? null)}
              className="hidden"
              id="doc-upload-input"
            />
            <label
              htmlFor="doc-upload-input"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Uploading..." : "Click to upload"}
            </label>
            <p className="mt-2 text-xs text-slate-400">
              PDF, JPG, PNG, WebP, DOCX, XLSX · Max 20MB
            </p>
          </div>

          {uploadedFile && (
            <div className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
              <FileCheck2 className="h-5 w-5 text-emerald-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{uploadedFile.name}</p>
                <p className="text-xs text-slate-400">
                  {(uploadedFile.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setUploadedFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="doc_name">Name *</Label>
            <Input
              id="doc_name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder="Document name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v ?? "other")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc_expiry">Expiry Date</Label>
                <Input
                  id="doc_expiry"
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => set("expiry_date", e.target.value)}
                />
              </div>
            </div>
            {!entityType && (
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={form.entity_type || "none"} onValueChange={(v) => set("entity_type", v === "none" ? "" : v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="deal">Deal</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !uploadedFile}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Document
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
