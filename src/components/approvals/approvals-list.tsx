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
        <div className="flex gap-2">
          <button
            onClick={() => switchTab("inbox")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === "inbox" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
          >
            Inbox ({pendingApprovals.length})
          </button>
          <button
            onClick={() => switchTab("mine")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === "mine" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
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
    <div className="space-y-3">
      {approvals.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-slate-200">
          <Clock className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-400">No pending approvals.</p>
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
    <div className="space-y-3">
      {requests.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-slate-200">
          <Clock className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-400">No approval requests submitted.</p>
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
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {statusIcon}
            <span className="text-sm font-semibold text-slate-900 capitalize">
              {approval.kind.replace(/_/g, " ")}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${approval.status === "pending" ? "bg-amber-50 text-amber-700" : approval.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {approval.status}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {approval.entity_type} · {formatDate(approval.created_at)}
          </p>
          {approval.requester && (
            <p className="text-xs text-slate-400">
              Requested by {approval.requester.full_name}
            </p>
          )}
          {approval.decider && approval.decided_at && (
            <p className="text-xs text-slate-400">
              Decided by {approval.decider.full_name} · {formatDate(approval.decided_at)}
            </p>
          )}
        </div>
        {approval.amount != null && (
          <p className="text-lg font-bold text-slate-900">{formatAED(approval.amount)}</p>
        )}
      </div>

      {approval.reason && (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          {approval.reason}
        </p>
      )}

      {approval.decision_note && (
        <p className="mt-2 text-xs text-slate-500">
          Note: {approval.decision_note}
        </p>
      )}

      {pending && approval.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-600"
            onClick={() => openDecision("approved")}
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => openDecision("rejected")}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      )}

      <Dialog open={decisionOpen} onOpenChange={(v) => !v && setDecisionOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {decision === "approved" ? "Approve" : "Reject"} this request?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="decision_note">Note (optional)</Label>
              <Textarea
                id="decision_note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Add a note..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDecisionOpen(false)}>
                Cancel
              </Button>
              <Button
                className={decision === "approved" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}
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
