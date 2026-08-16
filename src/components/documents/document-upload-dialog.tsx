"use client";

import { useState, useTransition, useRef, type ReactNode } from "react";
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
import { canonicalDocumentPath, DOC_CATEGORIES, formatDocCategory, normalizeDocCategory } from "@/lib/document-storage";
import { toast } from "sonner";
import { Loader2, Upload, FileCheck2, X } from "lucide-react";

const CATEGORIES = DOC_CATEGORIES;

export function DocumentUploadDialog({
  triggerLabel = "Upload Document",
  entityType,
  entityId,
  quiet = false,
  trigger,
  onSaved,
}: {
  triggerLabel?: string;
  entityType?: string;
  entityId?: string;
  quiet?: boolean;
  trigger?: ReactNode;
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    file: File;
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
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File must be under 20MB");
      return;
    }
    setUploadedFile({
      file,
      name: file.name,
      mime: file.type || "application/octet-stream",
      size: file.size,
    });
    if (!form.name) set("name", file.name.replace(/\.[^.]+$/, ""));
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const category = normalizeDocCategory(form.category);
      const linkedType = (entityType ?? form.entity_type) || null;
      const path = canonicalDocumentPath({
        entityType: linkedType,
        entityId,
        category,
        originalName: uploadedFile.name,
      });
      setUploading(true);
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, uploadedFile.file, { cacheControl: "3600", upsert: false, contentType: uploadedFile.mime });
      setUploading(false);
      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`);
        return;
      }
      const result = await createDocument({
        name: form.name || uploadedFile.name,
        storage_path: path,
        mime_type: uploadedFile.mime,
        size_bytes: uploadedFile.size,
        category,
        entity_type: linkedType,
        entity_id: entityId ?? null,
        expiry_date: form.expiry_date || null,
      });
      if (result.ok) {
        toast.success("Document saved");
        setOpen(false);
        setUploadedFile(null);
        setForm({ name: "", category: "other", entity_type: entityType ?? "", expiry_date: "" });
        onSaved?.();
      } else {
        await supabase.storage.from("documents").remove([path]);
        toast.error(result.error ?? "Failed to save document");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) =>
          trigger ? (
            <button type="button" {...props} className="border-0 bg-transparent p-0 text-left">
              {trigger}
            </button>
          ) : (
            <Button {...props} variant={quiet ? "outline" : "default"} size={quiet ? "sm" : "default"}>
              <Upload className="mr-2 h-4 w-4" />
              {triggerLabel}
            </Button>
          )
        }
      />
      <DialogContent
        className="w-[95vw] max-w-lg overflow-hidden rounded-[14px] border border-border p-0 shadow-xl sm:max-w-lg"
        closeClassName="text-white/70 hover:bg-white/10 hover:text-white"
      >
        <div className="bg-[#16241F] px-6 py-5 text-center">
          <DialogHeader>
            <DialogTitle
              className="text-center text-[1.15rem] font-normal tracking-[0.12em] text-white uppercase"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              Secure document upload
            </DialogTitle>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 bg-card px-6 py-5">
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
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFileUpload(e.dataTransfer.files?.[0] ?? null);
            }}
            className={`block cursor-pointer rounded-[10px] border-[1.5px] border-dashed px-4 py-8 text-center transition-colors ${
              dragOver ? "border-primary bg-[#F5EEDC]" : "border-border hover:border-primary hover:bg-[#F5EEDC]/60"
            }`}
          >
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border border-border bg-card">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
            </span>
            <span className="block text-sm font-semibold text-foreground">
              {uploading ? "Uploading…" : uploadedFile ? "File ready — click save to store it" : "Click to select a document"}
            </span>
            <span className="mt-1 block text-[0.76rem] text-muted-foreground">PDF, JPG, PNG, WebP, DOCX, XLSX · Max 20MB</span>
          </label>

          {uploadedFile && (
            <div className="flex items-center gap-3 rounded-[10px] border border-border bg-muted/50 p-3">
              <FileCheck2 className="h-5 w-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
              </div>
              <button type="button" className="rounded-full p-1 text-muted-foreground hover:text-foreground" onClick={() => setUploadedFile(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="doc_name" className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Name *
            </Label>
            <Input
              id="doc_name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder="Document name"
              className="h-11 rounded-[10px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v ?? "other")}>
                <SelectTrigger className="h-11 rounded-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {formatDocCategory(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc_expiry" className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Expiry date
              </Label>
              <Input
                id="doc_expiry"
                type="date"
                value={form.expiry_date}
                onChange={(e) => set("expiry_date", e.target.value)}
                className="h-11 rounded-[10px]"
              />
            </div>
          </div>

          {!entityType && (
            <div className="space-y-2">
              <Label className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Linked to</Label>
              <Select value={form.entity_type || "none"} onValueChange={(v) => set("entity_type", v === "none" ? "" : v ?? "")}>
                <SelectTrigger className="h-11 rounded-[10px]">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="property">Property</SelectItem>
                  <SelectItem value="deal">Deal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-[42px] rounded-full px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !uploadedFile} className="h-[42px] rounded-full bg-primary px-5 text-white hover:bg-[#8A6D2C]">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save document
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
