import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { getStatusColor } from "@/lib/status-colors";
import { PropertyGallery } from "@/components/properties/property-gallery";
import Link from "next/link";
import {
  Building2,
  Bed,
  Bath,
  Maximize,
  Car,
  MapPin,
  User,
  FileText,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const { id } = await params;

  const { data: property, error } = await supabase
    .from("properties")
    .select(
      `*,
      owner:property_owners(id, name, phone, email),
      assigned_to_profile:profiles!properties_assigned_to_fkey(id, full_name)
      `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !property) notFound();

  // Fetch media
  const { data: media } = await supabase
    .from("property_media")
    .select("*")
    .eq("property_id", id)
    .order("sort_order", { ascending: true });

  // Generate signed URLs for media
  const mediaWithUrls = await Promise.all(
    (media ?? []).map(async (m) => {
      const { data: urlData } = await supabase.storage
        .from("property-media")
        .createSignedUrl(m.storage_path, 3600);
      return { ...m, url: urlData?.signedUrl ?? null };
    })
  );

  // Fetch linked deals
  const { data: deals } = await supabase
    .from("deals")
    .select("id, title, stage, value, customer:customers(id, name)")
    .eq("property_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const colors = getStatusColor(property.status);
  const missingPermit = !property.trakheesi_permit_no && property.status === "available";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{property.title}</h1>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}>
              {property.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {property.ref_no} · {property.purpose === "sale" ? "For Sale" : "For Rent"} · {property.category}
          </p>
        </div>
        <Link href="/properties" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to Properties
        </Link>
      </div>

      {/* Missing permit warning */}
      {missingPermit && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            Trakheesi permit is missing. Add it before listing this property.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Gallery + Specs */}
        <div className="space-y-6 lg:col-span-2">
          {/* Gallery */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Gallery</h2>
            <PropertyGallery
              propertyId={property.id}
              media={mediaWithUrls}
              canEdit={["admin", "manager", "agent"].includes(user.role)}
            />
          </div>

          {/* Specs */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Specifications</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {property.bedrooms !== null && (
                <div className="flex items-center gap-2">
                  <Bed className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Bedrooms</p>
                    <p className="font-medium text-slate-700">{property.bedrooms}</p>
                  </div>
                </div>
              )}
              {property.bathrooms !== null && (
                <div className="flex items-center gap-2">
                  <Bath className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Bathrooms</p>
                    <p className="font-medium text-slate-700">{property.bathrooms}</p>
                  </div>
                </div>
              )}
              {property.size_sqft !== null && (
                <div className="flex items-center gap-2">
                  <Maximize className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Size</p>
                    <p className="font-medium text-slate-700">{property.size_sqft.toLocaleString()} sqft</p>
                  </div>
                </div>
              )}
              {property.parking !== null && (
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Parking</p>
                    <p className="font-medium text-slate-700">{property.parking}</p>
                  </div>
                </div>
              )}
            </div>

            {property.description && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-600">{property.description}</p>
              </div>
            )}

            {property.amenities && property.amenities.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="mb-2 text-xs text-slate-400">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a: string) => (
                    <span key={a} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Linked deals */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">
              Linked Deals ({deals?.length ?? 0})
            </h2>
            <div className="space-y-2">
              {(deals ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">No deals linked to this property.</p>
              ) : (
                (deals ?? []).map((deal) => {
                  const dealColors = getStatusColor(deal.stage);
                  return (
                    <Link
                      key={deal.id}
                      href="/pipeline"
                      className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{deal.title}</p>
                        <p className="text-xs text-slate-400">{(deal.customer as { name?: string } | { name?: string }[]) && (deal.customer as { name?: string })?.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-700">{formatAED(deal.value)}</span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${dealColors.bg} ${dealColors.text}`}>
                          {deal.stage}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Price, Owner, Permits */}
        <div className="space-y-6">
          {/* Price */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <p className="text-xs text-slate-400">{property.purpose === "sale" ? "Sale Price" : "Annual Rent"}</p>
            <p className="text-3xl font-bold text-slate-900">{formatAED(property.price)}</p>
            {property.service_charge && (
              <p className="mt-2 text-sm text-slate-500">
                Service charge: {formatAED(property.service_charge)}/yr
              </p>
            )}
          </div>

          {/* Location */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Location</h2>
            <div className="space-y-2 text-sm">
              {property.community && (
                <p className="flex items-center gap-2 text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {property.community}
                </p>
              )}
              {property.building && (
                <p className="text-slate-600 pl-6">{property.building}</p>
              )}
              {property.unit_no && (
                <p className="text-slate-600 pl-6">Unit {property.unit_no}</p>
              )}
              <p className="text-slate-600 pl-6">{property.city}</p>
            </div>
          </div>

          {/* Owner */}
          {property.owner && (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Owner</h2>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-slate-900">{property.owner.name}</p>
                {property.owner.phone && (
                  <p className="text-slate-600">{property.owner.phone}</p>
                )}
                {property.owner.email && (
                  <p className="text-slate-600">{property.owner.email}</p>
                )}
              </div>
            </div>
          )}

          {/* Permits */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Permits</h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-slate-400">Trakheesi Permit</p>
                <p className={`font-medium ${property.trakheesi_permit_no ? "text-slate-700" : "text-amber-600"}`}>
                  {property.trakheesi_permit_no ?? "Missing"}
                </p>
              </div>
              {property.dtcm_permit_no && (
                <div>
                  <p className="text-xs text-slate-400">DTCM Permit</p>
                  <p className="font-medium text-slate-700">{property.dtcm_permit_no}</p>
                </div>
              )}
              {property.furnishing && (
                <div>
                  <p className="text-xs text-slate-400">Furnishing</p>
                  <p className="font-medium text-slate-700 capitalize">{property.furnishing.replace(/_/g, " ")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned agent */}
          {property.assigned_to_profile && (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Assigned Agent</h2>
              <p className="text-sm font-medium text-slate-900">{property.assigned_to_profile.full_name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
