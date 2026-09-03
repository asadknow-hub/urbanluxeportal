"use client";

import { useState, useTransition, useRef, useEffect, useId, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
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
import { canonicalDocumentPath, formatDocCategory, normalizeDocCategory, DOC_CATEGORIES } from "@/lib/document-storage";
import { defaultDocCapture, defaultDocScope, type DocCategoryChoice } from "@/lib/lead-field-options";
import { toast } from "sonner";
import { Loader2, Upload, FileCheck2, X } from "lucide-react";

export function DocumentUploadDialog({
  triggerLabel = "Upload Document",
  entityType,
  entityId,
  quiet = false,
  trigger,
  onSaved,
  categories = [],
  fixedCategory,
  propertyId,
  propertyChoices = [],
}: {
  triggerLabel?: string;
  entityType?: string;
  entityId?: string;
  quiet?: boolean;
  trigger?: ReactNode;
  onSaved?: (doc?: { id: string; name: string; storage_path: string; mime_type: string; category: string; expiry_date: string | null; notes: string | null; created_at: string }) => void;
  categories?: DocCategoryChoice[];
  /** When set, category is fixed — no dropdown; expiry/note shown alone. */
  fixedCategory?: DocCategoryChoice;
  propertyId?: string | null;
  propertyChoices?: { id: string; label: string }[];
}) {
  const inputId = useId();
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

  const [linkedPropertyId, setLinkedPropertyId] = useState(propertyId ?? "");
  const [form, setForm] = useState({
    name: "",
    category: "",
    entity_type: entityType ?? "",
    expiry_date: "",
    notes: "",
  });

  const categoryItems: DocCategoryChoice[] = fixedCategory
    ? [fixedCategory]
    : categories.length > 0
      ? categories
      : DOC_CATEGORIES.map((value) => ({
          value,
          label: formatDocCategory(value),
          capture: defaultDocCapture(value),
          scope: defaultDocScope(value),
        }));

  const capture = form.category
    ? categoryItems.find((c) => c.value === form.category)?.capture ?? defaultDocCapture(form.category)
    : fixedCategory?.capture ?? null;

  useEffect(() => {
    if (open && fixedCategory) {
      setForm((prev) => ({
        ...prev,
        category: fixedCategory.value,
        expiry_date: "",
        notes: "",
      }));
    }
  }, [open, fixedCategory]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setCategory(value: string) {
    setForm((prev) => ({ ...prev, category: value, expiry_date: "", notes: "" }));
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
    if (!form.category) {
      toast.error("Choose a document category");
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
        property_id: linkedPropertyId || propertyId || null,
        expiry_date: capture === "expiry" ? form.expiry_date || null : null,
        notes: capture === "note" ? form.notes.trim() || null : null,
      });
      if (result.ok) {
        toast.success("Document saved");
        setOpen(false);
        setUploadedFile(null);
        setForm({
          name: "",
          category: fixedCategory?.value ?? "",
          entity_type: entityType ?? "",
          expiry_date: "",
          notes: "",
        });
        onSaved?.(result.data);
      } else {
        await supabase.storage.from("documents").remove([path]);
        toast.error(result.error ?? "Failed to save document");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setUploadedFile(null);
          setDragOver(false);
          setForm({
            name: "",
            category: fixedCategory?.value ?? "",
            entity_type: entityType ?? "",
            expiry_date: "",
            notes: "",
          });
          setLinkedPropertyId(propertyId ?? "");
        }
      }}
    >
      <DialogTrigger
        render={(props) =>
          trigger && isValidElement(trigger) ? (
            cloneElement(trigger as ReactElement<Record<string, unknown>>, props as never)
          ) : (
            <Button {...props} variant={quiet ? "outline" : "default"} size={quiet ? "sm" : "default"}>
              <Upload className="mr-2 h-4 w-4" />
              {triggerLabel}
            </Button>
          )
        }
      />
      <DialogContent
        className="!flex max-h-[90vh] w-[min(32rem,95vw)] flex-col gap-0 overflow-hidden rounded-[14px] border border-border p-0 shadow-xl sm:max-w-lg"
        closeClassName="text-white/70 hover:bg-white/10 hover:text-white"
      >
        <div className="shrink-0 bg-primary px-6 py-5 text-center">
          <DialogHeader>
            <DialogTitle
              className="text-center text-[1.15rem] font-normal tracking-[0.12em] text-white uppercase"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              {fixedCategory ? `Upload ${fixedCategory.label}` : "Secure document upload"}
            </DialogTitle>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="flex min-h-0 w-full flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-card px-6 py-5">
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf,.docx,.xlsx"
            onChange={(e) => handleFileUpload(e.target.files?.[0] ?? null)}
            className="hidden"
            id={inputId}
          />
          <label
            htmlFor={inputId}
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
            className={`flex min-h-[7.5rem] cursor-pointer flex-col items-center justify-center rounded-[10px] border-[1.5px] border-dashed px-4 py-5 text-center transition-colors ${
              dragOver ? "border-primary bg-accent" : "border-border hover:border-primary hover:bg-accent/60"
            }`}
          >
            <span className="mb-3 grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border bg-card">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
            </span>
            <span className="block text-sm font-semibold text-foreground">
              {uploading ? "Uploading…" : uploadedFile ? "File ready — click save to store it" : "Click to select a document"}
            </span>
            <span className="mt-1 block text-[0.76rem] text-muted-foreground">PDF, JPG, PNG, WebP, DOCX, XLSX · Max 20MB</span>
          </label>

          {/* Reserved slot so choosing a file does not stretch the dialog */}
          <div aria-live="polite" className="min-h-[3.75rem]">
            {uploadedFile ? (
              <div className="flex h-[3.75rem] items-center gap-3 rounded-[10px] border border-border bg-muted/50 px-3">
                <FileCheck2 className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <button type="button" className="rounded-full p-1 text-muted-foreground hover:text-foreground" onClick={() => setUploadedFile(null)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>

          {fixedCategory ? (
            <div className="rounded-[10px] border border-border bg-muted/40 px-4 py-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Category</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{fixedCategory.label}</p>
              {fixedCategory.scope === "property" ? (
                <p className="mt-1 text-xs text-secondary">Property document — also appears on the property file.</p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Individual document — stays on the person / KYC file.</p>
              )}
            </div>
          ) : null}

          {(fixedCategory?.scope === "property" || categoryItems.find((c) => c.value === form.category)?.scope === "property") && propertyChoices.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Property</Label>
              <Select value={linkedPropertyId || "none"} onValueChange={(v) => setLinkedPropertyId(v === "none" ? "" : v ?? "")}>
                <SelectTrigger className="h-11 rounded-[10px]">
                  <span className="truncate">
                    {propertyChoices.find((p) => p.id === linkedPropertyId)?.label ?? "Select property"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not linked yet</SelectItem>
                  {propertyChoices.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor={`${inputId}-name`} className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Name *
            </Label>
            <Input
              id={`${inputId}-name`}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder="Document name"
              className="h-11 rounded-[10px]"
            />
          </div>

          {fixedCategory ? (
            <div className="min-h-[4.75rem]">
              {capture === "expiry" ? (
                <div className="space-y-2">
                  <Label htmlFor={`${inputId}-expiry`} className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Expiry date
                  </Label>
                  <Input
                    id={`${inputId}-expiry`}
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => set("expiry_date", e.target.value)}
                    className="h-11 rounded-[10px]"
                  />
                </div>
              ) : capture === "note" ? (
                <div className="space-y-2">
                  <Label htmlFor={`${inputId}-notes`} className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Note
                  </Label>
                  <Input
                    id={`${inputId}-notes`}
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder="e.g. Original at office"
                    className="h-11 rounded-[10px]"
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Category *</Label>
                <Select value={form.category || undefined} onValueChange={(v) => setCategory(v ?? "")}>
                  <SelectTrigger className="h-11 rounded-[10px]">
                    <SelectValue placeholder="Choose category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryItems.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-h-[4.75rem] space-y-2">
                {capture === "expiry" ? (
                  <>
                    <Label htmlFor={`${inputId}-expiry`} className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Expiry date
                    </Label>
                    <Input
                      id={`${inputId}-expiry`}
                      type="date"
                      value={form.expiry_date}
                      onChange={(e) => set("expiry_date", e.target.value)}
                      className="h-11 rounded-[10px]"
                    />
                  </>
                ) : capture === "note" ? (
                  <>
                    <Label htmlFor={`${inputId}-notes`} className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Note
                    </Label>
                    <Input
                      id={`${inputId}-notes`}
                      value={form.notes}
                      onChange={(e) => set("notes", e.target.value)}
                      placeholder="e.g. Original at office"
                      className="h-11 rounded-[10px]"
                    />
                  </>
                ) : (
                  <>
                    <Label className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Extra
                    </Label>
                    <p className="flex h-11 items-center text-sm text-muted-foreground">Choose a category first</p>
                  </>
                )}
              </div>
            </div>
          )}

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
                  <SelectItem value="deal">Deal</SelectItem>
                  <SelectItem value="profile">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-[42px] rounded-full px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={pending || uploading || !uploadedFile || !form.category} className="h-[42px] rounded-full bg-secondary px-5 text-white hover:bg-secondary/90">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save document
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
