"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrand } from "@/components/brand/brand-provider";

export function BrandMark({
  inverted = false,
  compact = false,
}: {
  inverted?: boolean;
  compact?: boolean;
}) {
  const brand = useBrand();
  const logoSrc = brand.logoUrl;

  if (logoSrc) {
    return (
      <div className="flex items-center overflow-hidden">
        <Image
          src={logoSrc}
          alt={brand.name}
          width={compact ? 32 : 140}
          height={32}
          className={cn("object-contain", compact ? "h-8 w-8" : "h-8 w-auto max-w-[9rem]")}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 overflow-hidden">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          inverted
            ? "bg-primary text-primary-foreground"
            : "bg-sidebar-primary text-sidebar-primary-foreground"
        )}
      >
        <Building2 className="h-4 w-4" />
      </div>
      {!compact && (
        <span
          className={cn(
            "truncate text-lg tracking-tight",
            inverted ? "font-heading text-foreground" : "font-heading text-sidebar-foreground"
          )}
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          {brand.name}
        </span>
      )}
    </div>
  );
}
