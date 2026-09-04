"use client";

import { useEffect, useState, useTransition } from "react";
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

  useEffect(() => {
    setFollowUpAt(nextFollowUpAt);
    setNotes(scheduledNotes ?? "");
    setDraftDate(toDatetimeLocal(nextFollowUpAt));
    setDraftNotes(scheduledNotes ?? "");
  }, [nextFollowUpAt, scheduledNotes]);

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
    <div className="overflow-hidden rounded-[14px] border border-primary/20 bg-primary text-primary-foreground shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-white/15 px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-white" />
          <h2 className="text-sm font-semibold text-white">Follow-up</h2>
        </div>
        <Link
          href={`/leads/${leadId}`}
          className="truncate text-xs font-medium text-white/80 hover:text-white hover:underline"
        >
          {leadName ?? "Open lead"}
        </Link>
      </div>

      <div className="space-y-3 px-4 py-3">
        {followUpAt ? (
          <div className="space-y-2 text-sm">
            <p className={overdue ? "font-medium text-red-200" : "text-white/85"}>
              {overdue ? "Overdue — " : "Scheduled for "}
              <span className="font-mono text-white">{formatDateTime(followUpAt)}</span>
            </p>
            {notes ? <p className="text-[0.84rem] text-white/80">{notes}</p> : null}
            {canEdit ? (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    setDraftDate(toDatetimeLocal(followUpAt));
                    setDraftNotes(notes);
                    setShowForm(true);
                  }}
                  disabled={pending}
                >
                  Reschedule
                </Button>
                <Button
                  size="sm"
                  className="h-8 border-0 bg-white text-primary hover:bg-white/90"
                  onClick={handleComplete}
                  disabled={pending}
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                  Done
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-white/75">
            No follow-up set{canEdit ? " — schedule the next touchpoint." : "."}
          </p>
        )}

        {canEdit && (showForm || !followUpAt) ? (
          <div className="space-y-2 border-t border-white/15 pt-3">
            <Input
              type="datetime-local"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              className="h-9 border-white/20 bg-white/10 text-xs text-white placeholder:text-white/50"
            />
            <Input
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              placeholder="Call, WhatsApp, viewing…"
              className="h-9 border-white/20 bg-white/10 text-xs text-white placeholder:text-white/50"
            />
            <Button
              size="sm"
              className="w-full border-0 bg-white text-primary hover:bg-white/90"
              onClick={handleSchedule}
              disabled={pending || !draftDate}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save follow-up"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
