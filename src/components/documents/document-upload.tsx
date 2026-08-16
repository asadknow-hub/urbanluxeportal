"use client";

import { useState, useTransition, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileText, X, Loader2, FileCheck2 } from "lucide-react";
import { canonicalDocumentPath } from "@/lib/document-storage";

export type UploadedFile = {
  storage_path: string;
  name: string;
  mime_type: string;
  size_bytes: number;
};

function getFileIcon(mime: string) {
  if (mime.startsWith("image/")) return null;
  return <FileText className="h-8 w-8 text-slate-400" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUpload({
  bucket,
  entityType,
  entityId,
  onUploaded,
  accept,
  multiple = true,
  label = "Upload Documents",
}: {
  bucket: string;
  entityType: string;
  entityId: string;
  onUploaded?: (files: UploadedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    const supabase = createSupabaseBrowserClient();
    const results: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      // Canonical path: {entity_type}/{entity_id}/{uuid}-{filename}
      const path = canonicalDocumentPath({
        entityType,
        entityId,
        category: "other",
        originalName: file.name,
      });

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
        continue;
      }

      results.push({
        storage_path: path,
        name: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      });
    }

    if (results.length > 0) {
      setUploadedFiles((prev) => [...prev, ...results]);
      onUploaded?.(results);
      toast.success(`${results.length} file(s) uploaded`);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeFile(path: string) {
    setUploadedFiles((prev) => prev.filter((f) => f.storage_path !== path));
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div
        className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center transition-colors hover:border-emerald-300"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          id={`upload-${bucket}-${entityType}-${entityId}`}
        />
        <label
          htmlFor={`upload-${bucket}-${entityType}-${entityId}`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Uploading..." : "Click to upload or drag & drop"}
        </label>
        <p className="mt-2 text-xs text-slate-400">
          Files are stored securely in Supabase Storage
        </p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.storage_path}
              className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
            >
              <FileCheck2 className="h-5 w-5 text-emerald-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(file.size_bytes)}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeFile(file.storage_path)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
