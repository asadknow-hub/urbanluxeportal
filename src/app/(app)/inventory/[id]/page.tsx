import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageCrm } from "@/lib/permissions";
import { PropertyDetailView } from "@/components/inventory/property-detail-view";
import { groupLeadFieldOptions, leadDocChecklistCategories, type LeadFieldOption } from "@/lib/lead-field-options";
import type { LeadDocument } from "@/components/leads/lead-documents";

export const dynamic = "force-dynamic";

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const { id } = await params;

  const [{ data: property, error }, { data: fieldOptionRows }, { data: owners }, { data: agents }] = await Promise.all([
    supabase
      .from("properties")
      .select(
        `*,
        developer:developers(id, name),
        project:projects(id, name, community),
        assigned_to_profile:profiles!properties_assigned_to_fkey(id, full_name),
        listings(*)`
      )
      .eq("id", id)
      .is("deleted_at", null)
      .single(),
    supabase.from("lead_field_options").select("id, field_key, value, label, sort, extra").eq("field_key", "doc_category").order("sort"),
    supabase.from("customers").select("id, name").is("deleted_at", null).order("name").limit(200),
    supabase
      .from("profiles")
      .select("id, full_name")
      .in("role", ["admin", "manager", "reception", "agent"])
      .eq("is_active", true)
      .order("full_name"),
  ]);

  if (error || !property) notFound();

  const listings = Array.isArray(property.listings) ? property.listings : [];
  const listing = listings[0] ?? null;
  const developer = Array.isArray(property.developer) ? property.developer[0] : property.developer;
  const project = Array.isArray(property.project) ? property.project[0] : property.project;
  const agent = Array.isArray(property.assigned_to_profile)
    ? property.assigned_to_profile[0]
    : property.assigned_to_profile;

  const { data: ownerRow } = property.owner_id
    ? await supabase
        .from("customers")
        .select("id, name, phone, email, nationality, status")
        .eq("id", property.owner_id)
        .maybeSingle()
    : { data: null };

  const owner = ownerRow;

  const { data: directDocs } = await supabase
    .from("documents")
    .select("id, name, storage_path, mime_type, category, expiry_date, notes, created_at, property_id, entity_type")
    .is("deleted_at", null)
    .or(`and(entity_type.eq.property,entity_id.eq.${id}),property_id.eq.${id}`)
    .order("created_at", { ascending: false });

  const documents: LeadDocument[] = (directDocs ?? []).map((doc) => ({
    id: doc.id,
    name: doc.name,
    storage_path: doc.storage_path,
    mime_type: doc.mime_type,
    category: doc.category || "other",
    expiry_date: doc.expiry_date,
    notes: doc.notes,
    created_at: doc.created_at,
    property_id: doc.property_id,
  }));

  const grouped = groupLeadFieldOptions((fieldOptionRows ?? []) as LeadFieldOption[]);
  const categories = leadDocChecklistCategories(grouped.doc_category);

  return (
    <PropertyDetailView
      property={{
        id: property.id,
        property_code: property.property_code,
        community: property.community,
        building_name: property.building_name,
        unit_number: property.unit_number,
        property_type: property.property_type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        floor: property.floor,
        bua_sqft: property.bua_sqft,
        status: property.status,
        title_deed_number: property.title_deed_number,
        oqood_number: property.oqood_number,
        notes: property.notes,
        owner_id: property.owner_id,
      }}
      listing={listing}
      developer={developer}
      project={project}
      agent={agent}
      agents={agents ?? []}
      owner={owner}
      owners={owners ?? []}
      documents={documents}
      categories={categories}
      canEdit={canManageCrm(user.role)}
    />
  );
}
