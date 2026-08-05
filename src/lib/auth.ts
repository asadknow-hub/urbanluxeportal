import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/permissions";

export type SessionUser = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  commission_rate: number | null;
  is_active: boolean;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[auth] getUser error:", authError.message);
      return null;
    }
    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[auth] profile query error:", profileError.message);
      return null;
    }
    if (!profile) return null;
    if (!profile.is_active) return null;

    return {
      id: profile.id,
      email: profile.email ?? user.email ?? "",
      full_name: profile.full_name ?? "",
      role: profile.role as UserRole,
      avatar_url: profile.avatar_url,
      commission_rate: profile.commission_rate,
      is_active: profile.is_active,
    };
  } catch (err) {
    console.error("[auth] unexpected error:", err);
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
