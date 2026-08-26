import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TeamList } from "@/components/team/team-list";
import { StaffStats } from "@/components/team/staff-stats";
import { DesksManager } from "@/components/team/desks-manager";
import { isDealClosed } from "@/lib/deal-stages";
import { canManageCrm } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { loadStaffRoster } from "@/server/roster";

export const dynamic = "force-dynamic";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageCrm(user.role)) redirect("/dashboard");

  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  const [{ data: roster, error }, { data: deskRows }] = await Promise.all([
    loadStaffRoster(supabase),
    supabase.from("teams").select("id, name, is_active").is("deleted_at", null).order("name"),
  ]);

  if (error) console.error("[team] query error:", error.message);

  const q = params.q?.trim().toLowerCase();
  const staff = (roster ?? []).filter((row) => {
    if (params.role && params.role !== "all" && row.role !== params.role) return false;
    if (!q) return true;
    return (
      (row.full_name ?? "").toLowerCase().includes(q) || (row.email ?? "").toLowerCase().includes(q)
    );
  });

  const desks = deskRows ?? [];
  const deskNames = new Map(desks.map((d) => [d.id, d.name]));
  const memberCounts: Record<string, number> = {};
  for (const row of roster ?? []) {
    if (row.team_id) memberCounts[row.team_id] = (memberCounts[row.team_id] ?? 0) + 1;
  }

  const total = roster?.length ?? 0;
  const active = (roster ?? []).filter((s) => s.is_active).length;
  const agents = (roster ?? []).filter((s) => s.role === "agent" && s.is_active).length;

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
    if (isDealClosed(d.stage)) dealMap[d.assigned_to].won++;
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
        showing={staff.length}
        showingHint={params.role || params.q ? "Filtered view" : "All roles"}
      />

      <DesksManager desks={desks} memberCounts={memberCounts} canEdit={canManageCrm(user.role)} />

      <TeamList
        staff={staff.map((s) => ({
          ...s,
          email: s.email ?? "",
          full_name: s.full_name ?? "",
          deskName: s.team_id ? deskNames.get(s.team_id) ?? null : null,
        }))}
        desks={desks}
        leadMap={leadMap}
        dealMap={dealMap}
        currentFilters={params}
        currentUserRole={user.role}
      />
    </div>
  );
}
