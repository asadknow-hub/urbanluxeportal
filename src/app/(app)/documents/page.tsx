import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DocumentsList } from "@/components/documents/documents-list";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { choiceItems, groupLeadFieldOptions, type LeadFieldOption } from "@/lib/lead-field-options";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; entity_type?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  let query = supabase
    .from("documents")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.category && params.category !== "all") {
    query = query.eq("category", params.category);
  }

  if (params.entity_type && params.entity_type !== "all") {
    query = query.eq("entity_type", params.entity_type);
  }

  if (params.q) {
    query = query.ilike("name", `%${params.q}%`);
  }

  const { data: documents, error, count } = await query.limit(50);
  const { data: optionRows } = await supabase
    .from("lead_field_options")
    .select("id, field_key, value, label, sort, extra")
    .eq("field_key", "doc_category")
    .order("sort")
    .order("label");
  const docCategories = choiceItems(
    groupLeadFieldOptions((optionRows ?? []) as LeadFieldOption[]).doc_category
  );

  if (error) console.error("[documents] query error:", error.message);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-5 sm:p-10 shadow-2xl">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>

        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 backdrop-blur-md">
              Secure Vault
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Documents
            </h1>
            <p className="mt-4 text-base text-slate-300 leading-relaxed max-w-xl">
              Centralized repository for all your critical files, contracts, and property documents.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Files</span>
              <span className="text-2xl font-black text-white">{count ?? 0}</span>
              <span className="text-xs text-slate-400 font-medium">documents</span>
            </div>
            <DocumentUploadDialog categories={docCategories} />
          </div>
        </div>
      </div>

      <DocumentsList documents={documents ?? []} currentFilters={params} categories={docCategories} />
    </div>
  );
}
