"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CrmDb } from "@/server/routing";
import { getCurrentUser, type SessionUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { aedToFils } from "@/lib/money";
import { revalidatePath } from "next/cache";
import { canManageCrm } from "@/lib/permissions";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const propertySchema = z.object({
  community: z.string().trim().optional().nullable(),
  building_name: z.string().trim().optional().nullable(),
  unit_number: z.string().trim().optional().nullable(),
  property_type: z.string().min(1).default("apartment"),
  bedrooms: z.number().int().min(0).optional().nullable(),
  bathrooms: z.number().int().min(0).optional().nullable(),
  maid_room: z.boolean().optional(),
  floor: z.string().trim().optional().nullable(),
  view: z.string().trim().optional().nullable(),
  bua_sqft: z.number().optional().nullable(),
  plot_sqft: z.number().optional().nullable(),
  parking: z.number().int().min(0).optional().nullable(),
  status: z.string().min(1).default("available"),
  title_deed_number: z.string().trim().optional().nullable(),
  oqood_number: z.string().trim().optional().nullable(),
  dld_property_number: z.string().trim().optional().nullable(),
  assigned_to: z.string().min(1).optional().nullable(),
  notes: z.string().optional().nullable(),
  developer_name: z.string().trim().optional().nullable(),
  project_name: z.string().trim().optional().nullable(),
  project_type: z.enum(["off_plan", "ready"]).optional().nullable(),
  listing_type: z.enum(["sale", "rent", "off_plan"]).optional().nullable(),
  asking_price_aed: z.number().optional().nullable(),
  trakheesi_permit_no: z.string().trim().optional().nullable(),
  furnishing: z.enum(["furnished", "semi", "unfurnished"]).optional().nullable(),
});

async function resolveDeveloper(
  supabase: CrmDb,
  name: string | null | undefined,
  createdBy: string
) {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const { data: existing } = await supabase
    .from("developers")
    .select("id")
    .ilike("name", trimmed)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;
  const { data } = await supabase
    .from("developers")
    .insert({ name: trimmed, created_by: createdBy })
    .select("id")
    .single();
  return data?.id ?? null;
}

async function resolveProject(
  supabase: CrmDb,
  name: string | null | undefined,
  developerId: string | null,
  projectType: "off_plan" | "ready" | null | undefined,
  createdBy: string
) {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  let query = supabase.from("projects").select("id").ilike("name", trimmed).is("deleted_at", null).limit(1);
  if (developerId) query = query.eq("developer_id", developerId);
  const { data: existing } = await query.maybeSingle();
  if (existing) return existing.id;
  const { data } = await supabase
    .from("projects")
    .insert({
      name: trimmed,
      developer_id: developerId,
      project_type: projectType ?? "ready",
      created_by: createdBy,
    })
    .select("id")
    .single();
  return data?.id ?? null;
}

function revalidateInventory(id?: string) {
  revalidatePath("/inventory");
  if (id) revalidatePath(`/inventory/${id}`);
  revalidatePath("/pipeline");
  revalidatePath("/leads");
}

function assertCanWriteCatalog(user: SessionUser): string | null {
  if (!canManageCrm(user.role)) return "Not authorized";
  return null;
}

async function assertCanMutateDeal(dealId: string, user: SessionUser): Promise<string | null> {
  if (user.role === "accountant") return "Not authorized";
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("deals").select("id").eq("id", dealId).is("deleted_at", null).maybeSingle();
  if (!data) return "Deal not found";
  return null;
}

export async function createProperty(
  input: z.infer<typeof propertySchema>
): Promise<ActionResult<{ id: string; property_code: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    const denied = assertCanWriteCatalog(user);
    if (denied) return { ok: false, error: denied };

    const parsed = propertySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const data = parsed.data;
    if (!data.community?.trim() && !data.building_name?.trim() && !data.unit_number?.trim()) {
      return { ok: false, error: "Add a community, building, or unit" };
    }

    const supabase = await createSupabaseServerClient();
    const developerId = await resolveDeveloper(supabase, data.developer_name, user.id);
    const projectId = await resolveProject(
      supabase,
      data.project_name,
      developerId,
      data.project_type ?? null,
      user.id
    );

    const { data: property, error } = await supabase
      .from("properties")
      .insert({
        community: data.community || null,
        building_name: data.building_name || null,
        unit_number: data.unit_number || null,
        property_type: data.property_type,
        bedrooms: data.bedrooms ?? null,
        bathrooms: data.bathrooms ?? null,
        maid_room: data.maid_room ?? false,
        floor: data.floor || null,
        view: data.view || null,
        bua_sqft: data.bua_sqft ?? null,
        plot_sqft: data.plot_sqft ?? null,
        parking: data.parking ?? null,
        status: data.status,
        title_deed_number: data.title_deed_number || null,
        oqood_number: data.oqood_number || null,
        dld_property_number: data.dld_property_number || null,
        assigned_to: data.assigned_to || user.id,
        notes: data.notes || null,
        developer_id: developerId,
        project_id: projectId,
        created_by: user.id,
      })
      .select("id, property_code")
      .single();

    if (error || !property) return { ok: false, error: error?.message ?? "Could not create property" };

    if (data.listing_type) {
      await supabase.from("listings").insert({
        property_id: property.id,
        listing_type: data.listing_type,
        asking_price: data.asking_price_aed != null ? aedToFils(data.asking_price_aed) : 0,
        listing_status: "available",
        assigned_agent_id: data.assigned_to || user.id,
        trakheesi_permit_no: data.trakheesi_permit_no || null,
        furnishing: data.furnishing || null,
        created_by: user.id,
      });
    }

    await logActivity({
      actorId: user.id,
      entityType: "property",
      entityId: property.id,
      action: "created",
    });

    revalidateInventory(property.id);
    return { ok: true, data: { id: property.id, property_code: property.property_code } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateProperty(
  id: string,
  input: z.infer<typeof propertySchema>
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    const denied = assertCanWriteCatalog(user);
    if (denied) return { ok: false, error: denied };
    const parsed = propertySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const data = parsed.data;
    const supabase = await createSupabaseServerClient();
    const developerId = await resolveDeveloper(supabase, data.developer_name, user.id);
    const projectId = await resolveProject(
      supabase,
      data.project_name,
      developerId,
      data.project_type ?? null,
      user.id
    );

    const { error } = await supabase
      .from("properties")
      .update({
        community: data.community || null,
        building_name: data.building_name || null,
        unit_number: data.unit_number || null,
        property_type: data.property_type,
        bedrooms: data.bedrooms ?? null,
        bathrooms: data.bathrooms ?? null,
        maid_room: data.maid_room ?? false,
        floor: data.floor || null,
        view: data.view || null,
        bua_sqft: data.bua_sqft ?? null,
        plot_sqft: data.plot_sqft ?? null,
        parking: data.parking ?? null,
        status: data.status,
        title_deed_number: data.title_deed_number || null,
        oqood_number: data.oqood_number || null,
        dld_property_number: data.dld_property_number || null,
        assigned_to: data.assigned_to || null,
        notes: data.notes || null,
        developer_id: developerId,
        project_id: projectId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    revalidateInventory(id);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function addDealProperty(input: {
  dealId: string;
  propertyId: string;
  listingId?: string | null;
  role?: string;
  notes?: string | null;
}): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    const denied = await assertCanMutateDeal(input.dealId, user);
    if (denied) return { ok: false, error: denied };

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("deal_properties").upsert(
      {
        deal_id: input.dealId,
        property_id: input.propertyId,
        listing_id: input.listingId || null,
        role: input.role || "shortlisted",
        notes: input.notes || null,
        created_by: user.id,
      },
      { onConflict: "deal_id,property_id" }
    );
    if (error) return { ok: false, error: error.message };

    const { data: property } = await supabase
      .from("properties")
      .select("property_code, community, building_name, unit_number")
      .eq("id", input.propertyId)
      .maybeSingle();

    await supabase.from("deal_activities").insert({
      deal_id: input.dealId,
      type: "note",
      summary: `Shortlisted ${property?.property_code ?? "property"}${
        property?.community ? ` · ${property.community}` : ""
      }${property?.unit_number ? ` ${property.unit_number}` : ""}`,
      created_by: user.id,
    });

    revalidatePath(`/pipeline/${input.dealId}`);
    revalidatePath("/pipeline");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function removeDealProperty(dealId: string, propertyId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    const denied = await assertCanMutateDeal(dealId, user);
    if (denied) return { ok: false, error: denied };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("deal_properties")
      .delete()
      .eq("deal_id", dealId)
      .eq("property_id", propertyId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/pipeline/${dealId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function searchInventory(query: string): Promise<
  ActionResult<
    {
      id: string;
      property_code: string;
      community: string | null;
      building_name: string | null;
      unit_number: string | null;
      property_type: string;
      bedrooms: number | null;
      status: string;
    }[]
  >
> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    const supabase = await createSupabaseServerClient();
    const q = query.trim();
    let request = supabase
      .from("properties")
      .select("id, property_code, community, building_name, unit_number, property_type, bedrooms, status")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20);
    if (q) {
      request = request.or(
        `property_code.ilike.%${q}%,community.ilike.%${q}%,building_name.ilike.%${q}%,unit_number.ilike.%${q}%`
      );
    }
    const { data, error } = await request;
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data ?? [] };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
