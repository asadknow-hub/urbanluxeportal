"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { decideApproval } from "@/server/approvals";
import { toast } from "sonner";
import { Check, X, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";

type ApprovalRow = {
  id: string;
  kind: string;
  entity_type: string;
  entity_id: string;
  status: string;
  amount: number | null;
  reason: string | null;
  decision_note: string | null;
  created_at: string;
  decided_at: string | null;
  requester?: { id: string; full_name: string; email: string } | null;
  decider?: { id: string; full_name: string } | null;
};

export function ApprovalsList({
  activeTab,
  pendingApprovals,
  myRequests,
  canApprove,
}: {
  activeTab: string;
  pendingApprovals: ApprovalRow[];
  myRequests: ApprovalRow[];
  canApprove: boolean;
}) {
  const router = useRouter();

  function switchTab(tab: string) {
    if (tab === "inbox") {
      router.push("/approvals");
    } else {
      router.push("/approvals?tab=mine");
    }
  }

  return (
    <div className="space-y-4">
      {canApprove && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 p-1.5 backdrop-blur-md shadow-sm border border-slate-200/60 mb-6">
          <button
            onClick={() => switchTab("inbox")}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-all duration-300 ${activeTab === "inbox" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
          >
            Inbox ({pendingApprovals.length})
          </button>
          <button
            onClick={() => switchTab("mine")}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-all duration-300 ${activeTab === "mine" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
          >
            My Requests ({myRequests.length})
          </button>
        </div>
      )}

      {activeTab === "inbox" && canApprove ? (
        <PendingApprovals approvals={pendingApprovals} />
      ) : (
        <MyRequests requests={myRequests} />
      )}
    </div>
  );
}

function PendingApprovals({ approvals }: { approvals: ApprovalRow[] }) {
  return (
    <div className="space-y-4">
      {approvals.length === 0 ? (
        <div className="rounded-[1.5rem] bg-white p-12 text-center shadow-sm border border-slate-200/60 flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-400">No pending approvals.</p>
        </div>
      ) : (
        approvals.map((approval) => (
          <ApprovalCard key={approval.id} approval={approval} pending />
        ))
      )}
    </div>
  );
}

function MyRequests({ requests }: { requests: ApprovalRow[] }) {
  return (
    <div className="space-y-4">
      {requests.length === 0 ? (
        <div className="rounded-[1.5rem] bg-white p-12 text-center shadow-sm border border-slate-200/60 flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-400">No approval requests submitted.</p>
        </div>
      ) : (
        requests.map((req) => (
          <ApprovalCard key={req.id} approval={req} pending={false} />
        ))
      )}
    </div>
  );
}

function ApprovalCard({
  approval,
  pending,
}: {
  approval: ApprovalRow;
  pending: boolean;
}) {
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function openDecision(d: "approved" | "rejected") {
    setDecision(d);
    setDecisionOpen(true);
  }

  function handleDecide() {
    startTransition(async () => {
      const result = await decideApproval(approval.id, decision, note);
      if (result.ok) {
        toast.success(`Approval ${decision}`);
        setDecisionOpen(false);
        setNote("");
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  const statusIcon = approval.status === "approved" ? (
    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  ) : approval.status === "rejected" ? (
    <XCircle className="h-4 w-4 text-red-500" />
  ) : (
    <Clock className="h-4 w-4 text-amber-500" />
  );

  return (
    <div className="group rounded-[1.5rem] bg-white p-4 sm:p-5 shadow-sm border border-slate-200/60 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex items-center justify-center h-8 w-8 rounded-full ${approval.status === "pending" ? "bg-amber-50" : approval.status === "approved" ? "bg-emerald-50" : "bg-red-50"}`}>
              {statusIcon}
            </div>
            <span className="text-lg font-extrabold text-slate-900 capitalize tracking-tight group-hover:text-emerald-600 transition-colors">
              {approval.kind.replace(/_/g, " ")}
            </span>
            <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm border ${approval.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-100" : approval.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}`}>
              {approval.status}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 font-medium ml-11">
            <span className="flex items-center gap-1.5 capitalize text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded-md text-xs">
              {approval.entity_type}
            </span>
            <span>{formatDate(approval.created_at)}</span>
            {approval.requester && (
              <span className="text-slate-400 border-l border-slate-200 pl-4">
                Requested by <span className="text-slate-700">{approval.requester.full_name}</span>
              </span>
            )}
            {approval.decider && approval.decided_at && (
              <span className="text-slate-400 border-l border-slate-200 pl-4">
                Decided by <span className="text-slate-700">{approval.decider.full_name}</span> on {formatDate(approval.decided_at)}
              </span>
            )}
          </div>
        </div>
        
        {approval.amount != null && (
          <div className="flex flex-col items-start sm:items-end sm:ml-auto pl-11 sm:pl-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Amount</span>
            <span className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
              {formatAED(approval.amount)}
            </span>
          </div>
        )}
      </div>

      {approval.reason && (
        <div className="mt-6 ml-0 sm:ml-11 rounded-xl bg-slate-50/80 p-4 border border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Request Reason</p>
          <p className="text-sm font-medium text-slate-700 leading-relaxed">
            {approval.reason}
          </p>
        </div>
      )}

      {approval.decision_note && (
        <div className="mt-4 ml-0 sm:ml-11 rounded-xl bg-emerald-50/50 p-4 border border-emerald-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70 mb-2">Decision Note</p>
          <p className="text-sm font-medium text-emerald-900 leading-relaxed">
            {approval.decision_note}
          </p>
        </div>
      )}

      {pending && approval.status === "pending" && (
        <div className="mt-6 ml-0 sm:ml-11 flex gap-3 pt-4 border-t border-slate-100">
          <Button
            size="lg"
            className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 font-bold shadow-sm"
            onClick={() => openDecision("approved")}
          >
            <Check className="mr-2 h-4 w-4" />
            Approve Request
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 font-bold shadow-sm px-5"
            onClick={() => openDecision("rejected")}
          >
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>
        </div>
      )}

      <Dialog open={decisionOpen} onOpenChange={(v) => !v && setDecisionOpen(false)}>
        <DialogContent 
          className="max-w-md overflow-hidden p-0 border-0 rounded-[1.5rem] shadow-2xl"
          closeClassName="text-slate-300 hover:text-white hover:bg-slate-800/50"
        >
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4 sm:p-5 text-white relative overflow-hidden">
            <div className={`absolute -right-20 -top-20 h-48 w-48 rounded-full blur-3xl mix-blend-overlay pointer-events-none ${decision === "approved" ? "bg-emerald-500/20" : "bg-red-500/20"}`}></div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {decision === "approved" ? "Approve Request" : "Reject Request"}
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-4 sm:p-5 space-y-6 bg-white">
            <div className="space-y-2.5">
              <Label htmlFor="decision_note" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Note (optional)</Label>
              <Textarea
                id="decision_note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Add a note or reason for this decision..."
                className="rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20 resize-none"
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setDecisionOpen(false)} className="rounded-full px-6 font-medium shadow-sm">
                Cancel
              </Button>
              <Button
                className={`rounded-full px-5 font-medium shadow-sm ${decision === "approved" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}
                onClick={handleDecide}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm {decision === "approved" ? "Approval" : "Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
