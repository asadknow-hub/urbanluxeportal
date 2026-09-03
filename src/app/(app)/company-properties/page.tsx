import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageCrm } from "@/lib/permissions";
import { PropertiesTable } from "@/components/properties/properties-table";
import { InventoryCreateDialog } from "@/components/inventory/inventory-create-dialog";
import { LISTING_TYPES, propertyLabel } from "@/lib/inventory";
import { formatAED } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Building2, Handshake } from "lucide-react";

export const dynamic = "force-dynamic";

type ViewMode = "inventory" | "closed";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; view?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const view: ViewMode = params.view === "closed" ? "closed" : "inventory";

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
      listings(id, listing_type, asking_price, listing_status)`,
      { count: "exact" }
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

  const [{ data: closed, count: closedCount, error }, { data: stock, count: stockCount }, { data: agents }, { data: owners }] =
    await Promise.all([
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

  const closedRevenue = rows.reduce((sum, row) => sum + (row.agency_commission_amount ?? 0), 0);
  const closedVolume = rows.reduce((sum, row) => sum + (row.value ?? 0), 0);

  function viewHref(next: ViewMode) {
    const sp = new URLSearchParams();
    if (next === "closed") sp.set("view", "closed");
    if (params.q) sp.set("q", params.q);
    if (params.type && params.type !== "all") sp.set("type", params.type);
    const qs = sp.toString();
    return qs ? `/company-properties?${qs}` : "/company-properties";
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl text-foreground" style={{ fontFamily: "var(--font-display), serif" }}>
            Properties
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inventory stock for matching, and closed deals that feed agency revenue.
          </p>
        </div>
        {canManageCrm(user.role) ? (
          <InventoryCreateDialog agents={agents ?? []} owners={owners ?? []} defaultAgentId={user.id} />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={viewHref("inventory")}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-[12px] border-2 px-4 text-sm font-semibold transition-colors",
            view === "inventory"
              ? "border-primary bg-primary text-primary-foreground shadow-md"
              : "border-primary/25 bg-primary/8 text-primary hover:bg-primary/12"
          )}
        >
          <Building2 className="h-4 w-4" />
          Inventory
        </Link>
        <Link
          href={viewHref("closed")}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-[12px] border-2 px-4 text-sm font-semibold transition-colors",
            view === "closed"
              ? "border-[#0d2847] bg-[#0d2847] text-white shadow-md"
              : "border-[#0d2847]/25 bg-[#0d2847]/8 text-[#0d2847] hover:bg-[#0d2847]/12"
          )}
        >
          <Handshake className="h-4 w-4" />
          Closed deals
        </Link>
      </div>

      {view === "inventory" ? (
        <section className="overflow-hidden rounded-[14px] border border-border bg-card">
          <div className="h-0.5 bg-primary" />
          <div className="flex flex-wrap items-end justify-between gap-2 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Inventory</h2>
              <p className="text-xs text-muted-foreground">
                {stockCount ?? (stock ?? []).length} Buy / Rent / Off-plan units available for matching
              </p>
            </div>
            <Link href="/inventory" className="text-xs font-medium text-secondary hover:underline">
              Open full inventory →
            </Link>
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
                        <td className="px-4 py-3 capitalize text-muted-foreground">
                          {row.status.replace(/_/g, " ")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="space-y-4">
          <section className="overflow-hidden rounded-[14px] border border-border bg-card">
            <div className="h-0.5 bg-[#0d2847]" />
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Revenue</p>
                <p className="mt-1 font-heading text-2xl tabular-nums" style={{ fontFamily: "var(--font-display), serif" }}>
                  {formatAED(closedRevenue)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Agency commission from closed deals only — inventory stock is not counted.
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Deal volume</p>
                <p className="mt-1 font-heading text-2xl tabular-nums" style={{ fontFamily: "var(--font-display), serif" }}>
                  {formatAED(closedVolume)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Sum of closed deal property values.</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Closed units</p>
                <p className="mt-1 font-heading text-2xl tabular-nums" style={{ fontFamily: "var(--font-display), serif" }}>
                  {closedCount ?? rows.length}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Properties created when deals finalize.</p>
              </div>
            </div>
          </section>

          <PropertiesTable properties={rows} currentFilters={params} />
        </div>
      )}
    </div>
  );
}
