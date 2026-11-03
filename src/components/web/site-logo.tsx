"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBrand } from "@/components/brand/brand-provider";

function Wordmark({ inverted }: { inverted: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-0 tracking-[0.04em]">
      <span
        className={cn(
          "text-[1.05rem] font-extrabold uppercase md:text-[1.2rem]",
          inverted ? "text-white" : "text-[#07111F]"
        )}
      >
        Urban
      </span>
      <span className="text-[1.05rem] font-extrabold uppercase text-[#00C853] md:text-[1.2rem]">
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
            ? "border-[#00C853]/40 bg-[#00C853]/15 text-[#00C853]"
            : "border-[#00C853]/30 bg-[#00C853]/10 text-[#00C853]"
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
