"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime, isOverdue } from "@/lib/dates";
import { completeFollowUp, scheduleFollowUp } from "@/server/leads";
import { toast } from "sonner";
import { CalendarClock, Check, Loader2 } from "lucide-react";

function toDatetimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function FollowUpPanel({
  leadId,
  leadName,
  nextFollowUpAt,
  scheduledNotes,
  canEdit,
}: {
  leadId: string;
  leadName?: string;
  nextFollowUpAt: string | null;
  scheduledNotes?: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [followUpAt, setFollowUpAt] = useState(nextFollowUpAt);
  const [notes, setNotes] = useState(scheduledNotes ?? "");
  const [showForm, setShowForm] = useState(false);
  const [draftDate, setDraftDate] = useState(toDatetimeLocal(nextFollowUpAt));
  const [draftNotes, setDraftNotes] = useState(scheduledNotes ?? "");

  const overdue = followUpAt ? isOverdue(followUpAt) : false;

  function handleSchedule() {
    if (!draftDate) return;
    const iso = new Date(draftDate).toISOString();
    setFollowUpAt(iso);
    setNotes(draftNotes);
    setShowForm(false);
    startTransition(async () => {
      const result = await scheduleFollowUp(leadId, iso, draftNotes || undefined);
      if (result.ok) {
        toast.success("Follow-up scheduled");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to schedule");
        setFollowUpAt(nextFollowUpAt);
      }
    });
  }

  function handleComplete() {
    setFollowUpAt(null);
    setNotes("");
    startTransition(async () => {
      const result = await completeFollowUp(leadId);
      if (result.ok) {
        toast.success("Follow-up completed");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to complete");
        setFollowUpAt(nextFollowUpAt);
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-primary p-4 text-primary-foreground">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-[#F4F2EA]">Follow-up</h2>
        </div>
        <Link href={`/leads/${leadId}`} className="text-xs font-medium text-primary hover:underline">
          {leadName ?? "Lead"}
        </Link>
      </div>

      {followUpAt ? (
        <div className="space-y-2 text-sm">
          <p className={overdue ? "font-medium text-red-300" : "text-[#D8D5C8]"}>
            {overdue ? "Overdue — " : "Scheduled for "}
            <span className="font-mono text-primary">{formatDateTime(followUpAt)}</span>
          </p>
          {notes ? <p className="text-[0.88rem] text-white/90">{notes}</p> : null}
          {canEdit && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() => {
                  setDraftDate(toDatetimeLocal(followUpAt));
                  setDraftNotes(notes);
                  setShowForm(true);
                }}
                disabled={pending}
              >
                Reschedule
              </Button>
              <Button size="sm" className="h-8" onClick={handleComplete} disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                Done
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-[#D8D5C8]">
          No follow-up set{canEdit ? " — schedule the next touchpoint." : "."}
        </p>
      )}

      {canEdit && (showForm || !followUpAt) && (
        <div className="mt-3 space-y-2 border-t border-white/12 pt-3">
          <Input
            type="datetime-local"
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
            className="h-9 border-white/20 bg-white/5 text-xs text-white"
          />
          <Input
            value={draftNotes}
            onChange={(e) => setDraftNotes(e.target.value)}
            placeholder="Call, WhatsApp, viewing…"
            className="h-9 border-white/20 bg-white/5 text-xs text-white"
          />
          <Button size="sm" className="w-full" onClick={handleSchedule} disabled={pending || !draftDate}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save follow-up"}
          </Button>
        </div>
      )}
    </div>
  );
}
