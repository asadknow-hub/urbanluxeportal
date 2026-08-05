import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DocumentsList } from "@/components/documents/documents-list";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";

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
    .eq("deleted_at", null)
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

  if (error) console.error("[documents] query error:", error.message);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500">{count ?? 0} documents</p>
        </div>
        <DocumentUploadDialog />
      </div>

      <DocumentsList documents={documents ?? []} currentFilters={params} />
    </div>
  );
}
