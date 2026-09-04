"use server";

import { z } from "zod";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { getCurrentUser, type SessionUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";
import { documentPathBelongsTo, normalizeDocCategory } from "@/lib/document-storage";
import { canManageCrm } from "@/lib/permissions";

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
  if (entityType === "property") revalidatePath(`/inventory/${entityId}`);
}

async function assertCanWriteDocument(input: {
  user: SessionUser;
  entityType?: string | null;
  entityId?: string | null;
  storagePath?: string | null;
}): Promise<string | null> {
  const type = input.entityType || null;
  const id = input.entityId || null;

  if (input.storagePath && !documentPathBelongsTo(input.storagePath, type, id)) {
    return "Storage path does not match this record";
  }

  if (!type || !id) {
    if (!canManageCrm(input.user.role)) return "Link this file to a record you can access";
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const kind = type.toLowerCase();

  if (kind === "lead") {
    const { data } = await supabase.from("leads").select("id").eq("id", id).is("deleted_at", null).maybeSingle();
    return data ? null : "You cannot attach files to this lead";
  }
  if (kind === "deal") {
    const { data } = await supabase.from("deals").select("id").eq("id", id).is("deleted_at", null).maybeSingle();
    return data ? null : "You cannot attach files to this deal";
  }
  if (kind === "customer") {
    const { data: person } = await supabase
      .from("customers")
      .select("id")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (person) return null;
    // Person may be unreadable while a writable lead still owns the file (merged checklist).
    const { data: linkedLead } = await supabase
      .from("leads")
      .select("id")
      .is("deleted_at", null)
      .or(`customer_id.eq.${id},converted_customer_id.eq.${id}`)
      .limit(1)
      .maybeSingle();
    return linkedLead ? null : "You cannot attach files to this person";
  }
  if (kind === "staff" || kind === "profile") {
    if (id === input.user.id || canManageCrm(input.user.role)) return null;
    return "You cannot attach files to this staff record";
  }
  if (kind === "property") {
    if (!canManageCrm(input.user.role)) return "Not authorized";
    const { data } = await supabase.from("properties").select("id").eq("id", id).is("deleted_at", null).maybeSingle();
    return data ? null : "You cannot attach files to this property";
  }
  if (canManageCrm(input.user.role)) return null;
  return "You cannot attach files to this record";
}

async function loadVisibleDocument(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("documents")
    .select("id, entity_type, entity_id, storage_path")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

const documentSchema = z.object({
  name: z.string().min(1, "Name required"),
  storage_path: z.string().min(1, "Storage path required"),
  mime_type: z.string().default("application/octet-stream"),
  size_bytes: z.number().default(0),
  category: z.string().min(1, "Category required"),
  entity_type: z.string().optional().nullable(),
  entity_id: z.string().min(1).optional().nullable(),
  property_id: z.string().min(1).optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function createDocument(
  input: z.infer<typeof documentSchema>
): Promise<
  ActionResult<{
    id: string;
    name: string;
    storage_path: string;
    mime_type: string;
    category: string;
    expiry_date: string | null;
    notes: string | null;
    created_at: string;
    property_id: string | null;
  }>
> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const parsed = documentSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const denied = await assertCanWriteDocument({
      user,
      entityType: parsed.data.entity_type,
      entityId: parsed.data.entity_id,
      storagePath: parsed.data.storage_path,
    });
    if (denied) return { ok: false, error: denied };

    const supabase = await createSupabaseServerClient();

    const propertyId =
      parsed.data.property_id ||
      (parsed.data.entity_type === "property" ? parsed.data.entity_id : null) ||
      null;

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
        property_id: propertyId,
        expiry_date: parsed.data.expiry_date || null,
        notes: parsed.data.notes?.trim() || null,
        uploaded_by: user.id,
      })
      .select("id, name, storage_path, mime_type, category, expiry_date, notes, created_at, property_id")
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
    if (propertyId) revalidatePath(`/inventory/${propertyId}`);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const existing = await loadVisibleDocument(id);
    if (!existing) return { ok: false, error: "Not found" };

    const denied = await assertCanWriteDocument({
      user,
      entityType: existing.entity_type,
      entityId: existing.entity_id,
      storagePath: existing.storage_path,
    });
    if (denied) return { ok: false, error: denied };

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.rpc("crm_soft_delete_document", { p_id: id });

    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Document already deleted or not found" };

    await logActivity({
      actorId: user.id,
      entityType: "document",
      entityId: id,
      action: "deleted",
    });

    revalidateDocumentPaths(existing.entity_type, existing.entity_id);
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

    const existing = await loadVisibleDocument(id);
    if (!existing) return { ok: false, error: "Not found" };

    const name = input.name?.trim();
    const category = input.category ? normalizeDocCategory(input.category) : undefined;
    const hasExpiry = "expiry_date" in input;
    const hasNotes = "notes" in input;
    if (!name && !category && !hasExpiry && !hasNotes) return { ok: false, error: "Nothing to update" };

    const supabase = await createSupabaseServerClient();
    const patch: Record<string, unknown> = {};
    if (name) patch.name = name;
    if (category) patch.category = category;
    if (hasExpiry) patch.expiry_date = input.expiry_date || null;
    if (hasNotes) patch.notes = input.notes?.trim() || null;

    const { error } = await supabase.from("documents").update(patch).eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidateDocumentPaths(existing.entity_type, existing.entity_id);
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

    const supabase = await createSupabaseServerClient();
    const { data: doc } = await supabase
      .from("documents")
      .select("storage_path")
      .eq("storage_path", storagePath)
      .is("deleted_at", null)
      .maybeSingle();

    if (!doc) return { ok: false, error: "Not found" };

    const { data, error } = await supabase.storage.from("documents").createSignedUrl(storagePath, 300);
    if (!error && data?.signedUrl) {
      return { ok: true, data: { url: data.signedUrl } };
    }

    // Storage sign may require the service key; only after the user JWT could see the row.
    const service = createSupabaseServiceClient();
    const signed = await service.storage.from("documents").createSignedUrl(storagePath, 300);
    if (signed.error) return { ok: false, error: signed.error.message };
    return { ok: true, data: { url: signed.data.signedUrl } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
