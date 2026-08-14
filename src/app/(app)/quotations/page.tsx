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
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Glossy Header Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Quotations</h1>
          <p className="text-sm text-slate-300 font-medium">
            Manage your {count ?? 0} total quotations and proposals
          </p>
        </div>
        <div className="relative z-10">
          <QuotationCreateDialog customers={customers ?? []} />
        </div>
      </div>

      <QuotationsTable quotations={quotations ?? []} currentFilters={params} />
    </div>
  );
}
