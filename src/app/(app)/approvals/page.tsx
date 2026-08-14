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
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 sm:p-10 shadow-2xl">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 backdrop-blur-md">
              Workflow Control
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Approvals
            </h1>
            <p className="mt-4 text-base text-slate-300 leading-relaxed max-w-xl">
              Review and manage critical operational requests across your organization.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {canApprove ? "Pending Approvals" : "My Requests"}
              </span>
              <span className="text-2xl font-black text-white">
                {canApprove ? (pendingApprovals?.length ?? 0) : (myRequests?.length ?? 0)}
              </span>
              <span className="text-xs text-slate-400 font-medium">requests</span>
            </div>
          </div>
        </div>
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
