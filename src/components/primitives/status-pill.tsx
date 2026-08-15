import { cn } from "@/lib/utils";
import { getStatusColor } from "@/lib/status-colors";

export function StatusPill({ status, label }: { status: string; label?: string }) {
  const color = getStatusColor(status);
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", color.bg, color.text, color.border)}>
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}
