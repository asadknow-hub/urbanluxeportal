import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TeamList } from "@/components/team/team-list";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["admin", "manager"].includes(user.role)) redirect("/dashboard");

  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (params.role && params.role !== "all") {
    query = query.eq("role", params.role);
  }

  if (params.q) {
    query = query.or(`full_name.ilike.%${params.q}%,email.ilike.%${params.q}%`);
  }

  const { data: staff, error } = await query;

  if (error) console.error("[team] query error:", error.message);

  // Get lead counts per agent
  const { data: leadCounts } = await supabase
    .from("leads")
    .select("assigned_to")
    .eq("deleted_at", null);

  const leadMap: Record<string, number> = {};
  (leadCounts ?? []).forEach((l) => {
    if (l.assigned_to) leadMap[l.assigned_to] = (leadMap[l.assigned_to] ?? 0) + 1;
  });

  // Get deal counts per agent
  const { data: dealCounts } = await supabase
    .from("deals")
    .select("assigned_to, stage")
    .eq("deleted_at", null);

  const dealMap: Record<string, { total: number; won: number }> = {};
  (dealCounts ?? []).forEach((d) => {
    if (!d.assigned_to) return;
    if (!dealMap[d.assigned_to]) dealMap[d.assigned_to] = { total: 0, won: 0 };
    dealMap[d.assigned_to].total++;
    if (d.stage === "won") dealMap[d.assigned_to].won++;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Team</h1>
        <p className="text-sm text-slate-500">
          {staff?.length ?? 0} members · Manage staff accounts, roles, documents & logins
        </p>
      </div>

      <TeamList
        staff={staff ?? []}
        leadMap={leadMap}
        dealMap={dealMap}
        currentFilters={params}
        currentUserRole={user.role}
      />
    </div>
  );
}
