import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LeadDetail } from "@/components/leads/lead-detail";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Fetch lead with assigned agent profile
  const { data: lead, error } = await supabase
    .from("leads")
    .select(
      `*,
      assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name, avatar_url, role, email, phone),
      created_by_profile:profiles!leads_created_by_fkey(id, full_name)
      `
    )
    .eq("id", id)
    .single();

  if (error || !lead) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">Lead not found.</p>
      </div>
    );
  }

  // Agents can only see their own + unassigned
  if (user.role === "agent" && lead.assigned_to !== user.id && lead.assigned_to !== null) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">You don't have access to this lead.</p>
      </div>
    );
  }

  // Fetch lead activities (timeline)
  const { data: activities } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("lead_id", id)
    .order("occurred_at", { ascending: false })
    .limit(50);

  // Fetch agents for assignment
  const { data: agents } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["admin", "manager", "agent"])
    .eq("is_active", true)
    .order("full_name");

  // Fetch linked customer if converted
  let customer = null;
  if (lead.converted_customer_id) {
    const { data: cust } = await supabase
      .from("customers")
      .select("id, name, phone, email")
      .eq("id", lead.converted_customer_id)
      .single();
    customer = cust;
  }

  // Fetch linked deal if converted
  let deal = null;
  if (lead.converted_deal_id) {
    const { data: d } = await supabase
      .from("deals")
      .select("id, title, stage, value, deal_type")
      .eq("id", lead.converted_deal_id)
      .single();
    deal = d;
  }

  // Fetch lead documents
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("entity_type", "lead")
    .eq("entity_id", id)
    .eq("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <LeadDetail
      lead={lead}
      activities={activities ?? []}
      agents={agents ?? []}
      customer={customer}
      deal={deal}
      documents={documents ?? []}
      userRole={user.role}
      userId={user.id}
    />
  );
}
