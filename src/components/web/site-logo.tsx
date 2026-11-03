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
      {/* Paper chip keeps the navy mark readable over the dark hero */}
      <span
        className={cn(
          "inline-flex items-center rounded-md transition-colors",
          inverted && "bg-[#F6F3EE] px-2 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
        )}
      >
        <Image
          src={logoSrc}
          alt={label}
          width={200}
          height={56}
          className="h-8 w-auto max-w-[9.5rem] object-contain object-left md:h-9 md:max-w-[11rem]"
          unoptimized
          priority
        />
      </span>
    </Link>
  );
}
