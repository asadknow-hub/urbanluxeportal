"use server";

import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";
import { normalizeDocCategory } from "@/lib/document-storage";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

function revalidateDocumentPaths(entityType?: string | null, entityId?: string | null) {
  revalidatePath("/documents");
  if (!entityType || !entityId) return;
  if (entityType === "lead") revalidatePath(`/leads/${entityId}`);
  if (entityType === "deal") revalidatePath(`/pipeline/${entityId}`);
  if (entityType === "staff") revalidatePath(`/team/${entityId}`);
  if (entityType === "customer") revalidatePath(`/customers/${entityId}`);
}

const documentSchema = z.object({
  name: z.string().min(1, "Name required"),
  storage_path: z.string().min(1, "Storage path required"),
  mime_type: z.string().default("application/octet-stream"),
  size_bytes: z.number().default(0),
  category: z.string().min(1, "Category required"),
  entity_type: z.string().optional().nullable(),
  entity_id: z.string().min(1).optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function createDocument(
  input: z.infer<typeof documentSchema>
): Promise<ActionResult<{ id: string; name: string; storage_path: string; mime_type: string; category: string; expiry_date: string | null; notes: string | null; created_at: string }>> {
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
        notes: parsed.data.notes?.trim() || null,
        uploaded_by: user.id,
      })
      .select("id, name, storage_path, mime_type, category, expiry_date, notes, created_at")
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
    }

    revalidateDocumentPaths(parsed.data.entity_type, parsed.data.entity_id);
    return { ok: true, data: data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = createSupabaseServiceClient();

    const { data: row, error } = await supabase
      .from("documents")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select("entity_type, entity_id")
      .single();

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "document",
      entityId: id,
      action: "deleted",
    });

    revalidateDocumentPaths(row?.entity_type, row?.entity_id);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateDocument(
  id: string,
  input: { name?: string; category?: string; expiry_date?: string | null; notes?: string | null }
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const name = input.name?.trim();
    const category = input.category ? normalizeDocCategory(input.category) : undefined;
    const hasExpiry = "expiry_date" in input;
    const hasNotes = "notes" in input;
    if (!name && !category && !hasExpiry && !hasNotes) return { ok: false, error: "Nothing to update" };

    const supabase = createSupabaseServiceClient();
    const patch: Record<string, unknown> = {};
    if (name) patch.name = name;
    if (category) patch.category = category;
    if (hasExpiry) patch.expiry_date = input.expiry_date || null;
    if (hasNotes) patch.notes = input.notes?.trim() || null;

    const { data, error } = await supabase
      .from("documents")
      .update(patch)
      .eq("id", id)
      .select("entity_type, entity_id")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidateDocumentPaths(data?.entity_type, data?.entity_id);
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
