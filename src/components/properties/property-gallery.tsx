"use client";

import { useState, useTransition, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

type MediaItem = {
  id: string;
  storage_path: string;
  kind: string;
  sort_order: number;
  url: string | null;
};

export function PropertyGallery({
  propertyId,
  media,
  canEdit,
}: {
  propertyId: string;
  media: MediaItem[];
  canEdit: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState(media);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    const supabase = createSupabaseBrowserClient();
    const maxSort = items.length > 0 ? Math.max(...items.map((m) => m.sort_order)) : 0;

    const newItems: MediaItem[] = [];
    for (const file of Array.from(files)) {
      // Compress image client-side if it's an image
      let fileToUpload = file;
      if (file.type.startsWith("image/")) {
        fileToUpload = await compressImage(file, 1920, 0.8);
      }

      const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
      const fileName = `${crypto.randomUUID()}${ext ? "." + ext : ""}`;
      const path = `property/${propertyId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("property-media")
        .upload(path, fileToUpload, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
        continue;
      }

      const sortOrder = maxSort + newItems.length + 1;
      const { data: mediaRow, error: dbError } = await supabase
        .from("property_media")
        .insert({
          property_id: propertyId,
          storage_path: path,
          kind: file.type.startsWith("image/") ? "photo" : "document",
          sort_order: sortOrder,
        })
        .select("id, storage_path, kind, sort_order")
        .single();

      if (dbError) {
        toast.error(`Failed to save ${file.name}: ${dbError.message}`);
        continue;
      }

      const { data: urlData } = await supabase.storage
        .from("property-media")
        .createSignedUrl(path, 3600);

      newItems.push({ ...mediaRow, url: urlData?.signedUrl ?? null });
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      toast.success(`${newItems.length} file(s) uploaded`);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete(mediaId: string, storagePath: string) {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();

      const { error: storageError } = await supabase.storage
        .from("property-media")
        .remove([storagePath]);

      if (storageError) console.error("storage delete error:", storageError.message);

      const { error: dbError } = await supabase
        .from("property_media")
        .delete()
        .eq("id", mediaId);

      if (dbError) {
        toast.error("Failed to delete media");
        return;
      }

      setItems((prev) => prev.filter((m) => m.id !== mediaId));
      toast.success("Media deleted");
    });
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      {canEdit && (
        <div
          className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center transition-colors hover:border-emerald-300"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleUpload(e.dataTransfer.files);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
            id={`gallery-upload-${propertyId}`}
          />
          <label
            htmlFor={`gallery-upload-${propertyId}`}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : "Upload photos (drag & drop or click)"}
          </label>
          <p className="mt-1.5 text-xs text-slate-400">
            Images are compressed to max 1920px · stored in Supabase Storage
          </p>
        </div>
      )}

      {/* Gallery grid */}
      {items.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
          <div className="text-center">
            <ImageIcon className="mx-auto h-8 w-8 mb-1" />
            <p className="text-xs">No photos yet</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-slate-200"
            >
              {item.url ? (
                <img
                  src={item.url}
                  alt=""
                  className="h-32 w-full object-cover"
                />
              ) : (
                <div className="flex h-32 items-center justify-center bg-slate-100">
                  <ImageIcon className="h-8 w-8 text-slate-300" />
                </div>
              )}
              {canEdit && (
                <button
                  onClick={() => handleDelete(item.id, item.storage_path)}
                  disabled={pending}
                  className="absolute top-1 right-1 rounded-md bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function compressImage(file: File, maxWidth: number, quality: number): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
