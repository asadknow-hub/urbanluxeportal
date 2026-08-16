"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addLeadArea, deleteLeadArea, mergeLeadAreas, replaceLeadAreas } from "@/server/lead-areas";
import type { ActionResult } from "@/server/leads";
import { parseAreaFile, parseAreaNames } from "@/lib/parse-area-list";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";

export function LeadAreasManager({
  areas,
}: {
  areas: { id: string; name: string }[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [paste, setPaste] = useState("");
  const [single, setSingle] = useState("");

  function run(action: () => Promise<ActionResult>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(success);
        setPaste("");
        setSingle("");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-foreground">Preferred areas</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          This list powers the Preferred Areas dropdown on lead create and lead detail. One name per line — commas stay in the name (for example Wadi Al Safa 6, Wadi Al Safa).
        </p>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="space-y-2">
          <Label className="text-xs">Paste a list</Label>
          <Textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={6}
            placeholder={"Wadi Al Safa 6, Wadi Al Safa\nWarsan 2, Warsan\nPalm Jumeirah"}
            className="text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pending || parseAreaNames(paste).length === 0}
              onClick={() => run(() => mergeLeadAreas(parseAreaNames(paste)), "Areas added")}
            >
              {pending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Merge pasted areas
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending || parseAreaNames(paste).length === 0}
              onClick={() => {
                const count = parseAreaNames(paste).length;
                if (!window.confirm(`Replace the whole list with these ${count} names? The current ${areas.length} areas will be removed.`)) return;
                run(() => replaceLeadAreas(parseAreaNames(paste)), "Area list replaced");
              }}
            >
              Replace list
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Upload Excel or CSV</Label>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv,.txt"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              startTransition(async () => {
                try {
                  const names = await parseAreaFile(file);
                  const result = await mergeLeadAreas(names);
                  if (result.ok) {
                    toast.success(`Merged ${names.length} area${names.length === 1 ? "" : "s"} from file`);
                    router.refresh();
                  } else {
                    toast.error(result.error ?? "Failed");
                  }
                } catch {
                  toast.error("Could not read that file");
                }
              });
            }}
          />
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-3.5 w-3.5" />
            Choose file
          </Button>
        </div>

        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Label className="text-xs">Add one area</Label>
            <Input
              value={single}
              onChange={(e) => setSingle(e.target.value)}
              placeholder="e.g. Jumeirah Village Circle"
              className="h-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (single.trim()) run(() => addLeadArea(single), "Area added");
                }
              }}
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="h-9"
            disabled={pending || !single.trim()}
            onClick={() => run(() => addLeadArea(single), "Area added")}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {areas.length} in list
        </p>
        {areas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No areas yet. Paste or upload a list to start.</p>
        ) : (
          <ul className="max-h-[28rem] space-y-1 overflow-y-auto">
            {areas.map((area) => (
              <li key={area.id} className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5">
                <span className="truncate text-sm">{area.name}</span>
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove ${area.name}`}
                  disabled={pending}
                  onClick={() => run(() => deleteLeadArea(area.id), "Area removed")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
