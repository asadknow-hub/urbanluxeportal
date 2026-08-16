import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TeamList } from "@/components/team/team-list";
import { StaffStats } from "@/components/team/staff-stats";
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
    <div className="mx-auto max-w-[1600px] space-y-7">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.375rem)] font-semibold leading-tight tracking-[-0.05em] text-foreground">
          Staff
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your team, roles, and CRM access in one place.
        </p>
      </div>

      <StaffStats
        total={total}
        active={active}
        agents={agents}
        showing={staff?.length ?? 0}
        showingHint={params.role || params.q ? "Filtered view" : "All roles"}
      />

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
