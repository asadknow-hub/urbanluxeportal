"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadMyProfile } from "@/server/roster";

export type SignInResult = { ok: true } | { ok: false; error: string };

export async function signInStaff(formData: FormData): Promise<SignInResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    return { ok: false, error: signInError.message };
  }

  const { data: profile, error: profileError } = await loadMyProfile(supabase);

  if (profileError) {
    await supabase.auth.signOut();
    return { ok: false, error: profileError.message };
  }

  if (!profile) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "This login has no staff profile. Ask an admin to create your account from Staff.",
    };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return { ok: false, error: "Your account has been deactivated. Contact an admin." };
  }

  return { ok: true };
}
