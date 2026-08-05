import { createSupabaseServiceClient } from "@/lib/supabase/server";

type NotifyParams = {
  userIds: string[];
  kind: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
};

export async function notify(params: NotifyParams) {
  const supabase = createSupabaseServiceClient();
  const rows = params.userIds.map((userId) => ({
    user_id: userId,
    kind: params.kind,
    title: params.title,
    body: params.body,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
  }));
  await supabase.from("notifications").insert(rows);
}

export async function notifyByRole(
  roles: string[],
  params: Omit<NotifyParams, "userIds">
) {
  const supabase = createSupabaseServiceClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id")
    .in("role", roles)
    .eq("is_active", true);

  if (!users || users.length === 0) return;
  await notify({ ...params, userIds: users.map((u) => u.id) });
}
