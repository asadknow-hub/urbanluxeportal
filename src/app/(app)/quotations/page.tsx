import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { QuotationsTable } from "@/components/quotations/quotations-table";
import { QuotationCreateDialog } from "@/components/quotations/quotation-create-dialog";

export const dynamic = "force-dynamic";

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  let query = supabase
    .from("quotations")
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
    query = query.or(`quote_no.ilike.%${params.q}%`);
  }

  const { data: quotations, error, count } = await query.limit(50);

  if (error) console.error("[quotations] query error:", error.message);

  // Fetch customers for create dialog
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quotations</h1>
          <p className="text-sm text-slate-500">{count ?? 0} total quotations</p>
        </div>
        <QuotationCreateDialog customers={customers ?? []} />
      </div>

      <QuotationsTable quotations={quotations ?? []} currentFilters={params} />
    </div>
  );
}
