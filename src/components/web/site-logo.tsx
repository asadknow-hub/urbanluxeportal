"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBrand } from "@/components/brand/brand-provider";

function Wordmark({ inverted }: { inverted: boolean }) {
  return (
    <span
      className="inline-flex items-baseline tracking-[0.02em]"
      style={{ fontFamily: "var(--font-headline), var(--font-poppins), system-ui, sans-serif" }}
    >
      <span
        className={cn(
          "text-[1.15rem] font-bold uppercase leading-none md:text-[1.35rem]",
          inverted ? "text-white" : "text-[#07111F]"
        )}
      >
        Urban
      </span>
      <span className="text-[1.15rem] font-bold uppercase leading-none text-[#008040] md:text-[1.35rem]">
        Luxe
      </span>
    </span>
  );
}

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
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label={`${label} home`}
    >
      <span
        className={cn(
          "grid h-9 w-9 place-items-center rounded-lg border",
          inverted
            ? "border-[#008040]/45 bg-[#008040]/15 text-[#008040]"
            : "border-[#008040]/35 bg-[#008040]/10 text-[#008040]"
        )}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 18V9.5L12 4l8 5.5V18" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 18v-5h6v5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
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
        <Wordmark inverted={inverted} />
      )}
    </Link>
  );
}
