import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/primitives/page-header";
import { formatPropertyType, propertyLabel } from "@/lib/inventory";
import { formatAED } from "@/lib/money";
import { ArrowLeft } from "lucide-react";

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

  const { data: property, error } = await supabase
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
    .single();

  if (error || !property) notFound();

  const listings = Array.isArray(property.listings) ? property.listings : [];
  const developer = Array.isArray(property.developer) ? property.developer[0] : property.developer;
  const project = Array.isArray(property.project) ? property.project[0] : property.project;
  const agent = Array.isArray(property.assigned_to_profile)
    ? property.assigned_to_profile[0]
    : property.assigned_to_profile;

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-4">
      <Link href="/inventory" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Inventory
      </Link>
      <PageHeader
        title={property.property_code}
        description={propertyLabel(property)}
      />
      <div className="overflow-hidden rounded-[14px] border border-border bg-card p-5">
        <div className="-mx-5 -mt-5 mb-4 h-0.5 bg-primary" />
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</dt>
            <dd>{formatPropertyType(property.property_type)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</dt>
            <dd className="capitalize">{property.status.replace(/_/g, " ")}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Beds / baths</dt>
            <dd>
              {property.bedrooms ?? "—"} / {property.bathrooms ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">BUA</dt>
            <dd>{property.bua_sqft ? `${property.bua_sqft} sqft` : "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Developer</dt>
            <dd>{developer?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Project</dt>
            <dd>{project?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Agent</dt>
            <dd>{agent?.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title / Oqood</dt>
            <dd>
              {property.title_deed_number || property.oqood_number || "—"}
            </dd>
          </div>
        </dl>
        {property.notes ? <p className="mt-4 text-sm text-muted-foreground">{property.notes}</p> : null}
      </div>
      <div className="overflow-hidden rounded-[14px] border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">Listings</h2>
        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No listing on this unit yet.</p>
        ) : (
          <div className="space-y-2">
            {listings.map((listing: { id: string; listing_type: string; asking_price: number; listing_status: string; trakheesi_permit_no: string | null }) => (
              <div key={listing.id} className="flex justify-between rounded-[10px] border border-border px-3 py-2 text-sm">
                <span className="capitalize">
                  {listing.listing_type.replace(/_/g, " ")} · {listing.listing_status.replace(/_/g, " ")}
                </span>
                <span>
                  {formatAED(listing.asking_price)}
                  {listing.trakheesi_permit_no ? ` · ${listing.trakheesi_permit_no}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
