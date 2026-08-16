"use server";

import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";
import { normalizeDocCategory, DOC_CATEGORIES } from "@/lib/document-storage";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const documentSchema = z.object({
  name: z.string().min(1, "Name required"),
  storage_path: z.string().min(1, "Storage path required"),
  mime_type: z.string().default("application/octet-stream"),
  size_bytes: z.number().default(0),
  category: z.enum(DOC_CATEGORIES).default("other"),
  entity_type: z.string().optional().nullable(),
  entity_id: z.string().min(1).optional().nullable(),
  expiry_date: z.string().optional().nullable(),
});

export async function createDocument(
  input: z.infer<typeof documentSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const parsed = documentSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = createSupabaseServiceClient();

    const { data, error } = await supabase
      .from("documents")
      .insert({
        name: parsed.data.name,
        storage_path: parsed.data.storage_path,
        mime_type: parsed.data.mime_type,
        size_bytes: parsed.data.size_bytes,
        category: normalizeDocCategory(parsed.data.category),
        entity_type: parsed.data.entity_type || null,
        entity_id: parsed.data.entity_id || null,
        expiry_date: parsed.data.expiry_date || null,
        uploaded_by: user.id,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "document",
      entityId: data.id,
      action: "created",
    });

    if (parsed.data.entity_type === "lead" && parsed.data.entity_id) {
      await supabase.from("lead_activities").insert({
        lead_id: parsed.data.entity_id,
        type: "document",
        summary: `Uploaded document: ${parsed.data.name}`,
        created_by: user.id,
      });
      revalidatePath(`/leads/${parsed.data.entity_id}`);
    }

    revalidatePath("/documents");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = createSupabaseServiceClient();

    const { error } = await supabase
      .from("documents")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "document",
      entityId: id,
      action: "deleted",
    });

    revalidatePath("/documents");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function getSignedUrl(
  storagePath: string
): Promise<ActionResult<{ url: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = createSupabaseServiceClient();

    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(storagePath, 300);

    if (error) return { ok: false, error: error.message };

    return { ok: true, data: { url: data.signedUrl } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
