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
    .eq("deleted_at", null)
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
    .eq("deleted_at", null)
    .order("name");

  const canCreate = ["admin", "manager", "accountant"].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">{count ?? 0} total invoices</p>
        </div>
        {canCreate && <InvoiceCreateDialog customers={customers ?? []} />}
      </div>

      <InvoicesTable invoices={invoices ?? []} currentFilters={params} />
    </div>
  );
}
