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
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 sm:p-10 shadow-2xl">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 backdrop-blur-md">
              Real Estate Hub
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Properties
            </h1>
            <p className="mt-4 text-base text-slate-300 leading-relaxed max-w-xl">
              Manage your diverse portfolio of listings with elegant precision and showcase them effectively.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Portfolio</span>
              <span className="text-2xl font-black text-white">{count ?? 0}</span>
              <span className="text-xs text-slate-400 font-medium">properties</span>
            </div>
            <PropertyCreateDialog owners={owners ?? []} agents={agents ?? []} />
          </div>
        </div>
      </div>

      <PropertiesGrid
        properties={properties ?? []}
        currentFilters={params}
      />
    </div>
  );
}
