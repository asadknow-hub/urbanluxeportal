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
    .eq("deleted_at", null)
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
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">{count ?? 0} total customers</p>
        </div>
        <CustomerCreateDialog agents={agents ?? []} />
      </div>

      <CustomersTable
        customers={customers ?? []}
        currentFilters={params}
      />
    </div>
  );
}
