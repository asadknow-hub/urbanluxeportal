import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DealDetail } from "@/components/pipeline/deal-detail";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const { id } = await params;

  // Fetch deal with customer and assigned agent
  const { data: deal, error } = await supabase
    .from("deals")
    .select(
      `*,
      customer:customers(
        id, name, phone, email, nationality, status, lead_id,
        assigned_to_profile:profiles!customers_assigned_to_fkey(id, full_name)
      ),
      assigned_to_profile:profiles!deals_assigned_to_fkey(id, full_name, avatar_url, role),
      lead:leads(id, name, source, interest, score, status, phone, email)
      `
    )
    .eq("id", id)
    .eq("deleted_at", null)
    .single();

  if (error || !deal) notFound();

  // Agents can only see their own deals
  if (user.role === "agent" && deal.assigned_to !== user.id) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">You don&apos;t have access to this deal.</p>
      </div>
    );
  }

  // Fetch deal activities (timeline)
  const { data: activities } = await supabase
    .from("deal_activities")
    .select("*, created_by_profile:profiles!deal_activities_created_by_fkey(id, full_name)")
    .eq("deal_id", id)
    .order("occurred_at", { ascending: false })
    .limit(50);

  // Fetch agents for assignment
  const { data: agents } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["admin", "manager", "agent"])
    .eq("is_active", true)
    .order("full_name");

  // Fetch deal documents
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("entity_type", "deal")
    .eq("entity_id", id)
    .eq("deleted_at", null)
    .order("created_at", { ascending: false });

  // Fetch invoices for this customer
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, total, issue_date")
    .eq("customer_id", deal.customer?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <DealDetail
      deal={deal}
      activities={activities ?? []}
      agents={agents ?? []}
      documents={documents ?? []}
      invoices={invoices ?? []}
      userRole={user.role}
      userId={user.id}
    />
  );
}
