import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

export function BrandMark({
  inverted = false,
  compact = false,
}: {
  inverted?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 overflow-hidden">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          inverted ? "bg-primary text-primary-foreground" : "bg-sidebar-primary text-sidebar-primary-foreground"
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
          UrbanLuxe
        </span>
      )}
    </div>
  );
}
