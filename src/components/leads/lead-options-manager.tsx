"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addLeadFieldOption,
  deleteLeadFieldOption,
  mergeLeadFieldOptions,
  updateLeadFieldOptionExtra,
} from "@/server/lead-field-options";
import {
  docCaptureMode,
  type DocCaptureMode,
  type LeadFieldOption,
} from "@/lib/lead-field-options";
import type { ActionResult } from "@/server/leads";
import { parseAreaNames } from "@/lib/parse-area-list";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LeadOptionsManager({
  fieldKey,
  title,
  description,
  options,
  kind = "list",
}: {
  fieldKey: string;
  title: string;
  description: string;
  options: LeadFieldOption[];
  kind?: "list" | "budget" | "score";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [paste, setPaste] = useState("");
  const [single, setSingle] = useState("");
  const [minAed, setMinAed] = useState("");
  const [maxAed, setMaxAed] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [bandLabel, setBandLabel] = useState("");

  function run(action: () => Promise<ActionResult>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(success);
        setPaste("");
        setSingle("");
        setMinAed("");
        setMaxAed("");
        setMinScore("");
        setMaxScore("");
        setBandLabel("");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-4 px-4 py-4">
        {kind === "list" ? (
          <>
            <div className="space-y-2">
              <Label className="text-xs">Paste a list</Label>
              <Textarea
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                rows={4}
                placeholder={"One value per line"}
                className="text-sm"
              />
              <Button
                type="button"
                size="sm"
                disabled={pending || parseAreaNames(paste).length === 0}
                onClick={() => run(() => mergeLeadFieldOptions(fieldKey, parseAreaNames(paste)), "Options added")}
              >
                {pending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Merge pasted values
              </Button>
            </div>
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1 space-y-2">
                <Label className="text-xs">Add one</Label>
                <Input
                  value={single}
                  onChange={(e) => setSingle(e.target.value)}
                  placeholder="e.g. Referral"
                  className="h-9"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (single.trim()) run(() => addLeadFieldOption(fieldKey, { label: single }), "Option added");
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="h-9"
                disabled={pending || !single.trim()}
                onClick={() => run(() => addLeadFieldOption(fieldKey, { label: single }), "Option added")}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        ) : kind === "score" ? (
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
            <div className="space-y-2">
              <Label className="text-xs">Name</Label>
              <Input value={bandLabel} onChange={(e) => setBandLabel(e.target.value)} className="h-9" placeholder="Hot" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Min score</Label>
              <Input value={minScore} onChange={(e) => setMinScore(e.target.value)} type="number" className="h-9" placeholder="70" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Max score</Label>
              <Input value={maxScore} onChange={(e) => setMaxScore(e.target.value)} type="number" className="h-9" placeholder="100" />
            </div>
            <Button
              type="button"
              size="sm"
              className="h-9"
              disabled={pending || !minScore.trim() || !maxScore.trim()}
              onClick={() =>
                run(
                  () => addLeadFieldOption(fieldKey, { label: bandLabel, minScore, maxScore }),
                  "Score band added"
                )
              }
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <div className="space-y-2">
              <Label className="text-xs">Min (AED)</Label>
              <Input value={minAed} onChange={(e) => setMinAed(e.target.value)} type="number" className="h-9" placeholder="500000" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Max (AED)</Label>
              <Input value={maxAed} onChange={(e) => setMaxAed(e.target.value)} type="number" className="h-9" placeholder="2000000" />
            </div>
            <Button
              type="button"
              size="sm"
              className="h-9"
              disabled={pending || !minAed.trim() || !maxAed.trim()}
              onClick={() =>
                run(
                  () => addLeadFieldOption(fieldKey, { label: "", minAed, maxAed }),
                  "Budget band added"
                )
              }
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {options.length} in list
        </p>
        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground">No options yet.</p>
        ) : (
          <ul className="max-h-[28rem] space-y-1 overflow-y-auto">
            {kind === "list" && fieldKey === "doc_category" && (
              <li className="grid grid-cols-[minmax(0,1fr)_10.5rem_1.75rem] items-center gap-2 px-1 pb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <span>Category</span>
                <span>On upload</span>
                <span />
              </li>
            )}
            {options.map((row) => (
              <li
                key={row.id}
                className={
                  fieldKey === "doc_category"
                    ? "grid grid-cols-[minmax(0,1fr)_10.5rem_1.75rem] items-center gap-2 rounded-md px-1 py-1.5"
                    : "flex items-center justify-between gap-2 rounded-md px-1 py-1.5"
                }
              >
                <span className="truncate text-sm">
                  {kind === "score"
                    ? `${row.label} (${Number(row.extra?.min_score)}–${Number(row.extra?.max_score)})`
                    : row.label}
                </span>
                {fieldKey === "doc_category" && (
                  <Select
                    value={docCaptureMode(row)}
                    onValueChange={(v) => {
                      const capture = (v === "note" ? "note" : "expiry") as DocCaptureMode;
                      run(() => updateLeadFieldOptionExtra(row.id, { capture }), "Capture updated");
                    }}
                    disabled={pending}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expiry">Expiry date</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove ${row.label}`}
                  disabled={pending}
                  onClick={() => run(() => deleteLeadFieldOption(row.id), "Option removed")}
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
