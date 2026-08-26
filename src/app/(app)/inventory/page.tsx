import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageCrm } from "@/lib/permissions";
import { PageHeader } from "@/components/primitives/page-header";
import { InventoryCreateDialog } from "@/components/inventory/inventory-create-dialog";
import { formatPropertyType, propertyLabel } from "@/lib/inventory";
import { formatAED } from "@/lib/money";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  let query = supabase
    .from("properties")
    .select(
      `id, property_code, community, building_name, unit_number, property_type, bedrooms, status, assigned_to,
      developer:developers(name),
      project:projects(name),
      listings(id, listing_type, asking_price, listing_status),
      assigned_to_profile:profiles!properties_assigned_to_fkey(full_name)`,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.type && params.type !== "all") query = query.eq("property_type", params.type);
  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.q) {
    query = query.or(
      `property_code.ilike.%${params.q}%,community.ilike.%${params.q}%,building_name.ilike.%${params.q}%,unit_number.ilike.%${params.q}%`
    );
  }

  const [{ data: properties, count, error }, { data: agents }] = await Promise.all([
    query.limit(80),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["admin", "manager", "reception", "agent"])
      .eq("is_active", true)
      .order("full_name"),
  ]);

  if (error) console.error("[inventory]", error.message);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <PageHeader
        title="Inventory"
        description="Internal stock for matching and viewings. Public brochure listings stay on the website."
        actions={
          canManageCrm(user.role) ? (
            <InventoryCreateDialog agents={agents ?? []} defaultAgentId={user.id} />
          ) : null
        }
      />

      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="h-0.5 bg-primary" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(properties ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                      No units yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {canManageCrm(user.role)
                        ? "Add a unit so agents can shortlist it on a deal and book a viewing."
                        : "Ask a manager to add a unit so you can shortlist it on a deal."}
                    </p>
                  </td>
                </tr>
              ) : (
                (properties ?? []).map((row) => {
                  const listings = Array.isArray(row.listings) ? row.listings : [];
                  const listing = listings[0];
                  return (
                    <tr key={row.id} className="group transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs font-semibold">
                        <Link href={`/inventory/${row.id}`} prefetch className="hover:text-primary">
                          {row.property_code}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/inventory/${row.id}`} prefetch className="font-medium hover:text-primary">
                          {propertyLabel(row)}
                        </Link>
                        {(() => {
                          const project = Array.isArray(row.project) ? row.project[0] : row.project;
                          return project ? <p className="text-xs text-muted-foreground">{(project as { name: string }).name}</p> : null;
                        })()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatPropertyType(row.property_type)}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{row.status.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {listing
                          ? `${listing.listing_type.replace(/_/g, " ")} · ${formatAED(listing.asking_price)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {(() => {
                          const profile = Array.isArray(row.assigned_to_profile)
                            ? row.assigned_to_profile[0]
                            : row.assigned_to_profile;
                          return profile ? (profile as { full_name: string }).full_name : "—";
                        })()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{count ?? 0} units</p>
    </div>
  );
}
