import type { SupabaseClient } from "@supabase/supabase-js";

/** First active open pipeline stage (sort order). Names are user-editable in Lead Settings. */
export async function resolveDefaultLeadStageId(
  supabase: SupabaseClient
): Promise<string | null> {
  const { data } = await supabase
    .from("lead_stages")
    .select("id")
    .eq("kind", "open")
    .eq("is_active", true)
    .order("sort", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

/** Map stage kind to legacy leads.status for list filters and reports. */
export function leadStatusForStageKind(
  kind: string,
  sort: number
): "new" | "qualified" | "converted" | "unqualified" {
  if (kind === "won") return "converted";
  if (kind === "lost" || kind === "junk") return "unqualified";
  return sort <= 1 ? "new" : "qualified";
}
