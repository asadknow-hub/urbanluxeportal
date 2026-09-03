"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { addPropertyMedia, deletePropertyMedia } from "@/server/property-media";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type PropertyPhoto = {
  id: string;
  storage_path: string;
  url: string;
  caption: string | null;
  sort_order: number;
  kind: string;
  created_at: string;
};

const MAX_BYTES = 12 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function PropertyPhotosPanel({
  propertyId,
  photos: initial,
  canEdit,
}: {
  propertyId: string;
  photos: PropertyPhoto[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) {
      toast.error("Choose image files");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    setUploading(true);
    try {
      for (const file of list) {
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name} is larger than 12MB`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("property-media")
          .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
        if (uploadError) {
          toast.error(uploadError.message);
          continue;
        }
        const result = await addPropertyMedia({
          propertyId,
          storagePath: path,
          kind: "photo",
        });
        if (result.ok && result.data) {
          setPhotos((prev) => [...prev, result.data!].sort((a, b) => a.sort_order - b.sort_order));
        } else {
          await supabase.storage.from("property-media").remove([path]);
          toast.error(result.error ?? "Could not save photo");
        }
      }
      router.refresh();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(id: string) {
    const prev = photos;
    setPhotos((rows) => rows.filter((p) => p.id !== id));
    startTransition(async () => {
      const result = await deletePropertyMedia(id);
      if (result.ok) {
        toast.success("Photo removed");
        router.refresh();
      } else {
        setPhotos(prev);
        toast.error(result.error ?? "Could not remove photo");
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-[14px] border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="font-heading text-[1.05rem]" style={{ fontFamily: "var(--font-display), serif" }}>
            Photos
          </h2>
          <p className="text-xs text-muted-foreground">
            {photos.length ? `${photos.length} photo${photos.length === 1 ? "" : "s"}` : "No photos yet"}
          </p>
        </div>
        {canEdit ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) void uploadFiles(e.target.files);
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={uploading || pending}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              Add photos
            </Button>
          </>
        ) : null}
      </div>

      {canEdit ? (
        <button
          type="button"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "m-4 flex min-h-[120px] w-[calc(100%-2rem)] flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed px-4 py-8 text-sm transition-colors",
            dragOver ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
          )}
        >
          <ImagePlus className="h-6 w-6" />
          <span>Drop images here or click to browse</span>
        </button>
      ) : null}

      {photos.length === 0 ? (
        <p className="px-4 pb-6 text-sm text-muted-foreground">
          {canEdit ? "Add exterior, interior, and amenity shots for this unit." : "No photos on this property."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-[4/3] overflow-hidden rounded-[12px] border border-border bg-muted">
              <Image
                src={photo.url}
                alt={photo.caption || "Property photo"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {canEdit ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => removePhoto(photo.id)}
                  className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove photo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
