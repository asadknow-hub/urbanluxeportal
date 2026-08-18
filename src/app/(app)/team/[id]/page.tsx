import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StaffDetail } from "@/components/team/staff-detail";
import { redirect } from "next/navigation";
import { getStaffActivityStats } from "@/server/staff-sessions";
import { docCategoryChoices, type LeadFieldOption } from "@/lib/lead-field-options";

export const dynamic = "force-dynamic";

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["admin", "manager"].includes(user.role)) redirect("/dashboard");

  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Fetch profile
  const { data: staff, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !staff) {
    return (
      <div className="p-4">
        <p className="text-sm text-slate-500">Staff member not found.</p>
      </div>
    );
  }

  // Managers can't view admin profiles
  if (user.role === "manager" && staff.role === "admin") {
    return (
      <div className="p-4">
        <p className="text-sm text-slate-500">You don't have permission to view this profile.</p>
      </div>
    );
  }

  const [
    { data: leads },
    { data: deals },
    { data: documents },
    { data: activities },
    { count: leadCount },
    { count: activeDealCount },
    sessionResult,
    { data: docCategoryRows },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id, name, source, status, created_at")
      .eq("assigned_to", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("deals")
      .select("id, title, stage, value, updated_at")
      .eq("assigned_to", id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase
      .from("documents")
      .select("*")
      .eq("entity_type", "staff")
      .eq("entity_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("activity_log")
      .select("action, entity_type, entity_id, created_at")
      .eq("actor_id", id)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("assigned_to", id)
      .is("deleted_at", null),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("assigned_to", id)
      .is("deleted_at", null)
      .neq("stage", "won")
      .neq("stage", "lost"),
    getStaffActivityStats(id, 1),
    supabase
      .from("lead_field_options")
      .select("id, field_key, value, label, sort, extra")
      .eq("field_key", "doc_category")
      .order("sort")
      .order("label"),
  ]);

  const sessionStats = sessionResult.ok ? sessionResult.data : null;

  return (
    <div className="space-y-6">
      <StaffDetail
        staff={staff}
        leads={leads ?? []}
        deals={deals ?? []}
        documents={documents ?? []}
        activities={activities ?? []}
        currentUserRole={user.role}
        sessionStats={sessionStats ?? undefined}
        docCategories={docCategoryChoices((docCategoryRows ?? []) as LeadFieldOption[])}
        metrics={{
          leads: leadCount ?? 0,
          deals: activeDealCount ?? 0,
          documents: documents?.length ?? 0,
        }}
      />
    </div>
  );
}
