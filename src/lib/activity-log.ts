import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function logActivity(params: {
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  diff?: Record<string, unknown>;
}) {
  const supabase = createSupabaseServiceClient();
  await supabase.from("activity_log").insert({
    actor_id: params.actorId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    diff: params.diff ?? null,
  });
}
