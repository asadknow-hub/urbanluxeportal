"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

/** Ensure the property has a share token; returns public path `/share/p/{token}`. */
export async function ensurePropertyShareLink(
  propertyId: string
): Promise<ActionResult<{ token: string; path: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (user.role === "accountant") return { ok: false, error: "Not authorized" };

    const supabase = await createSupabaseServerClient();
    const { data: row, error } = await supabase
      .from("properties")
      .select("id, share_token")
      .eq("id", propertyId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !row) return { ok: false, error: error?.message ?? "Property not found" };

    let token = row.share_token;
    if (!token) {
      token = crypto.randomUUID();
      const { error: updateError } = await supabase
        .from("properties")
        .update({ share_token: token, updated_at: new Date().toISOString() })
        .eq("id", propertyId);
      if (updateError) return { ok: false, error: updateError.message };
      revalidatePath(`/inventory/${propertyId}`);
    }

    return { ok: true, data: { token, path: `/share/p/${token}` } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
