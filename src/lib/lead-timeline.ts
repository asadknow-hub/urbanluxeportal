import { formatEventKind, formatEventSummary, type LeadEventRow } from "@/lib/lead-audit";

export type LeadTimelineActivity = {
  id: string;
  type: string;
  summary: string | null;
  occurred_at: string;
  author?: { full_name: string } | null;
};

export type LeadTimelineItem = {
  id: string;
  source: "activity" | "event";
  type: string;
  summary: string | null;
  occurred_at: string;
  authorName: string | null;
  isSystem: boolean;
};

/** Events that duplicate a human `lead_activities` row on the same action. */
const REDUNDANT_EVENT_KINDS = new Set(["stage_changed"]);

export function mergeLeadTimeline(
  activities: LeadTimelineActivity[],
  events: LeadEventRow[]
): LeadTimelineItem[] {
  const items: LeadTimelineItem[] = activities.map((activity) => ({
    id: `a-${activity.id}`,
    source: "activity",
    type: activity.type,
    summary: activity.summary,
    occurred_at: activity.occurred_at,
    authorName: activity.author?.full_name ?? null,
    isSystem: false,
  }));

  for (const event of events) {
    if (REDUNDANT_EVENT_KINDS.has(event.kind)) continue;
    items.push({
      id: `e-${event.id}`,
      source: "event",
      type: event.kind,
      summary: formatEventSummary(event) ?? formatEventKind(event.kind),
      occurred_at: event.created_at,
      authorName: event.actor?.full_name ?? null,
      isSystem: true,
    });
  }

  return items.sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
  );
}

export function filterTimelineItems(items: LeadTimelineItem[], filter: string) {
  if (filter === "all") return items;
  if (filter === "system") return items.filter((item) => item.isSystem);
  return items.filter(
    (item) => !item.isSystem && item.type.toLowerCase().includes(filter)
  );
}
