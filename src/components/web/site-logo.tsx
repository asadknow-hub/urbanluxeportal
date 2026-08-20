import Link from "next/link";
import { cn } from "@/lib/utils";

export function SiteLogo({
  inverted = false,
  className,
}: {
  inverted?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      prefetch
      className={cn("group inline-flex items-center", className)}
      aria-label="Urban Luxe home"
    >
      <span
        className={cn(
          "text-[1.125rem] font-bold tracking-[0.06em] md:text-[1.2rem]",
          inverted ? "text-white" : "text-[#0B1D3D]"
        )}
      >
        URBAN LUXE
      </span>
    </Link>
  );
}
