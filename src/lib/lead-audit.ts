import { formatDate } from "@/lib/dates";

export type LeadAssignmentRow = {
  id: string;
  from_user: string | null;
  to_user: string | null;
  reason: string;
  created_at: string;
  from_profile?: { full_name: string } | null;
  to_profile?: { full_name: string } | null;
};

export type LeadEventRow = {
  id: number;
  kind: string;
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  actor?: { full_name: string } | null;
};

const ASSIGNMENT_REASONS: Record<string, string> = {
  manual: "Manual reassignment",
  rule: "Routing rule",
  round_robin: "Round robin",
  claim: "Claimed from pool",
  sla_reclaim: "SLA reclaim",
  redistribute: "Redistributed",
  import: "CSV import",
  webhook: "Webhook ingest",
};

export function formatAssignmentReason(reason: string) {
  const base = reason.split(":")[0] ?? reason;
  if (ASSIGNMENT_REASONS[base]) {
    const suffix = reason.includes(":") ? reason.slice(reason.indexOf(":") + 1) : "";
    return suffix ? `${ASSIGNMENT_REASONS[base]} (${suffix})` : ASSIGNMENT_REASONS[base];
  }
  return reason.replace(/_/g, " ");
}

export function formatAssignmentLine(row: LeadAssignmentRow) {
  const from = row.from_profile?.full_name ?? (row.from_user ? "Previous agent" : "Pool");
  const to = row.to_profile?.full_name ?? (row.to_user ? "Agent" : "Pool");
  return `${from} → ${to}`;
}

const EVENT_KINDS: Record<string, string> = {
  created: "Lead created",
  stage_changed: "Stage changed",
  assigned: "Assigned",
  claimed: "Claimed from pool",
  ingested: "Captured",
  reinquiry: "Re-inquiry",
  converted: "Converted",
  sla_reclaim: "SLA reclaim",
};

export function formatEventKind(kind: string) {
  return EVENT_KINDS[kind] ?? kind.replace(/_/g, " ");
}

export function formatEventSummary(event: LeadEventRow) {
  const p = event.payload ?? {};
  if (event.kind === "stage_changed") {
    const stageName = typeof p.stage_name === "string" ? p.stage_name : null;
    const from = typeof p.from_stage === "string" ? p.from_stage : null;
    const to = typeof p.to_stage === "string" ? p.to_stage : stageName;
    if (from && to) return `${from} → ${to}`;
    if (to) return to;
  }
  if (event.kind === "claimed") {
    return "Agent claimed from pool";
  }
  if (event.kind === "created" && typeof p.source === "string") {
    return `Source: ${p.source.replace(/_/g, " ")}`;
  }
  if (typeof p.summary === "string") return p.summary;
  if (typeof p.note === "string") return p.note;
  return null;
}

export function formatAuditWhen(iso: string) {
  return formatDate(iso, "dd MMM yyyy, HH:mm");
}
