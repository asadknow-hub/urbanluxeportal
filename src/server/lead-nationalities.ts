"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { parseAreaNames } from "@/lib/parse-area-list";
import type { ActionResult } from "@/server/leads";

function canManage(role: string) {
  return role === "admin" || role === "manager";
}

export async function mergeLeadNationalities(rawNames: string[]): Promise<ActionResult<{ added: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManage(user.role)) return { ok: false, error: "Not authorized" };

    const names = parseAreaNames(rawNames.join("\n"));
    if (names.length === 0) return { ok: false, error: "No nationality names found" };

    const supabase = createSupabaseServiceClient();
    const { data: existing, error: existingError } = await supabase.from("lead_nationalities").select("name_norm");
    if (existingError) return { ok: false, error: existingError.message };

    const have = new Set((existing ?? []).map((row: { name_norm: string }) => row.name_norm));
    const fresh = names.filter((name) => !have.has(name.trim().toLowerCase()));
    if (fresh.length === 0) {
      return { ok: true, data: { added: 0 } };
    }

    const { error } = await supabase.from("lead_nationalities").insert(fresh.map((name) => ({ name })));
    if (error) return { ok: false, error: error.message };

    revalidatePath("/settings/leads");
    revalidatePath("/leads");
    return { ok: true, data: { added: fresh.length } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function addLeadNationality(name: string): Promise<ActionResult> {
  return mergeLeadNationalities([name]);
}

export async function deleteLeadNationality(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManage(user.role)) return { ok: false, error: "Not authorized" };

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from("lead_nationalities").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/settings/leads");
    revalidatePath("/leads");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
