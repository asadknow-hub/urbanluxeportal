import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApprovalsList } from "@/components/approvals/approvals-list";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const activeTab = params.tab ?? "inbox";

  const canApprove = ["admin", "manager"].includes(user.role);

  // Inbox: pending approvals for admins/managers
  const { data: pendingApprovals } = await supabase
    .from("approvals")
    .select(
      `*,
      requester:profiles!approvals_requested_by_fkey(id, full_name, email)
      `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  // My requests: approvals requested by current user
  const { data: myRequests } = await supabase
    .from("approvals")
    .select(
      `*,
      decider:profiles!approvals_decided_by_fkey(id, full_name)
      `
    )
    .eq("requested_by", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Approvals</h1>
        <p className="text-sm text-slate-500">
          {canApprove
            ? `${pendingApprovals?.length ?? 0} pending approval${(pendingApprovals?.length ?? 0) !== 1 ? "s" : ""}`
            : `${myRequests?.length ?? 0} requests`}
        </p>
      </div>

      <ApprovalsList
        activeTab={activeTab}
        pendingApprovals={pendingApprovals ?? []}
        myRequests={myRequests ?? []}
        canApprove={canApprove}
      />
    </div>
  );
}
