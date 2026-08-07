// ─── Leads Inflow Configuration Page ───────────────────────────
//
// This page is the central hub for configuring how leads enter the system.
// It has three tabs:
//   1. Sources — where leads come from (web forms, social, portals, etc.)
//   2. Field Configuration — define custom fields that appear on lead forms
//      and are stored in leads.custom JSONB
//   3. Field Mapping — map raw incoming fields from each source to lead fields
//
// Access: admin and manager only (enforced by route access + server-side check)

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

  // Fetch lead sources (where leads come from)
  const { data: sources } = await supabase
    .from("lead_sources")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch custom field definitions (what fields exist on a lead)
  // We fetch both active and inactive so admins can see/re-activate deactivated fields
  const { data: fieldDefs } = await supabase
    .from("custom_field_defs")
    .select("*")
    .eq("entity", "lead")
    .order("is_active", { ascending: false }) // active first
    .order("sort", { ascending: true });

  // Count leads per source for stats display
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
          Manage where your leads come from, what fields they fill, and how data maps to your lead structure.
        </p>
      </div>

      <LeadsInflowClient
        sources={sources ?? []}
        fieldDefs={fieldDefs ?? []}
        statsMap={statsMap}
      />
    </div>
  );
}
