"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBrand } from "@/components/brand/brand-provider";

/** Color mark for solid / light header */
const LOGO_SOLID = "/logovec.png";
/** Light mark for transparent header over dark hero */
const LOGO_LIGHT = "/logoveclight.png";

export function SiteLogo({
  inverted = false,
  className,
}: {
  inverted?: boolean;
  className?: string;
}) {
  const brand = useBrand();
  const label = brand.name || "Urban Luxe";
  /** Transparent-over-dark → light logo; solid header → color logo */
  const logoSrc = inverted
    ? brand.logoDarkUrl || LOGO_LIGHT
    : brand.logoUrl || LOGO_SOLID;

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
        className="h-9 w-auto max-w-[12rem] object-contain object-left md:h-11 md:max-w-[14rem]"
        unoptimized
        priority
      />
    </Link>
  );
}
