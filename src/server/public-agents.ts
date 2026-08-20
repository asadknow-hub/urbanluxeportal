"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/server";

export type PublicAgent = {
  id: string;
  name: string;
  photo: string | null;
  phone: string | null;
};

/** Active advisors for public listing cards (falls back to empty → UI uses placeholders). */
export async function getPublicAgents(): Promise<PublicAgent[]> {
  try {
    const supabase = createSupabaseServiceClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, phone, role, is_active")
      .eq("is_active", true)
      .in("role", ["agent", "admin", "manager"])
      .order("full_name", { ascending: true })
      .limit(24);

    return (data ?? [])
      .filter((p) => p.full_name?.trim())
      .map((p) => ({
        id: p.id,
        name: p.full_name!.trim(),
        photo: p.avatar_url,
        phone: p.phone,
      }));
  } catch {
    return [];
  }
}
