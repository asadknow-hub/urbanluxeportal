"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { canManageCrm } from "@/lib/permissions";
import { propertyMediaPublicUrl } from "@/lib/property-media";
import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const addSchema = z.object({
  propertyId: z.string().uuid(),
  storagePath: z.string().min(1),
  kind: z.enum(["photo", "floorplan", "video"]).default("photo"),
  caption: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function addPropertyMedia(
  input: z.infer<typeof addSchema>
): Promise<ActionResult<{ id: string; storage_path: string; url: string; sort_order: number; caption: string | null; kind: string; created_at: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManageCrm(user.role)) return { ok: false, error: "Not authorized" };

    const parsed = addSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const expectedPrefix = `${parsed.data.propertyId}/`;
    if (!parsed.data.storagePath.startsWith(expectedPrefix)) {
      return { ok: false, error: "Storage path does not match this property" };
    }

    const supabase = await createSupabaseServerClient();
    const { data: maxRow } = await supabase
      .from("property_media")
      .select("sort_order")
      .eq("property_id", parsed.data.propertyId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sortOrder = parsed.data.sortOrder ?? (maxRow?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from("property_media")
      .insert({
        property_id: parsed.data.propertyId,
        storage_path: parsed.data.storagePath,
        kind: parsed.data.kind,
        caption: parsed.data.caption || null,
        sort_order: sortOrder,
        uploaded_by: user.id,
      })
      .select("id, storage_path, sort_order, caption, kind, created_at")
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? "Could not save photo" };

    revalidatePath(`/inventory/${parsed.data.propertyId}`);
    revalidatePath("/company-properties");
    return {
      ok: true,
      data: {
        ...data,
        url: propertyMediaPublicUrl(data.storage_path),
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deletePropertyMedia(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManageCrm(user.role)) return { ok: false, error: "Not authorized" };

    const supabase = await createSupabaseServerClient();
    const { data: row } = await supabase
      .from("property_media")
      .select("id, property_id, storage_path")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!row) return { ok: false, error: "Not found" };

    const { error } = await supabase
      .from("property_media")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };

    await supabase.storage.from("property-media").remove([row.storage_path]);

    revalidatePath(`/inventory/${row.property_id}`);
    revalidatePath("/company-properties");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
