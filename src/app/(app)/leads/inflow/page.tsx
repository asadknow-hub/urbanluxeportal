import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LeadsInflowClient } from "@/components/leads/leads-inflow-client";

export const dynamic = "force-dynamic";

export default async function LeadsInflowPage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (user.role !== "admin" && user.role !== "manager") {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">You don&apos;t have access to this page.</p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: sources } = await supabase
    .from("lead_sources")
    .select("*")
    .order("created_at", { ascending: false });

  // Count leads per source
  const { data: sourceStats } = await supabase
    .from("leads")
    .select("source_id")
    .not("source_id", "is", null);

  const statsMap: Record<string, number> = {};
  (sourceStats ?? []).forEach((l: { source_id: string | null }) => {
    if (l.source_id) {
      statsMap[l.source_id] = (statsMap[l.source_id] ?? 0) + 1;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configure Leads Inflow</h1>
        <p className="text-sm text-slate-500">
          Manage where your leads come from — web forms, social media, portals, and more.
        </p>
      </div>

      <LeadsInflowClient
        sources={sources ?? []}
        statsMap={statsMap}
      />
    </div>
  );
}
