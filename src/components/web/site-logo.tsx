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
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="UrbanLuxe home"
    >
      <span
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-sm",
          inverted ? "bg-white/10" : "bg-[#0B1D3D]"
        )}
        aria-hidden
      >
        <span className={cn("text-xs font-bold tracking-tighter", inverted ? "text-white" : "text-white")}>
          UL
        </span>
      </span>
      <span
        className={cn(
          "text-[1.05rem] font-semibold tracking-[0.08em]",
          inverted ? "text-white" : "text-[#0B1D3D]"
        )}
      >
        URBANLUXE
      </span>
    </Link>
  );
}
