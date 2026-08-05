import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StaffDetail } from "@/components/team/staff-detail";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/dates";

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
      <div className="p-6">
        <p className="text-sm text-slate-500">Staff member not found.</p>
      </div>
    );
  }

  // Managers can't view admin profiles
  if (user.role === "manager" && staff.role === "admin") {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">You don't have permission to view this profile.</p>
      </div>
    );
  }

  // Fetch assigned leads
  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, source, status, created_at")
    .eq("assigned_to", id)
    .eq("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch assigned deals
  const { data: deals } = await supabase
    .from("deals")
    .select("id, title, stage, value, updated_at")
    .eq("assigned_to", id)
    .eq("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(10);

  // Fetch staff documents
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("entity_type", "staff")
    .eq("entity_id", id)
    .eq("deleted_at", null)
    .order("created_at", { ascending: false });

  // Fetch activity log
  const { data: activities } = await supabase
    .from("activity_log")
    .select("action, entity_type, entity_id, created_at")
    .eq("actor_id", id)
    .order("created_at", { ascending: false })
    .limit(15);

  return (
    <div className="space-y-6">
      <StaffDetail
        staff={staff}
        leads={leads ?? []}
        deals={deals ?? []}
        documents={documents ?? []}
        activities={activities ?? []}
        currentUserRole={user.role}
      />
    </div>
  );
}
