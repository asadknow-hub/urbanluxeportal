"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const propertySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  purpose: z.enum(["sale", "rent"]),
  category: z.enum([
    "apartment",
    "villa",
    "townhouse",
    "office",
    "retail",
    "warehouse",
    "land",
    "off_plan",
  ]),
  status: z.enum(["available", "reserved", "sold", "rented", "off_market"]).optional(),
  community: z.string().optional().nullable(),
  building: z.string().optional().nullable(),
  unit_no: z.string().optional().nullable(),
  city: z.string().default("Dubai"),
  bedrooms: z.number().optional().nullable(),
  bathrooms: z.number().optional().nullable(),
  size_sqft: z.number().optional().nullable(),
  parking: z.number().optional().nullable(),
  price: z.number(),
  service_charge: z.number().optional().nullable(),
  owner_id: z.string().uuid().optional().nullable(),
  trakheesi_permit_no: z.string().optional().nullable(),
  dtcm_permit_no: z.string().optional().nullable(),
  furnishing: z.string().optional().nullable(),
  amenities: z.array(z.string()).optional().default([]),
  assigned_to: z.string().uuid().optional().nullable(),
  featured: z.boolean().optional().default(false),
});

export async function createProperty(
  input: z.infer<typeof propertySchema>
): Promise<ActionResult<{ id: string; ref_no: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const parsed = propertySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("properties")
      .insert({
        title: parsed.data.title,
        description: parsed.data.description || null,
        purpose: parsed.data.purpose,
        category: parsed.data.category,
        status: parsed.data.status ?? "available",
        community: parsed.data.community || null,
        building: parsed.data.building || null,
        unit_no: parsed.data.unit_no || null,
        city: parsed.data.city,
        bedrooms: parsed.data.bedrooms ?? null,
        bathrooms: parsed.data.bathrooms ?? null,
        size_sqft: parsed.data.size_sqft ?? null,
        parking: parsed.data.parking ?? null,
        price: Math.round(parsed.data.price * 100),
        service_charge: parsed.data.service_charge ? Math.round(parsed.data.service_charge * 100) : null,
        owner_id: parsed.data.owner_id || null,
        trakheesi_permit_no: parsed.data.trakheesi_permit_no || null,
        dtcm_permit_no: parsed.data.dtcm_permit_no || null,
        furnishing: parsed.data.furnishing || null,
        amenities: parsed.data.amenities,
        assigned_to: parsed.data.assigned_to || null,
        featured: parsed.data.featured,
        created_by: user.id,
      })
      .select("id, ref_no")
      .single();

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "property",
      entityId: data.id,
      action: "created",
    });

    revalidatePath("/properties");
    return { ok: true, data: { id: data.id, ref_no: data.ref_no } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateProperty(
  id: string,
  input: Partial<z.infer<typeof propertySchema>>
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();

    const updateData: Record<string, unknown> = { ...input, updated_at: new Date().toISOString() };
    if (input.price !== undefined) updateData.price = Math.round(input.price * 100);
    if (input.service_charge !== undefined && input.service_charge !== null) {
      updateData.service_charge = Math.round(input.service_charge * 100);
    }

    const { error } = await supabase
      .from("properties")
      .update(updateData)
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "property",
      entityId: id,
      action: "updated",
      diff: input as Record<string, unknown>,
    });

    revalidatePath("/properties");
    revalidatePath(`/properties/${id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deletePropertyMedia(
  mediaId: string,
  storagePath: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("property-media")
      .remove([storagePath]);

    if (storageError) console.error("[property-media] storage delete error:", storageError.message);

    // Delete from DB
    const { error: dbError } = await supabase
      .from("property_media")
      .delete()
      .eq("id", mediaId);

    if (dbError) return { ok: false, error: dbError.message };

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

const ownerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")),
  emirates_id: z.string().optional().nullable(),
  passport_no: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function createOwner(
  input: z.infer<typeof ownerSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const parsed = ownerSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("property_owners")
      .insert({
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        emirates_id: parsed.data.emirates_id || null,
        passport_no: parsed.data.passport_no || null,
        notes: parsed.data.notes || null,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/properties/owners");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
