"use client";

import { useMemo, useState, useTransition, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStatusColor } from "@/lib/status-colors";
import { formatAED } from "@/lib/money";
import { formatDate, timeAgo } from "@/lib/dates";
import { LeadContextPanel } from "@/components/crm/lead-context-panel";
import { DealDocumentsSection } from "@/components/pipeline/deal-documents-section";
import { DealTransactionForm } from "@/components/pipeline/deal-transaction-form";
import { DealShortlist, type DealPropertyRow } from "@/components/pipeline/deal-shortlist";
import { ViewingPanel, type ViewingRow, type InventoryChoice } from "@/components/crm/viewing-panel";
import { MatchPanel } from "@/components/crm/match-panel";
import type { InventoryMatch } from "@/lib/match-inventory";
import type { LeadContext } from "@/lib/lead-flow";
import { dealReadyToFinalize, formatPropertyLine } from "@/lib/deal-transaction";
import {
  DEAL_PIPELINE_STAGES,
  dealStageLabel,
  isDealClosed,
  isDealLost,
  normalizeDealStage,
} from "@/lib/deal-stages";
import { canManageCrm } from "@/lib/permissions";
import type { DocCategoryChoice } from "@/lib/lead-field-options";
import { updateDealStage, addDealActivity } from "@/server/deals";
import { toast } from "sonner";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  UserCog,
  Activity,
  Loader2,
  ExternalLink,
  Briefcase,
  Home,
  Tag,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const STAGES = DEAL_PIPELINE_STAGES;

const ACTIVITY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  note: Activity,
  call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  meeting: UserCog,
  viewing: Home,
  assignment: UserCog,
  stage_change: Tag,
  created: Briefcase,
  won: CheckCircle2,
  closed: CheckCircle2,
  lost: XCircle,
};

type Deal = {
  id: string;
  title: string;
  customer_id: string | null;
  deal_type: string;
  stage: string;
  value: number;
  commission_amount: number | null;
  commission_rate: number | null;
  assigned_to: string | null;
  expected_close_date: string | null;
  lost_reason: string | null;
  stage_changed_at: string | null;
  ejari_no: string | null;
  lead_id: string | null;
  lead_context: LeadContext | null;
  finalized_at: string | null;
  property_title: string | null;
  property_community: string | null;
  property_building: string | null;
  property_unit: string | null;
  property_ref: string | null;
  payment_method: string | null;
  payment_deposit: number | null;
  payment_balance: number | null;
  payment_notes: string | null;
  kyc_nationality: string | null;
  kyc_emirates_id: string | null;
  kyc_passport_no: string | null;
  kyc_trn: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  buyer_email: string | null;
  created_at: string;
  updated_at: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    nationality: string | null;
    status: string;
    lead_id: string | null;
    assigned_to_profile: { id: string; full_name: string } | null;
  } | null;
  assigned_to_profile: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    role: string;
  } | null;
  lead: {
    id: string;
    name: string;
    source: string;
    interest: string;
    score: number | null;
    status: string;
    phone: string | null;
    email: string | null;
  } | null;
};

type DealActivity = {
  id: string;
  type: string;
  summary: string | null;
  occurred_at: string;
  created_by: string | null;
  created_by_profile: { id: string; full_name: string } | null;
};

export function DealDetail({
  deal,
  activities,
  agents,
  documents,
  docCategories = [],
  viewings,
  inventory,
  shortlist,
  matches = [],
  userRole,
  userId,
}: {
  deal: Deal;
  activities: DealActivity[];
  agents: { id: string; full_name: string; role: string }[];
  documents: {
    id: string;
    name: string;
    storage_path: string;
    mime_type: string;
    category: string;
    expiry_date: string | null;
    notes: string | null;
    created_at: string;
  }[];
  docCategories?: DocCategoryChoice[];
  viewings: ViewingRow[];
  inventory: InventoryChoice[];
  shortlist: DealPropertyRow[];
  matches?: InventoryMatch[];
  userRole: string;
  userId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [activityText, setActivityText] = useState("");
  const [activityType, setActivityType] = useState("note");
  const [lostOpen, setLostOpen] = useState(false);
  const [closedOpen, setClosedOpen] = useState(false);
  const [closedCommission, setClosedCommission] = useState(
    deal.commission_amount ? String(deal.commission_amount / 100) : ""
  );
  const [lostReason, setLostReason] = useState("");

  const colors = getStatusColor(normalizeDealStage(deal.stage));
  const canManage = canManageCrm(userRole);
  const canEdit = canManage || deal.assigned_to === userId;
  const currentStageKey = normalizeDealStage(deal.stage);
  const currentStageIdx = STAGES.findIndex((s) => s.key === currentStageKey);

  const agentOptions = useMemo(() => {
    const list = [...agents];
    if (
      deal.assigned_to &&
      deal.assigned_to_profile &&
      !list.some((a) => a.id === deal.assigned_to)
    ) {
      list.unshift({
        id: deal.assigned_to,
        full_name: deal.assigned_to_profile.full_name,
        role: deal.assigned_to_profile.role,
      });
    }
    return list;
  }, [agents, deal.assigned_to, deal.assigned_to_profile]);

  const finalizeReadiness = dealReadyToFinalize(deal, documents);

  function handleStageChange(newStage: string) {
    if (newStage === currentStageKey) return;
    if (newStage === "lost") {
      setLostOpen(true);
      return;
    }
    if (newStage === "closed") {
      setClosedOpen(true);
      return;
    }
    toast.success(`Deal moved to ${STAGES.find((s) => s.key === newStage)?.label}`);
    startTransition(async () => {
      const result = await updateDealStage({
        id: deal.id,
        stage: newStage as "new" | "negotiations" | "contract" | "closed" | "lost",
      });
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function confirmClosed() {
    startTransition(async () => {
      const result = await updateDealStage({
        id: deal.id,
        stage: "closed",
        value: deal.value ? deal.value / 100 : undefined,
        commission_amount: closedCommission ? Number(closedCommission) : undefined,
      });
      if (result.ok) {
        toast.success("Deal closed — customer created");
        setClosedOpen(false);
        if (result.data?.customerId) {
          router.push(`/customers/${result.data.customerId}`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.error ?? "Failed to close");
      }
    });
  }

  function confirmLost() {
    if (!lostReason.trim()) {
      toast.error("Lost reason is required");
      return;
    }
    startTransition(async () => {
      const result = await updateDealStage({ id: deal.id, stage: "lost", lost_reason: lostReason.trim() });
      if (result.ok) {
        toast.success("Deal marked as lost");
        setLostOpen(false);
        setLostReason("");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleAddActivity() {
    if (!activityText.trim()) return;
    const text = activityText;
    setActivityText("");
    toast.success("Activity logged");
    startTransition(async () => {
      const result = await addDealActivity(deal.id, activityType, text);
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-[1460px] flex-col gap-[18px]">
      <Link href="/pipeline" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to pipeline
      </Link>

      <section className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="h-0.5 bg-primary" />
        <div className="flex items-start gap-4 p-6">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[10px] border border-border bg-[#EDEBF4] text-[#4C4470]">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Deal</p>
            <h1
              className="font-heading text-[1.85rem] leading-tight text-foreground"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              {deal.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
                {dealStageLabel(deal.stage)}
              </span>
              <span className="text-xs capitalize text-muted-foreground">{deal.deal_type.replace(/_/g, " ")}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-sm font-semibold text-foreground">{formatAED(deal.value)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stage pipeline bar */}
      <div className="overflow-hidden rounded-[14px] border border-border bg-card p-5">
        <div className="-mx-5 -mt-5 mb-4 h-0.5 bg-primary" />
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Deal stage</h3>
          {deal.stage_changed_at && (
            <span className="text-xs text-muted-foreground">Changed {timeAgo(deal.stage_changed_at)}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {STAGES.map((stage) => {
            const stageIdx = STAGES.findIndex((s) => s.key === stage.key);
            const isPast = stageIdx < currentStageIdx;
            const isCurrent = stage.key === currentStageKey;
            const isLost = isDealLost(deal.stage);
            return (
              <div key={stage.key} className="flex flex-1 items-center">
                <button
                  onClick={() => canEdit && handleStageChange(stage.key)}
                  disabled={!canEdit || pending}
                  className={`flex flex-1 flex-col items-center gap-1 ${canEdit ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className={`h-2.5 w-full rounded-full transition-colors ${
                    isLost ? "bg-slate-200" :
                    isCurrent ? stage.color :
                    isPast ? stage.color : "bg-slate-200"
                  } ${isCurrent ? "ring-2 ring-primary/30 ring-offset-1" : ""}`} />
                  <span className={`text-xs ${isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {stage.label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
        {isDealLost(deal.stage) && deal.lost_reason && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <strong>Lost:</strong> {deal.lost_reason}
          </div>
        )}
        {canEdit && !isDealClosed(deal.stage) && !isDealLost(deal.stage) && (
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/5" onClick={() => setClosedOpen(true)} disabled={pending}>
              <CheckCircle2 className="mr-1 h-4 w-4" /> Mark closed
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStageChange("lost")} disabled={pending}>
              <XCircle className="mr-1 h-4 w-4" /> Mark lost
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <DealTransactionForm
            deal={deal}
            canEdit={canEdit}
            canManage={canManage}
            agents={agentOptions}
            documents={documents}
          />

          <MatchPanel matches={matches} dealId={deal.id} canEdit={canEdit} />

          <DealShortlist dealId={deal.id} items={shortlist} properties={inventory} canEdit={canEdit} />

          <ViewingPanel
            leadId={deal.lead_id}
            dealId={deal.id}
            viewings={viewings}
            properties={inventory}
            agents={agents}
            defaultAgentId={deal.assigned_to}
            canEdit={canEdit}
          />

          <div className="overflow-hidden rounded-[14px] border border-border bg-card p-5">
            <div className="-mx-5 -mt-5 mb-4 h-0.5 bg-primary" />
            <h2 className="mb-4 text-sm font-semibold text-foreground">Activity timeline</h2>
            {canEdit && (
              <div className="mb-4 flex gap-2">
                <Select value={activityType} onValueChange={(v) => setActivityType(v ?? "note")}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="viewing">Viewing</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Log activity..."
                  value={activityText}
                  onChange={(e) => setActivityText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddActivity()}
                />
                <Button size="sm" onClick={handleAddActivity} disabled={pending || !activityText.trim()}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                activities.map((act) => {
                  const Icon = ACTIVITY_ICONS[act.type] ?? Activity;
                  return (
                    <div key={act.id} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground">{act.summary}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {act.created_by_profile?.full_name ?? "System"} · {timeAgo(act.occurred_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {deal.customer ? (
            <div className="overflow-hidden rounded-[14px] border border-border bg-[#1B2430] p-4 text-[#E8E4DC]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Customer</h2>
                <Link href={`/customers/${deal.customer.id}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  Profile <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <p className="font-medium">{deal.customer.name}</p>
              <span className="mt-1 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize">
                {deal.customer.status}
              </span>
            </div>
          ) : null}

          <LeadContextPanel
            context={deal.lead_context}
            leadHref={deal.lead_id ? `/leads/${deal.lead_id}` : deal.lead ? `/leads/${deal.lead.id}` : undefined}
            variant="compact"
          />

          <DealDocumentsSection
            dealId={deal.id}
            initialDocuments={documents.map((doc) => ({
              id: doc.id,
              name: doc.name,
              storage_path: doc.storage_path,
              mime_type: doc.mime_type,
              category: doc.category,
              expiry_date: doc.expiry_date,
              notes: doc.notes,
              created_at: doc.created_at,
            }))}
            categories={docCategories}
            canEdit={canEdit && !deal.finalized_at}
          />
        </div>
      </div>

      <Dialog open={closedOpen} onOpenChange={setClosedOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Close deal?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This marks the deal as <strong>closed</strong> and activates the linked person record with the
            property, documents, and agent commission.
          </p>
          {!finalizeReadiness.ok && (
            <p className="rounded-[8px] bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Still needed: {finalizeReadiness.missing.join(", ")}. Update the sections above first.
            </p>
          )}
          <dl className="space-y-2 rounded-[10px] border border-border bg-muted/30 p-3 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Property</dt>
              <dd className="text-right font-medium">{deal.property_title ? formatPropertyLine(deal) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Buyer</dt>
              <dd className="font-medium">{deal.buyer_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Value</dt>
              <dd className="font-medium">{formatAED(deal.value)}</dd>
            </div>
          </dl>
          <div className="space-y-1.5">
            <Label htmlFor="closed-commission">Agent commission (AED)</Label>
            <Input
              id="closed-commission"
              type="number"
              min={0}
              value={closedCommission}
              onChange={(e) => setClosedCommission(e.target.value)}
              placeholder="Optional — saved on the customer transaction"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setClosedOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={pending || !finalizeReadiness.ok} onClick={confirmClosed}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, create customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lostOpen} onOpenChange={setLostOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark deal lost</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="lost-reason">Reason</Label>
            <Textarea id="lost-reason" value={lostReason} onChange={(e) => setLostReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setLostOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={pending || !lostReason.trim()} onClick={confirmLost}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
