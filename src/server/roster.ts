import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type UserClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
export type StaffProfile = Database["public"]["Tables"]["profiles"]["Row"];

export async function loadMyProfile(supabase: UserClient) {
  const { data, error } = await supabase.rpc("crm_my_profile");
  return { data: data ?? null, error };
}

export async function loadStaffRoster(supabase: UserClient) {
  const { data, error } = await supabase.rpc("crm_staff_roster");
  return { data: (data ?? []) as StaffProfile[], error };
}

export async function loadStaffProfile(supabase: UserClient, id: string) {
  const { data, error } = await supabase.rpc("crm_staff_profile", { p_id: id });
  return { data: data ?? null, error };
}
