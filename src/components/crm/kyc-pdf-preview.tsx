"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function KycPdfPreview({
  customerId,
  refreshKey,
  fileBar,
}: {
  customerId: string;
  refreshKey: number;
  /** Small KYC file controls rendered above the preview. */
  fileBar?: ReactNode;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setLoading(true);

    fetch(`/api/customers/${customerId}/kyc-form/pdf?inline=1&t=${refreshKey}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load preview");
        return res.blob();
      })
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (active) setSrc(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [customerId, refreshKey]);

  return (
    <div className="flex h-full min-h-[520px] flex-col gap-3">
      {fileBar ? (
        <div className="overflow-hidden rounded-[14px] border border-primary/25 bg-card">
          {fileBar}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-border bg-muted/20">
        <div className="border-b border-border bg-card px-4 py-2.5">
          <p className="text-sm font-semibold text-foreground">PDF preview</p>
          <p className="text-xs text-muted-foreground">Updates after save (auto-saves while you type)</p>
        </div>
        <div className="relative min-h-0 flex-1 bg-white">
          {loading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : src ? (
            <iframe title="KYC PDF preview" src={src} className="h-full w-full border-0" />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Could not load preview. Save the form and try again.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
