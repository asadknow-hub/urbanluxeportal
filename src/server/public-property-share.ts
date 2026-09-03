import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { propertyMediaPublicUrl } from "@/lib/property-media";
import { propertyLabel } from "@/lib/inventory";

export type PublicSharedProperty = {
  property_code: string;
  label: string;
  community: string | null;
  building_name: string | null;
  unit_number: string | null;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: string | null;
  bua_sqft: number | null;
  status: string;
  listing_type: string | null;
  asking_price: number | null;
  furnishing: string | null;
  rent_frequency: string | null;
  payment_plan: string | null;
  handover_date: string | null;
  photos: { url: string; caption: string | null }[];
};

/** Public brochure payload for a share token — service role, no CRM fields. */
export async function getPublicSharedProperty(
  token: string
): Promise<PublicSharedProperty | null> {
  const trimmed = token.trim();
  if (!/^[0-9a-f-]{36}$/i.test(trimmed)) return null;

  const supabase = createSupabaseServiceClient();
  const { data: property } = await supabase
    .from("properties")
    .select(
      `id, property_code, community, building_name, unit_number, property_type,
       bedrooms, bathrooms, floor, bua_sqft, status,
       listings(listing_type, asking_price, furnishing, rent_frequency, payment_plan, handover_date, listing_status)`
    )
    .eq("share_token", trimmed)
    .is("deleted_at", null)
    .maybeSingle();

  if (!property) return null;

  const listings = Array.isArray(property.listings) ? property.listings : [];
  const listing = listings[0] ?? null;

  const { data: media } = await supabase
    .from("property_media")
    .select("storage_path, caption, sort_order")
    .eq("property_id", property.id)
    .is("deleted_at", null)
    .eq("kind", "photo")
    .order("sort_order")
    .limit(24);

  return {
    property_code: property.property_code,
    label: propertyLabel(property),
    community: property.community,
    building_name: property.building_name,
    unit_number: property.unit_number,
    property_type: property.property_type,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    floor: property.floor,
    bua_sqft: property.bua_sqft,
    status: property.status,
    listing_type: listing?.listing_type ?? null,
    asking_price: listing?.asking_price ?? null,
    furnishing: listing?.furnishing ?? null,
    rent_frequency: listing?.rent_frequency ?? null,
    payment_plan: listing?.payment_plan ?? null,
    handover_date: listing?.handover_date ?? null,
    photos: (media ?? []).map((row) => ({
      url: propertyMediaPublicUrl(row.storage_path),
      caption: row.caption,
    })),
  };
}
