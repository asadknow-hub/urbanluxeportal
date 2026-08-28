export type TimelineCursor = {
  at: string;
  source: "activity" | "event";
  id: string;
};

export function encodeTimelineCursor(cursor: TimelineCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeTimelineCursor(token: string): TimelineCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as TimelineCursor;
    if (!parsed?.at || !parsed?.source || !parsed?.id) return null;
    if (parsed.source !== "activity" && parsed.source !== "event") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Descending merge order: newer first; event before activity at same timestamp. */
export function compareTimelineItems(
  a: { occurred_at: string; source: "activity" | "event"; id: string },
  b: { occurred_at: string; source: "activity" | "event"; id: string }
): number {
  const ta = new Date(a.occurred_at).getTime();
  const tb = new Date(b.occurred_at).getTime();
  if (ta !== tb) return tb - ta;
  if (a.source !== b.source) return a.source === "event" ? -1 : 1;
  const idA = a.id.startsWith("a-") || a.id.startsWith("e-") ? a.id.slice(2) : a.id;
  const idB = b.id.startsWith("a-") || b.id.startsWith("e-") ? b.id.slice(2) : b.id;
  return idB.localeCompare(idA);
}

export function isOlderThanCursor(
  item: { occurred_at: string; source: "activity" | "event"; id: string },
  cursor: TimelineCursor
): boolean {
  const cursorItem = {
    occurred_at: cursor.at,
    source: cursor.source,
    id: `${cursor.source === "activity" ? "a" : "e"}-${cursor.id}`,
  };
  return compareTimelineItems(item, cursorItem) > 0;
}

export function cursorFromTimelineItem(item: {
  occurred_at: string;
  source: "activity" | "event";
  id: string;
}): TimelineCursor {
  const rawId = item.id.startsWith("a-") || item.id.startsWith("e-") ? item.id.slice(2) : item.id;
  return {
    at: item.occurred_at,
    source: item.source,
    id: rawId,
  };
}
