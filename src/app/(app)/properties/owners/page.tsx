import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OwnersList } from "@/components/properties/owners-list";
import { OwnerCreateDialog } from "@/components/properties/owner-create-dialog";

export const dynamic = "force-dynamic";

export default async function OwnersPage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();

  const { data: owners, error } = await supabase
    .from("property_owners")
    .select("*")
    .eq("deleted_at", null)
    .order("name");

  if (error) console.error("[owners] query error:", error.message);

  // Fetch property counts per owner
  const { data: propertyCounts } = await supabase
    .from("properties")
    .select("owner_id")
    .eq("deleted_at", null)
    .not("owner_id", "is", null);

  const countMap: Record<string, number> = {};
  (propertyCounts ?? []).forEach((p) => {
    if (p.owner_id) countMap[p.owner_id] = (countMap[p.owner_id] ?? 0) + 1;
  });

  const ownersWithCounts = (owners ?? []).map((o) => ({
    ...o,
    property_count: countMap[o.id] ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Property Owners</h1>
          <p className="text-sm text-slate-500">{ownersWithCounts.length} owners</p>
        </div>
        <OwnerCreateDialog />
      </div>

      <OwnersList owners={ownersWithCounts} />
    </div>
  );
}
