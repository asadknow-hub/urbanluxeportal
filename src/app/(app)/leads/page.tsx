import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadCreateDialog } from "@/components/leads/lead-create-dialog";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string; assigned?: string; q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  let query = supabase
    .from("leads")
    .select(
      `*,
      assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name, avatar_url)
      `,
      { count: "exact" }
    )
    .eq("deleted_at", null)
    .order("created_at", { ascending: false });

  // Agents see only own + unassigned
  if (user.role === "agent") {
    query = query.or(`assigned_to.eq.${user.id},assigned_to.is.null`);
  }

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.source && params.source !== "all") {
    query = query.eq("source", params.source);
  }
  if (params.assigned && params.assigned !== "all") {
    if (params.assigned === "unassigned") {
      query = query.is("assigned_to", null);
    } else {
      query = query.eq("assigned_to", params.assigned);
    }
  }
  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,phone.ilike.%${params.q}%,email.ilike.%${params.q}%`);
  }

  const { data: leads, error, count } = await query.limit(50);

  if (error) console.error("[leads] query error:", error.message);

  // Fetch agents for assignment filter
  const { data: agents } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["admin", "manager", "agent"])
    .eq("is_active", true)
    .order("full_name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500">
            {count ?? 0} total leads
          </p>
        </div>
        <LeadCreateDialog agents={agents ?? []} />
      </div>

      <LeadsTable
        leads={leads ?? []}
        agents={agents ?? []}
        currentFilters={params}
        userRole={user.role}
      />
    </div>
  );
}
