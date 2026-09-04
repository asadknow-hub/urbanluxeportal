"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CrmDb } from "@/server/routing";
import { getCurrentUser, type SessionUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { aedToFils } from "@/lib/money";
import { revalidatePath } from "next/cache";
import { canManageCrm } from "@/lib/permissions";
import { updateDealTransaction } from "@/server/deals";
import type { DealPropertySnapshot } from "@/lib/deal-transaction";

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
  available_from: z.string().trim().optional().nullable(),
  rent_frequency: z.enum(["yearly", "monthly", "weekly"]).optional().nullable(),
  security_deposit_aed: z.number().optional().nullable(),
  cheques: z.number().int().min(0).optional().nullable(),
  service_charge_aed: z.number().optional().nullable(),
  payment_plan: z.string().trim().optional().nullable(),
  handover_date: z.string().trim().optional().nullable(),
  mortgage_available: z.boolean().optional().nullable(),
  owner_id: z.string().min(1).optional().nullable(),
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
  revalidatePath("/company-properties");
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
        owner_id: data.owner_id || null,
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
        available_from: data.available_from || null,
        rent_frequency: data.listing_type === "rent" ? data.rent_frequency || "yearly" : null,
        security_deposit: data.security_deposit_aed != null ? aedToFils(data.security_deposit_aed) : null,
        cheques: data.cheques ?? null,
        service_charge: data.service_charge_aed != null ? aedToFils(data.service_charge_aed) : null,
        payment_plan: data.listing_type === "off_plan" ? data.payment_plan || null : null,
        handover_date: data.listing_type === "off_plan" ? data.handover_date || null : null,
        mortgage_available: data.listing_type === "sale" ? Boolean(data.mortgage_available) : null,
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
        owner_id: data.owner_id || null,
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

const propertyDetailsPatchSchema = z.object({
  community: z.string().trim().optional().nullable(),
  building_name: z.string().trim().optional().nullable(),
  unit_number: z.string().trim().optional().nullable(),
  property_type: z.string().min(1).optional(),
  bedrooms: z.number().int().min(0).optional().nullable(),
  bathrooms: z.number().int().min(0).optional().nullable(),
  floor: z.string().trim().optional().nullable(),
  bua_sqft: z.number().optional().nullable(),
  title_deed_number: z.string().trim().optional().nullable(),
  oqood_number: z.string().trim().optional().nullable(),
  notes: z.string().optional().nullable(),
  assigned_to: z.string().min(1).optional().nullable(),
  developer_name: z.string().trim().optional().nullable(),
  project_name: z.string().trim().optional().nullable(),
  listing: z
    .object({
      asking_price_aed: z.number().optional().nullable(),
      trakheesi_permit_no: z.string().trim().optional().nullable(),
      furnishing: z.enum(["furnished", "semi", "unfurnished"]).optional().nullable(),
      available_from: z.string().trim().optional().nullable(),
      rent_frequency: z.enum(["yearly", "monthly", "weekly"]).optional().nullable(),
      security_deposit_aed: z.number().optional().nullable(),
      cheques: z.number().int().min(0).optional().nullable(),
      service_charge_aed: z.number().optional().nullable(),
      payment_plan: z.string().trim().optional().nullable(),
      handover_date: z.string().trim().optional().nullable(),
      mortgage_available: z.boolean().optional().nullable(),
    })
    .optional(),
});

/** Partial update for click-to-edit on the property detail page. */
export async function patchPropertyDetails(
  id: string,
  input: z.infer<typeof propertyDetailsPatchSchema>
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    const denied = assertCanWriteCatalog(user);
    if (denied) return { ok: false, error: denied };

    const parsed = propertyDetailsPatchSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const data = parsed.data;
    const supabase = await createSupabaseServerClient();
    const propertyUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if ("community" in data) propertyUpdate.community = data.community || null;
    if ("building_name" in data) propertyUpdate.building_name = data.building_name || null;
    if ("unit_number" in data) propertyUpdate.unit_number = data.unit_number || null;
    if ("property_type" in data && data.property_type) propertyUpdate.property_type = data.property_type;
    if ("bedrooms" in data) propertyUpdate.bedrooms = data.bedrooms ?? null;
    if ("bathrooms" in data) propertyUpdate.bathrooms = data.bathrooms ?? null;
    if ("floor" in data) propertyUpdate.floor = data.floor || null;
    if ("bua_sqft" in data) propertyUpdate.bua_sqft = data.bua_sqft ?? null;
    if ("title_deed_number" in data) propertyUpdate.title_deed_number = data.title_deed_number || null;
    if ("oqood_number" in data) propertyUpdate.oqood_number = data.oqood_number || null;
    if ("notes" in data) propertyUpdate.notes = data.notes || null;
    if ("assigned_to" in data) propertyUpdate.assigned_to = data.assigned_to || null;

    if ("developer_name" in data || "project_name" in data) {
      const developerId =
        "developer_name" in data
          ? await resolveDeveloper(supabase, data.developer_name, user.id)
          : undefined;
      if (developerId !== undefined) propertyUpdate.developer_id = developerId;
      if ("project_name" in data) {
        const { data: current } = await supabase
          .from("properties")
          .select("developer_id")
          .eq("id", id)
          .maybeSingle();
        const projectDeveloperId =
          developerId !== undefined ? developerId : current?.developer_id ?? null;
        propertyUpdate.project_id = await resolveProject(
          supabase,
          data.project_name,
          projectDeveloperId,
          null,
          user.id
        );
      }
    }

    if (Object.keys(propertyUpdate).length > 1) {
      const { error } = await supabase.from("properties").update(propertyUpdate).eq("id", id);
      if (error) return { ok: false, error: error.message };
    }

    if (data.listing) {
      const listing = data.listing;
      const listingUpdate: Record<string, unknown> = {};
      if ("asking_price_aed" in listing) {
        listingUpdate.asking_price =
          listing.asking_price_aed != null ? aedToFils(listing.asking_price_aed) : 0;
      }
      if ("trakheesi_permit_no" in listing) {
        listingUpdate.trakheesi_permit_no = listing.trakheesi_permit_no || null;
      }
      if ("furnishing" in listing) listingUpdate.furnishing = listing.furnishing || null;
      if ("available_from" in listing) listingUpdate.available_from = listing.available_from || null;
      if ("rent_frequency" in listing) listingUpdate.rent_frequency = listing.rent_frequency || null;
      if ("security_deposit_aed" in listing) {
        listingUpdate.security_deposit =
          listing.security_deposit_aed != null ? aedToFils(listing.security_deposit_aed) : null;
      }
      if ("cheques" in listing) listingUpdate.cheques = listing.cheques ?? null;
      if ("service_charge_aed" in listing) {
        listingUpdate.service_charge =
          listing.service_charge_aed != null ? aedToFils(listing.service_charge_aed) : null;
      }
      if ("payment_plan" in listing) listingUpdate.payment_plan = listing.payment_plan || null;
      if ("handover_date" in listing) listingUpdate.handover_date = listing.handover_date || null;
      if ("mortgage_available" in listing) {
        listingUpdate.mortgage_available = listing.mortgage_available ?? null;
      }

      if (Object.keys(listingUpdate).length > 0) {
        const { data: existing } = await supabase
          .from("listings")
          .select("id")
          .eq("property_id", id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (!existing) return { ok: false, error: "No listing on this property yet" };
        const { error } = await supabase.from("listings").update(listingUpdate).eq("id", existing.id);
        if (error) return { ok: false, error: error.message };
      }
    }

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

export async function applyInventoryPropertyToDeal(
  dealId: string,
  propertyId: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    const denied = await assertCanMutateDeal(dealId, user);
    if (denied) return { ok: false, error: denied };

    const supabase = await createSupabaseServerClient();
    const { data: property, error } = await supabase
      .from("properties")
      .select(
        "property_code, community, building_name, unit_number, property_type, bedrooms, bua_sqft, title_deed_number, oqood_number, dld_property_number, notes"
      )
      .eq("id", propertyId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !property) return { ok: false, error: "Property not found" };

    const title =
      [property.building_name, property.unit_number].filter(Boolean).join(" ") ||
      property.property_code ||
      "Property";

    const snapshot: DealPropertySnapshot = {
      bedrooms: property.bedrooms != null ? String(property.bedrooms) : null,
      size_sqft: property.bua_sqft,
      notes: property.notes,
    };

    const result = await updateDealTransaction(dealId, {
      property_title: title,
      property_community: property.community,
      property_building: property.building_name,
      property_unit: property.unit_number,
      property_type: property.property_type,
      property_ref:
        property.title_deed_number || property.oqood_number || property.dld_property_number || property.property_code,
      property_snapshot: snapshot,
    });

    if (!result.ok) return result;

    await supabase
      .from("deals")
      .update({ property_id: propertyId, updated_at: new Date().toISOString() })
      .eq("id", dealId);

    // Demote any prior confirmed row, then upsert this unit as confirmed.
    await supabase
      .from("deal_properties")
      .update({ role: "shortlisted" })
      .eq("deal_id", dealId)
      .eq("role", "confirmed")
      .neq("property_id", propertyId);

    await supabase.from("deal_properties").upsert(
      {
        deal_id: dealId,
        property_id: propertyId,
        role: "confirmed",
        created_by: user.id,
      },
      { onConflict: "deal_id,property_id" }
    );

    await supabase.from("deal_activities").insert({
      deal_id: dealId,
      type: "note",
      summary: `Property set from inventory ${property.property_code ?? propertyId}`,
      created_by: user.id,
    });

    revalidatePath(`/pipeline/${dealId}`);
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

async function assertCanMutateLead(leadId: string, user: SessionUser): Promise<string | null> {
  if (user.role === "accountant") return "Not authorized";
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("leads").select("id").eq("id", leadId).is("deleted_at", null).maybeSingle();
  if (!data) return "Lead not found";
  return null;
}

export async function addLeadProperty(input: {
  leadId: string;
  propertyId: string;
  listingId?: string | null;
  role?: string;
  notes?: string | null;
  dealId?: string | null;
}): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    const denied = await assertCanMutateLead(input.leadId, user);
    if (denied) return { ok: false, error: denied };

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("lead_properties").upsert(
      {
        lead_id: input.leadId,
        property_id: input.propertyId,
        listing_id: input.listingId || null,
        role: input.role || "proposed",
        notes: input.notes || null,
        created_by: user.id,
      },
      { onConflict: "lead_id,property_id" }
    );
    if (error) return { ok: false, error: error.message };

    const { data: property } = await supabase
      .from("properties")
      .select("property_code, community, building_name, unit_number")
      .eq("id", input.propertyId)
      .maybeSingle();

    await supabase.from("lead_activities").insert({
      lead_id: input.leadId,
      type: "note",
      summary: `Proposed property ${property?.property_code ?? ""}${
        property?.community ? ` · ${property.community}` : ""
      }${property?.unit_number ? ` ${property.unit_number}` : ""}`.trim(),
      created_by: user.id,
    });

    if (input.dealId) {
      await supabase.from("deal_properties").upsert(
        {
          deal_id: input.dealId,
          property_id: input.propertyId,
          listing_id: input.listingId || null,
          role: "suggested",
          created_by: user.id,
        },
        { onConflict: "deal_id,property_id" }
      );
      revalidatePath(`/pipeline/${input.dealId}`);
    }

    revalidatePath(`/leads/${input.leadId}`);
    revalidatePath("/leads");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function removeLeadProperty(leadId: string, propertyId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    const denied = await assertCanMutateLead(leadId, user);
    if (denied) return { ok: false, error: denied };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("lead_properties")
      .delete()
      .eq("lead_id", leadId)
      .eq("property_id", propertyId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/leads/${leadId}`);
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

export async function assignPropertyOwner(
  propertyId: string,
  ownerId: string | null
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    const denied = assertCanWriteCatalog(user);
    if (denied) return { ok: false, error: denied };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("properties")
      .update({ owner_id: ownerId, updated_at: new Date().toISOString() })
      .eq("id", propertyId);
    if (error) return { ok: false, error: error.message };
    revalidateInventory(propertyId);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
