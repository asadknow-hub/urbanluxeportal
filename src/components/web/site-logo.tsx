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
      className={cn("group flex items-center gap-3", className)}
      aria-label="UrbanLuxe home"
    >
      <span
        className={cn(
          "relative flex h-9 w-9 items-center justify-center",
          inverted ? "text-[#f6f3ee]" : "text-[#14110e]"
        )}
        aria-hidden
      >
        <span className="absolute inset-0 border border-current/40" />
        <span className="absolute inset-[5px] border border-[#b0893a]" />
      </span>
      <span
        className={cn(
          "ul-display text-[1.15rem] leading-none tracking-[0.18em]",
          inverted ? "text-[#f6f3ee]" : "text-[#14110e]"
        )}
      >
        URBANLUXE
      </span>
    </Link>
  );
}
