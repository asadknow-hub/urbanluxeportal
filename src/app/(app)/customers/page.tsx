import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomersTable } from "@/components/customers/customers-table";
import { CustomerCreateDialog } from "@/components/customers/customer-create-dialog";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  let query = supabase
    .from("customers")
    .select(
      `*,
      assigned_to_profile:profiles!customers_assigned_to_fkey(id, full_name, avatar_url)
      `,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (user.role === "agent") {
    query = query.or(`assigned_to.eq.${user.id},assigned_to.is.null`);
  }

  if (params.type && params.type !== "all") {
    query = query.eq("type", params.type);
  }

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,phone.ilike.%${params.q}%,email.ilike.%${params.q}%`);
  }

  const { data: customers, error, count } = await query.limit(50);

  if (error) console.error("[customers] query error:", error.message);

  // Pipeline summary
  const statsQuery = supabase
    .from("customers")
    .select("status")
    .is("deleted_at", null);
  const { data: allStatuses } = await statsQuery;
  const stats: Record<string, number> = {};
  (allStatuses ?? []).forEach((c) => {
    stats[c.status] = (stats[c.status] ?? 0) + 1;
  });

  const { data: agents } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["admin", "manager", "agent"])
    .eq("is_active", true)
    .order("full_name");

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Glossy Header Banner */}
      <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4 sm:p-5 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Customers</h1>
          <p className="text-sm text-slate-300 font-medium">
            Manage your {count ?? 0} total customers and prospects
          </p>
        </div>
        <div className="relative z-10">
          <CustomerCreateDialog agents={agents ?? []} />
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: "active", label: "Active", color: "text-emerald-700", border: "border-emerald-200/60", bg: "bg-white", badge: "bg-emerald-500", grad: "from-emerald-50 to-transparent" },
          { key: "prospect", label: "Prospect", color: "text-amber-700", border: "border-amber-200/60", bg: "bg-white", badge: "bg-amber-500", grad: "from-amber-50 to-transparent" },
          { key: "inactive", label: "Inactive", color: "text-slate-500", border: "border-slate-200/60", bg: "bg-white", badge: "bg-slate-300", grad: "from-slate-50 to-transparent" },
        ].map((s) => (
          <div key={s.key} className={`relative overflow-hidden rounded-[1.5rem] border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-gradient-to-br ${s.border} ${s.bg} ${s.grad} shadow-sm`}>
            <div className="relative z-10 flex items-center justify-between mb-2">
              <span className={`text-sm font-bold uppercase tracking-wider ${s.color}`}>{s.label}</span>
              <span className={`h-2.5 w-2.5 rounded-full shadow-sm ${s.badge}`} />
            </div>
            <p className="relative z-10 text-4xl font-extrabold text-slate-900">{stats[s.key] ?? 0}</p>
          </div>
        ))}
      </div>

      <CustomersTable
        customers={customers ?? []}
        currentFilters={params}
      />
    </div>
  );
}
