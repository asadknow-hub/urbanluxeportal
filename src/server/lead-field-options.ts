"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { parseAreaNames } from "@/lib/parse-area-list";
import {
  isLeadOptionField,
  slugifyOptionValue,
  type LeadOptionFieldKey,
} from "@/lib/lead-field-options";
import type { ActionResult } from "@/server/leads";

function canManage(role: string) {
  return role === "admin" || role === "manager";
}

function revalidateLeadPaths() {
  revalidatePath("/settings/leads");
  revalidatePath("/leads");
}

export async function mergeLeadFieldOptions(
  fieldKey: string,
  rawNames: string[]
): Promise<ActionResult<{ added: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManage(user.role)) return { ok: false, error: "Not authorized" };
    if (!isLeadOptionField(fieldKey) || fieldKey === "budget") {
      return { ok: false, error: "This field cannot be pasted as a name list" };
    }

    const names = parseAreaNames(rawNames.join("\n"));
    if (names.length === 0) return { ok: false, error: "No values found" };

    const supabase = createSupabaseServiceClient();
    const { data: existing, error: existingError } = await supabase
      .from("lead_field_options")
      .select("value")
      .eq("field_key", fieldKey);
    if (existingError) return { ok: false, error: existingError.message };

    const have = new Set((existing ?? []).map((row: { value: string }) => row.value));
    const { data: maxSort } = await supabase
      .from("lead_field_options")
      .select("sort")
      .eq("field_key", fieldKey)
      .order("sort", { ascending: false })
      .limit(1)
      .maybeSingle();
    let sort = Number(maxSort?.sort ?? 0);

    const fresh = names
      .map((label) => {
        const value = slugifyOptionValue(label);
        return { label, value };
      })
      .filter((row) => row.value && !have.has(row.value));

    if (fresh.length === 0) return { ok: true, data: { added: 0 } };

    const { error } = await supabase.from("lead_field_options").insert(
      fresh.map((row) => {
        sort += 10;
        return { field_key: fieldKey, value: row.value, label: row.label, sort };
      })
    );
    if (error) return { ok: false, error: error.message };

    revalidateLeadPaths();
    return { ok: true, data: { added: fresh.length } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function addLeadFieldOption(
  fieldKey: string,
  input: { label: string; minAed?: string; maxAed?: string }
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManage(user.role)) return { ok: false, error: "Not authorized" };
    if (!isLeadOptionField(fieldKey)) return { ok: false, error: "Unknown field" };

    const supabase = createSupabaseServiceClient();
    const { data: maxSort } = await supabase
      .from("lead_field_options")
      .select("sort")
      .eq("field_key", fieldKey)
      .order("sort", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sort = Number(maxSort?.sort ?? 0) + 10;

    if (fieldKey === "budget") {
      const min = Number(input.minAed);
      const max = Number(input.maxAed);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) {
        return { ok: false, error: "Enter a valid min and max budget in AED" };
      }
      const min_fils = Math.round(min * 100);
      const max_fils = Math.round(max * 100);
      const value = `${min_fils}_${max_fils}`;
      const label = input.label.trim() || `AED ${min.toLocaleString()} – ${max.toLocaleString()}`;
      const { error } = await supabase.from("lead_field_options").insert({
        field_key: fieldKey,
        value,
        label,
        sort,
        extra: { min_fils, max_fils },
      });
      if (error) return { ok: false, error: error.message };
    } else {
      const label = input.label.trim();
      if (!label) return { ok: false, error: "Name required" };
      const value = slugifyOptionValue(label);
      if (!value) return { ok: false, error: "Name required" };
      const { error } = await supabase.from("lead_field_options").insert({
        field_key: fieldKey,
        value,
        label,
        sort,
      });
      if (error) return { ok: false, error: error.message };
    }

    revalidateLeadPaths();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteLeadFieldOption(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManage(user.role)) return { ok: false, error: "Not authorized" };

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from("lead_field_options").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidateLeadPaths();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export type { LeadOptionFieldKey };
