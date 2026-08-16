"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addLeadNationality,
  deleteLeadNationality,
  mergeLeadNationalities,
} from "@/server/lead-nationalities";
import type { ActionResult } from "@/server/leads";
import { parseAreaFile, parseAreaNames } from "@/lib/parse-area-list";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";

export function LeadNationalitiesManager({
  nationalities,
}: {
  nationalities: { id: string; name: string }[];
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
        <h2 className="text-sm font-medium text-foreground">Nationalities</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          This list powers the Nationality dropdown on lead create and lead detail. The world list is already loaded; add or remove as needed.
        </p>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="space-y-2">
          <Label className="text-xs">Paste a list</Label>
          <Textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={4}
            placeholder={"Indian\nBritish\nEmirati"}
            className="text-sm"
          />
          <Button
            type="button"
            size="sm"
            disabled={pending || parseAreaNames(paste).length === 0}
            onClick={() => run(() => mergeLeadNationalities(parseAreaNames(paste)), "Nationalities added")}
          >
            {pending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Merge pasted nationalities
          </Button>
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
                  const result = await mergeLeadNationalities(names);
                  if (result.ok) {
                    toast.success(`Merged ${names.length} from file`);
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
            <Label className="text-xs">Add one nationality</Label>
            <Input
              value={single}
              onChange={(e) => setSingle(e.target.value)}
              placeholder="e.g. Emirati"
              className="h-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (single.trim()) run(() => addLeadNationality(single), "Nationality added");
                }
              }}
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="h-9"
            disabled={pending || !single.trim()}
            onClick={() => run(() => addLeadNationality(single), "Nationality added")}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {nationalities.length} in list
        </p>
        <ul className="max-h-[28rem] space-y-1 overflow-y-auto">
          {nationalities.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5">
              <span className="truncate text-sm">{item.name}</span>
              <button
                type="button"
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remove ${item.name}`}
                disabled={pending}
                onClick={() => run(() => deleteLeadNationality(item.id), "Nationality removed")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
