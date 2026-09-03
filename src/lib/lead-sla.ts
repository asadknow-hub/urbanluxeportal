import { daysSince } from "@/lib/dates";

export const HUMAN_LEAD_ACTIVITY_TYPES = [
  "note",
  "call",
  "whatsapp",
  "email",
  "phone",
  "in_person",
  "follow_up_done",
  "follow_up_scheduled",
] as const;

export function stageSlaClock(
  enteredAt: string | null | undefined,
  staleAfterDays: number | null | undefined
) {
  if (!staleAfterDays || staleAfterDays <= 0 || !enteredAt) return null;
  const elapsed = Math.max(0, daysSince(enteredAt));
  const dayNum = elapsed + 1;
  return {
    dayNum,
    sla: staleAfterDays,
    overdue: dayNum > staleAfterDays,
  };
}

export type FirstResponseClock = {
  tone: "warn" | "overdue";
  label: string;
  title: string;
};

export function firstResponseClock(lead: {
  first_responded_at?: string | null;
  first_response_due_at?: string | null;
  first_response_minutes?: number | null;
  assigned_to?: string | null;
}): FirstResponseClock | null {
  if (lead.first_responded_at || !lead.assigned_to || !lead.first_response_due_at) return null;
  const due = new Date(lead.first_response_due_at).getTime();
  if (Number.isNaN(due)) return null;
  const minutes = lead.first_response_minutes && lead.first_response_minutes > 0 ? lead.first_response_minutes : 15;
  const start = due - minutes * 60_000;
  const now = Date.now();
  const remainingMs = due - now;
  if (now >= due) {
    const late = formatDuration(now - due);
    return {
      tone: "overdue",
      label: late ? `overdue ${late}` : "overdue",
      title: "First-response SLA missed — contact this lead",
    };
  }
  const elapsedRatio = start < due ? (now - start) / (due - start) : 0;
  if (elapsedRatio < 0.5) return null;
  return {
    tone: "warn",
    label: `${formatDuration(remainingMs)} left`,
    title: "First-response SLA is halfway — contact this lead",
  };
}

function formatDuration(ms: number) {
  const totalMins = Math.max(1, Math.round(ms / 60_000));
  if (totalMins < 60) return `${totalMins}m`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours < 24) return mins ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
