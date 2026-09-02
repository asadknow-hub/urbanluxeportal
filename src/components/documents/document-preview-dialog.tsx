"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSignedUrl } from "@/server/documents";
import { Loader2 } from "lucide-react";

export function DocumentPreviewDialog({
  open,
  onOpenChange,
  title,
  storagePath,
  mimeType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  storagePath: string;
  mimeType?: string;
}) {
  const [, startTransition] = useTransition();
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !storagePath) {
      setSrc(null);
      return;
    }
    let active = true;
    setLoading(true);
    startTransition(async () => {
      const result = await getSignedUrl(storagePath);
      if (!active) return;
      if (result.ok && result.data?.url) setSrc(result.data.url);
      else setSrc(null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [open, storagePath]);

  const isPdf = mimeType?.includes("pdf") || storagePath.toLowerCase().endsWith(".pdf");
  const isImage = mimeType?.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(storagePath);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(88vh,720px)] w-[95vw] max-w-4xl flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="truncate text-base">{title}</DialogTitle>
        </DialogHeader>
        <div className="relative min-h-0 flex-1 bg-muted/20">
          {loading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : src && isPdf ? (
            <iframe title={title} src={src} className="h-full w-full border-0 bg-white" />
          ) : src && isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={title} className="mx-auto max-h-full max-w-full object-contain p-4" />
          ) : src ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
              <p>Preview not available for this file type.</p>
              <a href={src} target="_blank" rel="noopener noreferrer" className="font-semibold text-secondary hover:underline">
                Open file
              </a>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
              Could not load preview.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
