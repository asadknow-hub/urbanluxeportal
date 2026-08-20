"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBrand } from "@/components/brand/brand-provider";

export function SiteLogo({
  inverted = false,
  className,
}: {
  inverted?: boolean;
  className?: string;
}) {
  const brand = useBrand();
  const logoSrc = inverted ? brand.logoDarkUrl || brand.logoUrl : brand.logoUrl;
  const label = brand.name || "Urban Luxe";

  return (
    <Link
      href="/"
      prefetch
      className={cn("group inline-flex items-center", className)}
      aria-label={`${label} home`}
    >
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt={label}
          width={160}
          height={40}
          className="h-8 w-auto max-w-[10rem] object-contain md:h-9"
          unoptimized
          priority
        />
      ) : (
        <span
          className={cn(
            "text-[1.125rem] font-bold tracking-[0.06em] md:text-[1.2rem]",
            inverted ? "text-white" : "text-[#0B1D3D]"
          )}
        >
          {label.toUpperCase()}
        </span>
      )}
    </Link>
  );
}
