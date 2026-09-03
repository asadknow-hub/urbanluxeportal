import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageCrm } from "@/lib/permissions";
import { PropertiesTable } from "@/components/properties/properties-table";
import { InventoryCreateDialog } from "@/components/inventory/inventory-create-dialog";
import Link from "next/link";
import { LISTING_TYPES, propertyLabel } from "@/lib/inventory";
import { formatAED } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  let closedQuery = supabase
    .from("customer_properties")
    .select(
      `id, property_title, property_community, property_building, property_unit, property_type,
      deal_type, value, agency_commission_amount, acquired_at, deal_id,
      customer:customers(id, name),
      agent:profiles!customer_properties_assigned_to_fkey(id, full_name)`,
      { count: "exact" }
    )
    .order("acquired_at", { ascending: false });

  if (params.type && params.type !== "all") {
    closedQuery = closedQuery.eq("property_type", params.type);
  }
  if (params.q) {
    const q = params.q.trim();
    closedQuery = closedQuery.or(
      `property_title.ilike.%${q}%,property_community.ilike.%${q}%,property_building.ilike.%${q}%`
    );
  }

  let stockQuery = supabase
    .from("properties")
    .select(
      `id, property_code, community, building_name, unit_number, property_type, bedrooms, status,
      listings(id, listing_type, asking_price, listing_status)`
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(80);

  if (params.q) {
    const q = params.q.trim();
    stockQuery = stockQuery.or(
      `property_code.ilike.%${q}%,community.ilike.%${q}%,building_name.ilike.%${q}%,unit_number.ilike.%${q}%`
    );
  }

  const [{ data: closed, count, error }, { data: stock }, { data: agents }, { data: owners }] = await Promise.all([
    closedQuery.limit(100),
    stockQuery,
    supabase
      .from("profiles")
      .select("id, full_name")
      .in("role", ["admin", "manager", "reception", "agent"])
      .eq("is_active", true)
      .order("full_name"),
    supabase.from("customers").select("id, name").is("deleted_at", null).order("name").limit(200),
  ]);
  if (error) console.error("[properties] query error:", error.message);

  const rows = (closed ?? []).map((row) => ({
    id: row.id,
    property_title: row.property_title,
    property_community: row.property_community,
    property_building: row.property_building,
    property_unit: row.property_unit,
    property_type: row.property_type,
    deal_type: row.deal_type,
    value: row.value,
    agency_commission_amount: row.agency_commission_amount,
    acquired_at: row.acquired_at,
    deal_id: row.deal_id,
    customer: Array.isArray(row.customer) ? row.customer[0] ?? null : row.customer,
    agent: Array.isArray(row.agent) ? row.agent[0] ?? null : row.agent,
  }));

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl text-foreground" style={{ fontFamily: "var(--font-display), serif" }}>
            Properties
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create Buy, Rent, and Off-plan files. Closed deals still land here automatically.
          </p>
        </div>
        {canManageCrm(user.role) ? (
          <InventoryCreateDialog agents={agents ?? []} owners={owners ?? []} defaultAgentId={user.id} />
        ) : null}
      </div>

      <section className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="h-0.5 bg-primary" />
        <div className="px-4 py-3">
          <h2 className="text-sm font-semibold">Listings</h2>
          <p className="text-xs text-muted-foreground">{(stock ?? []).length} Buy / Rent / Off-plan units</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-border bg-muted/30 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(stock ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    No listings yet. Add a Buy, Rent, or Off-plan property.
                  </td>
                </tr>
              ) : (
                (stock ?? []).map((row) => {
                  const listings = Array.isArray(row.listings) ? row.listings : [];
                  const listing = listings[0];
                  const category =
                    LISTING_TYPES.find((item) => item.value === listing?.listing_type)?.label ?? "—";
                  return (
                    <tr key={row.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link href={`/inventory/${row.id}`} className="font-medium hover:text-primary">
                          {propertyLabel(row)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{category}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {listing ? formatAED(listing.asking_price) : "—"}
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{row.status.replace(/_/g, " ")}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Closed deals</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{count ?? rows.length}</span> acquired properties
        </p>
        <PropertiesTable properties={rows} currentFilters={params} />
      </div>
    </div>
  );
}
