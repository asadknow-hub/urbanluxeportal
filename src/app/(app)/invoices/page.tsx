import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { InvoicesTable } from "@/components/invoices/invoices-table";
import { InvoiceCreateDialog } from "@/components/invoices/invoice-create-dialog";

export const dynamic = "force-dynamic";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  let query = supabase
    .from("invoices")
    .select(
      `*,
      customer:customers(id, name)
      `,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.q) {
    query = query.or(`invoice_no.ilike.%${params.q}%`);
  }

  const { data: invoices, error, count } = await query.limit(50);

  if (error) console.error("[invoices] query error:", error.message);

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");

  const canCreate = ["admin", "manager", "accountant"].includes(user.role);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Glossy Header Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Invoices</h1>
          <p className="text-sm text-slate-300 font-medium">
            Manage your {count ?? 0} total invoices and billing
          </p>
        </div>
        {canCreate && (
          <div className="relative z-10">
            <InvoiceCreateDialog customers={customers ?? []} />
          </div>
        )}
      </div>

      <InvoicesTable invoices={invoices ?? []} currentFilters={params} />
    </div>
  );
}
