import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PropertiesGrid } from "@/components/properties/properties-grid";
import { PropertyCreateDialog } from "@/components/properties/property-create-dialog";
import { formatAED } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    purpose?: string;
    category?: string;
    status?: string;
    view?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  let query = supabase
    .from("properties")
    .select(
      `*,
      owner:property_owners(id, name),
      assigned_to_profile:profiles!properties_assigned_to_fkey(id, full_name)
      `,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,ref_no.ilike.%${params.q}%,community.ilike.%${params.q}%`);
  }
  if (params.purpose && params.purpose !== "all") {
    query = query.eq("purpose", params.purpose);
  }
  if (params.category && params.category !== "all") {
    query = query.eq("category", params.category);
  }
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  const { data: properties, error, count } = await query.limit(60);

  if (error) console.error("[properties] query error:", error.message);

  // Fetch owners for the create dialog
  const { data: owners } = await supabase
    .from("property_owners")
    .select("id, name, phone, email")
    .is("deleted_at", null)
    .order("name");

  // Fetch agents
  const { data: agents } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["admin", "manager", "agent"])
    .eq("is_active", true)
    .order("full_name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
          <p className="text-sm text-slate-500">{count ?? 0} total properties</p>
        </div>
        <PropertyCreateDialog owners={owners ?? []} agents={agents ?? []} />
      </div>

      <PropertiesGrid
        properties={properties ?? []}
        currentFilters={params}
      />
    </div>
  );
}
