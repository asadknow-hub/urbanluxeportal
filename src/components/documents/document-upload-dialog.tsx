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
          <Button {...props} className="bg-emerald-500 hover:bg-emerald-600 shadow-sm rounded-full px-6 font-medium">
            <Plus className="mr-2 h-4 w-4" />
            {triggerLabel}
          </Button>
        )}
      />
      <DialogContent 
        className="max-w-2xl w-[95vw] sm:w-[90vw] md:w-[60vw] max-h-[90vh] overflow-y-auto p-0 border-0 rounded-[2rem] shadow-2xl"
        closeClassName="text-slate-300 hover:text-white hover:bg-slate-800/50"
      >
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-bold tracking-tight">Secure Document Upload</DialogTitle>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Upload area */}
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center transition-colors hover:bg-slate-50/80 hover:border-emerald-200">
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
              className="inline-flex cursor-pointer flex-col items-center justify-center gap-3 w-full"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100">
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                ) : (
                  <Upload className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {uploading ? "Uploading securely..." : "Click to select a document"}
              </span>
            </label>
            <p className="mt-2 text-xs font-medium text-slate-400">
              PDF, JPG, PNG, WebP, DOCX, XLSX · Max 20MB
            </p>
          </div>

          {uploadedFile && (
            <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-emerald-100">
                <FileCheck2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{uploadedFile.name}</p>
                <p className="text-xs font-medium text-emerald-600 mt-0.5">
                  {(uploadedFile.size / 1024).toFixed(0)} KB successfully uploaded
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setUploadedFile(null)}
                className="h-8 w-8 rounded-full hover:bg-emerald-100 hover:text-emerald-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="space-y-2.5">
            <Label htmlFor="doc_name" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Name *</Label>
            <Input
              id="doc_name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder="Document name"
              className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Category</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v ?? "other")}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:ring-emerald-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="doc_expiry" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Expiry Date</Label>
                <Input
                  id="doc_expiry"
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => set("expiry_date", e.target.value)}
                  className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
                />
              </div>
            </div>
            {!entityType && (
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Entity Type</Label>
                <Select value={form.entity_type || "none"} onValueChange={(v) => set("entity_type", v === "none" ? "" : v ?? "")}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:ring-emerald-500/20">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl">
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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-full px-6 font-medium shadow-sm">
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !uploadedFile} className="rounded-full px-8 bg-emerald-500 hover:bg-emerald-600 font-medium shadow-sm">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Document
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
