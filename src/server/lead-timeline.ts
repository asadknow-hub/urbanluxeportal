"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { LeadEventRow } from "@/lib/lead-audit";
import {
  cursorFromTimelineItem,
  decodeTimelineCursor,
  encodeTimelineCursor,
  isOlderThanCursor,
} from "@/lib/lead-timeline-cursor";
import {
  filterTimelineItems,
  mergeLeadTimeline,
  type LeadTimelineActivity,
  type LeadTimelineItem,
} from "@/lib/lead-timeline";

export const TIMELINE_PAGE_SIZE = 20;
const FETCH_BUFFER = 45;

function firstRel<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function getLeadTimelinePage(
  leadId: string,
  cursorToken: string | null,
  filter = "all"
): Promise<
  | { ok: true; items: LeadTimelineItem[]; nextCursor: string | null; activityCount: number }
  | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const cursor = cursorToken ? decodeTimelineCursor(cursorToken) : null;
  if (cursorToken && !cursor) return { ok: false, error: "Invalid cursor" };

  const supabase = await createSupabaseServerClient();

  const includeActivities = filter !== "system";
  const includeEvents = filter === "all" || filter === "system";

  const activityQuery = includeActivities
    ? (() => {
        let query = supabase
          .from("lead_activities")
          .select(`*, author:profiles!lead_activities_created_by_fkey(id, full_name)`)
          .eq("lead_id", leadId)
          .order("occurred_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(FETCH_BUFFER);
        if (cursor) query = query.lte("occurred_at", cursor.at);
        if (filter !== "all" && filter !== "system") {
          query = query.ilike("type", `%${filter}%`);
        }
        return query;
      })()
    : Promise.resolve({ data: [], error: null });

  const eventQuery = includeEvents
    ? (() => {
        let query = supabase
          .from("lead_events")
          .select(
            `id, kind, actor_id, payload, created_at, actor:profiles!lead_events_actor_id_fkey(full_name)`
          )
          .eq("lead_id", leadId)
          .neq("kind", "stage_changed")
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(FETCH_BUFFER);
        if (cursor) query = query.lte("created_at", cursor.at);
        return query;
      })()
    : Promise.resolve({ data: [], error: null });

  const [{ data: activityRows, error: actErr }, { data: eventRows, error: evErr }, { count: activityCount }] =
    await Promise.all([
      activityQuery,
      eventQuery,
      supabase
        .from("lead_activities")
        .select("id", { count: "exact", head: true })
        .eq("lead_id", leadId),
    ]);

  if (actErr) return { ok: false, error: actErr.message };
  if (evErr) return { ok: false, error: evErr.message };

  const activities: LeadTimelineActivity[] = (activityRows ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    summary: row.summary,
    occurred_at: row.occurred_at,
    author: firstRel(row.author as { id: string; full_name: string } | { id: string; full_name: string }[] | null),
  }));

  const events: LeadEventRow[] = (eventRows ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    actor_id: row.actor_id,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    created_at: row.created_at,
    actor: firstRel(row.actor as { full_name: string } | { full_name: string }[] | null),
  }));

  let merged = mergeLeadTimeline(activities, events);
  if (filter !== "all") {
    merged = filterTimelineItems(merged, filter);
  }
  if (cursor) {
    merged = merged.filter((item) => isOlderThanCursor(item, cursor));
  }

  const page = merged.slice(0, TIMELINE_PAGE_SIZE);
  const hasMore = merged.length > TIMELINE_PAGE_SIZE;
  const nextCursor =
    hasMore && page.length > 0 ? encodeTimelineCursor(cursorFromTimelineItem(page[page.length - 1]!)) : null;

  return {
    ok: true,
    items: page,
    nextCursor,
    activityCount: activityCount ?? 0,
  };
}

export async function loadLeadTimelinePage(
  leadId: string,
  cursorToken: string | null,
  filter: string
): Promise<
  | { ok: true; items: LeadTimelineItem[]; nextCursor: string | null }
  | { ok: false; error: string }
> {
  const result = await getLeadTimelinePage(leadId, cursorToken, filter);
  if (!result.ok) return result;
  return { ok: true, items: result.items, nextCursor: result.nextCursor };
}
