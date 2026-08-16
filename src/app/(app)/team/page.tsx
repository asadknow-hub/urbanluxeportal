import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TeamList } from "@/components/team/team-list";
import { PageHeader } from "@/components/primitives/page-header";
import { StatCard } from "@/components/primitives/stat-card";
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

  const [{ data: staff, error }, { data: allStaff }] = await Promise.all([
    query,
    supabase.from("profiles").select("id, role, is_active"),
  ]);

  if (error) console.error("[team] query error:", error.message);

  const roster = allStaff ?? [];
  const total = roster.length;
  const active = roster.filter((s) => s.is_active).length;
  const agents = roster.filter((s) => s.role === "agent" && s.is_active).length;

  const { data: leadCounts } = await supabase
    .from("leads")
    .select("assigned_to")
    .is("deleted_at", null);

  const leadMap: Record<string, number> = {};
  (leadCounts ?? []).forEach((l) => {
    if (l.assigned_to) leadMap[l.assigned_to] = (leadMap[l.assigned_to] ?? 0) + 1;
  });

  const { data: dealCounts } = await supabase
    .from("deals")
    .select("assigned_to, stage")
    .is("deleted_at", null);

  const dealMap: Record<string, { total: number; won: number }> = {};
  (dealCounts ?? []).forEach((d) => {
    if (!d.assigned_to) return;
    if (!dealMap[d.assigned_to]) dealMap[d.assigned_to] = { total: 0, won: 0 };
    dealMap[d.assigned_to].total++;
    if (d.stage === "won") dealMap[d.assigned_to].won++;
  });

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <PageHeader
        title="Staff"
        description="Accounts, roles, and CRM load for your workspace."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Roster" value={String(total)} hint={`${active} active`} />
        <StatCard label="Active agents" value={String(agents)} />
        <StatCard
          label="Showing"
          value={String(staff?.length ?? 0)}
          hint={params.role || params.q ? "Filtered" : "All roles"}
        />
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
