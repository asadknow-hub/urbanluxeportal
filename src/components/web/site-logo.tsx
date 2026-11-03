"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBrand } from "@/components/brand/brand-provider";

/** Official UrbanLuxe wordmark — falls back if CRM brand logo is unset. */
const DEFAULT_LOGO = "/logovec.png";

export function SiteLogo({
  inverted = false,
  className,
}: {
  inverted?: boolean;
  className?: string;
}) {
  const brand = useBrand();
  const logoSrc = brand.logoUrl || DEFAULT_LOGO;
  const label = brand.name || "Urban Luxe";

  return (
    <Link
      href="/"
      prefetch
      className={cn("group inline-flex items-center", className)}
      aria-label={`${label} home`}
    >
      <Image
        src={logoSrc}
        alt={label}
        width={220}
        height={60}
        className={cn(
          "h-8 w-auto max-w-[10.5rem] object-contain object-left md:h-9 md:max-w-[12rem]",
          inverted && "brightness-110 contrast-125"
        )}
        unoptimized
        priority
      />
    </Link>
  );
}
