"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStageSla } from "@/server/leads";
import { toast } from "sonner";

export function StageSlaEditor({
  stageId,
  value,
}: {
  stageId: string;
  value: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [days, setDays] = useState(value == null ? "" : String(value));

  function save(raw: string) {
    const trimmed = raw.trim();
    const next = trimmed === "" ? null : Number(trimmed);
    if (next !== null && (!Number.isInteger(next) || next < 1 || next > 90)) {
      toast.error("Use a whole number of days between 1 and 90, or leave blank.");
      setDays(value == null ? "" : String(value));
      return;
    }
    startTransition(async () => {
      const result = await updateLeadStageSla(stageId, next);
      if (result.ok) router.refresh();
      else toast.error(result.error ?? "Could not save SLA");
    });
  }

  return (
    <label className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200/60 pt-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stage SLA (days)</span>
      <input
        type="number"
        min={1}
        max={90}
        inputMode="numeric"
        disabled={pending}
        value={days}
        placeholder="Off"
        className="h-8 w-16 rounded-md border border-slate-200 bg-white px-2 text-right text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
        onChange={(e) => setDays(e.target.value)}
        onBlur={(e) => save(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
    </label>
  );
}
