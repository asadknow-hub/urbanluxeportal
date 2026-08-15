import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  href,
  featured = false,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  featured?: boolean;
  tone?: "default" | "danger";
}) {
  const inner = (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-xl bg-card p-5 ring-1 ring-border transition-all duration-200 motion-safe:hover:-translate-y-0.5",
        featured && "bg-secondary text-secondary-foreground ring-0",
        tone === "danger" && "ring-destructive/30"
      )}
    >
      <p
        className={cn(
          "text-[11px] font-medium tracking-wide text-muted-foreground",
          featured && "text-secondary-foreground/70"
        )}
      >
        {label}
      </p>
      <p className={cn("mt-2 text-2xl font-semibold tracking-tight", featured && "text-3xl")}>{value}</p>
      {hint ? (
        <p className={cn("mt-1.5 text-xs text-muted-foreground", featured && "text-secondary-foreground/60", tone === "danger" && "text-destructive")}>
          {hint}
        </p>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {inner}
      </Link>
    );
  }
  return inner;
}
