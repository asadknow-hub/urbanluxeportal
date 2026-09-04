/**
 * Helpers for building safe PostgREST `.or()` / `.ilike` filter fragments.
 * Raw user input must not break filter grammar (`,`, `.`, `()`) or inject wildcards.
 */

/** Cap length and strip characters that break PostgREST filter syntax. */
export function sanitizeSearchQuery(q: string, maxLen = 80): string {
  return q.replace(/[%_,.()\\"]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLen);
}

/**
 * Build an `.or()` clause for case-insensitive substring match across columns.
 * Returns null when the query is empty after sanitize.
 */
export function ilikeOrFilter(columns: string[], q: string | undefined | null): string | null {
  const safe = q ? sanitizeSearchQuery(q) : "";
  if (!safe) return null;
  const pattern = `%${safe}%`;
  return columns.map((col) => `${col}.ilike.${pattern}`).join(",");
}

/**
 * Defense-in-depth agent lead scope (mirrors `crm_can_read_lead`):
 * own rows + unassigned in own desk, or house unassigned pool when agent has no desk.
 */
export function agentLeadScopeOr(userId: string, teamId: string | null): string {
  if (teamId) {
    return `assigned_to.eq.${userId},and(assigned_to.is.null,team_id.eq.${teamId}),and(assigned_to.is.null,team_id.is.null)`;
  }
  return `assigned_to.eq.${userId},assigned_to.is.null`;
}
