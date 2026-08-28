import type { CrmDb } from "@/server/routing";

/** Fixed assignee from Lead Settings → Fields → Source option extra.default_assignee_id */
export async function resolveSourceDefaultAssignee(
  supabase: CrmDb,
  source: string | null | undefined
): Promise<string | null> {
  const key = source?.trim();
  if (!key) return null;

  const { data } = await supabase
    .from("lead_field_options")
    .select("extra")
    .eq("field_key", "source")
    .eq("value", key)
    .maybeSingle();

  const assignee = (data?.extra as Record<string, unknown> | null)?.default_assignee_id;
  return typeof assignee === "string" && assignee ? assignee : null;
}
