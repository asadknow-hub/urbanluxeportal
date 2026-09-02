import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PropertiesTable } from "@/components/properties/properties-table";

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

  let query = supabase
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
    query = query.eq("property_type", params.type);
  }

  if (params.q) {
    const q = params.q.trim();
    query = query.or(
      `property_title.ilike.%${q}%,property_community.ilike.%${q}%,property_building.ilike.%${q}%`
    );
  }

  const { data: properties, count, error } = await query.limit(100);
  if (error) console.error("[properties] query error:", error.message);

  const rows = (properties ?? []).map((row) => ({
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
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <div>
        <h1
          className="font-heading text-2xl text-foreground"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          Properties
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Closed-deal properties — created automatically when deals finalize, like customer records.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        <span className="font-medium tabular-nums text-foreground">{count ?? rows.length}</span> properties
      </p>
      <PropertiesTable properties={rows} currentFilters={params} />
    </div>
  );
}
