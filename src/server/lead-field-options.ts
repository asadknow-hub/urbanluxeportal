"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { parseAreaNames } from "@/lib/parse-area-list";
import {
  isLeadOptionField,
  isRangeOptionField,
  slugifyOptionValue,
  defaultDocCapture,
  type LeadOptionFieldKey,
} from "@/lib/lead-field-options";
import type { ActionResult } from "@/server/leads";
import { canManageCrm } from "@/lib/permissions";

function canManage(role: string) {
  return canManageCrm(role);
}

function revalidateLeadPaths() {
  revalidatePath("/settings/leads");
  revalidatePath("/leads", "layout");
  revalidatePath("/team", "layout");
  revalidatePath("/pipeline", "layout");
}

export async function mergeLeadFieldOptions(
  fieldKey: string,
  rawNames: string[]
): Promise<ActionResult<{ added: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManage(user.role)) return { ok: false, error: "Not authorized" };
    if (!isLeadOptionField(fieldKey) || isRangeOptionField(fieldKey)) {
      return { ok: false, error: "This field cannot be pasted as a name list" };
    }

    const names = parseAreaNames(rawNames.join("\n"));
    if (names.length === 0) return { ok: false, error: "No values found" };

    const supabase = await createSupabaseServerClient();
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
        return {
          field_key: fieldKey,
          value: row.value,
          label: row.label,
          sort,
          extra: fieldKey === "doc_category" ? { capture: defaultDocCapture(row.value) } : {},
        };
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
  input: { label: string; minAed?: string; maxAed?: string; minScore?: string; maxScore?: string }
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManage(user.role)) return { ok: false, error: "Not authorized" };
    if (!isLeadOptionField(fieldKey)) return { ok: false, error: "Unknown field" };

    const supabase = await createSupabaseServerClient();
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
    } else if (fieldKey === "score") {
      const min = Number(input.minScore);
      const max = Number(input.maxScore);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max > 100 || max < min) {
        return { ok: false, error: "Enter a valid score range between 0 and 100" };
      }
      const value = slugifyOptionValue(input.label) || `${min}_${max}`;
      const label = input.label.trim() || `${min} – ${max}`;
      const { error } = await supabase.from("lead_field_options").insert({
        field_key: fieldKey,
        value,
        label,
        sort,
        extra: { min_score: min, max_score: max },
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
        extra: fieldKey === "doc_category" ? { capture: defaultDocCapture(value) } : {},
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

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("lead_field_options").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidateLeadPaths();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateLeadFieldOptionExtra(
  id: string,
  patch: Record<string, unknown>
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManage(user.role)) return { ok: false, error: "Not authorized" };

    const supabase = await createSupabaseServerClient();
    if (patch.capture != null && patch.capture !== "expiry" && patch.capture !== "note") {
      return { ok: false, error: "Capture must be expiry or note" };
    }

    const { data: row, error: readError } = await supabase
      .from("lead_field_options")
      .select("field_key, extra")
      .eq("id", id)
      .single();
    if (readError) return { ok: false, error: readError.message };
    if (patch.capture != null && row?.field_key !== "doc_category") {
      return { ok: false, error: "Capture only applies to document categories" };
    }
    if ("default_assignee_id" in patch && row?.field_key !== "source") {
      return { ok: false, error: "Default assignee only applies to lead sources" };
    }
    if (
      patch.default_assignee_id !== undefined &&
      patch.default_assignee_id !== null &&
      typeof patch.default_assignee_id !== "string"
    ) {
      return { ok: false, error: "Invalid assignee" };
    }

    const extra = { ...((row?.extra as Record<string, unknown> | null) ?? {}), ...patch };
    if (patch.default_assignee_id === null || patch.default_assignee_id === "") {
      delete extra.default_assignee_id;
    }
    const { error } = await supabase.from("lead_field_options").update({ extra }).eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidateLeadPaths();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export type { LeadOptionFieldKey };
