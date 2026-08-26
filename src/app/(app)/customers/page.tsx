import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CustomersTable } from "@/components/customers/customers-table";
import { CustomerCreateDialog } from "@/components/customers/customer-create-dialog";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string }>;
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

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,phone.ilike.%${params.q}%,email.ilike.%${params.q}%`);
  }

  const { data: customers, error, count } = await query.limit(50);

  if (error) console.error("[customers] query error:", error.message);

  const statsQuery = supabase.from("customers").select("status").is("deleted_at", null);
  const { data: allStatuses } = await statsQuery;
  const stats: Record<string, number> = {};
  (allStatuses ?? []).forEach((c) => {
    stats[c.status] = (stats[c.status] ?? 0) + 1;
  });

  const { data: agents } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["admin", "manager", "reception", "agent"])
    .eq("is_active", true)
    .order("full_name");

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{count ?? 0}</span> people
        </p>
        <CustomerCreateDialog agents={agents ?? []} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { key: "lead", label: "Lead", hint: "Captured — still qualifying" },
          { key: "qualified", label: "Qualified", hint: "Open deal in pipeline" },
          { key: "active", label: "Active", hint: "Won at least one deal" },
          { key: "lost", label: "Lost", hint: "Did not proceed" },
        ].map((s) => (
          <Link
            key={s.key}
            href={`/customers?status=${s.key}`}
            className="overflow-hidden rounded-[14px] border border-border bg-card p-4 transition-colors hover:border-primary/30"
          >
            <div className="-mx-4 -mt-4 mb-3 h-0.5 bg-primary" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
            <p
              className="mt-2 font-heading text-[1.75rem] leading-none text-foreground"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              {stats[s.key] ?? 0}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">{s.hint}</p>
          </Link>
        ))}
      </div>

      <CustomersTable customers={customers ?? []} currentFilters={params} />
    </div>
  );
}
