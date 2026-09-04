"use client";

import { useMemo, useState, useTransition, useEffect, type ComponentType } from "react";
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
import { FollowUpPanel } from "@/components/crm/follow-up-panel";
import { DealTransactionForm } from "@/components/pipeline/deal-transaction-form";
import {
  DealPropertyClientPanel,
  type DealClientProfile,
  type DealConfirmedProperty,
} from "@/components/pipeline/deal-property-client-panel";
import { PersonDocumentsKycSection } from "@/components/crm/person-documents-kyc-section";
import { DealShortlist, type DealPropertyRow } from "@/components/pipeline/deal-shortlist";
import { ViewingPanel, type ViewingRow, type InventoryChoice } from "@/components/crm/viewing-panel";
import { MatchPanel } from "@/components/crm/match-panel";
import type { InventoryMatch } from "@/lib/match-inventory";
import type { LeadContext } from "@/lib/lead-flow";
import { dealReadyToFinalize, formatPropertyLine, PAYMENT_METHODS } from "@/lib/deal-transaction";
import { formatPropertyType, propertyLabel } from "@/lib/inventory";
import { personKycReadiness } from "@/lib/kyc";
import {
  DEAL_PIPELINE_STAGES,
  dealStageLabel,
  isDealClosed,
  isDealLost,
  normalizeDealStage,
} from "@/lib/deal-stages";
import { canManageCrm } from "@/lib/permissions";
import type { DocCategoryChoice } from "@/lib/lead-field-options";
import type { KycPersonRecord } from "@/lib/kyc-form";
import type { LeadDocument } from "@/components/leads/lead-documents";
import { updateDealStage, addDealActivity, assignDeal } from "@/server/deals";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  MessageCircle,
  UserCog,
  Activity,
  Loader2,
  Briefcase,
  Home,
  Tag,
  CheckCircle2,
  XCircle,
  User,
  Building2,
  FolderOpen,
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
  property_id: string | null;
  property_title: string | null;
  property_community: string | null;
  property_building: string | null;
  property_unit: string | null;
  property_ref: string | null;
  property_type: string | null;
  agency_commission_amount: number | null;
  agency_commission_rate: number | null;
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
    emirates_id?: string | null;
    passport_no?: string | null;
    trn?: string | null;
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
  mergedDocuments = documents,
  docCategories = [],
  kycPerson = null,
  personCustomerId = null,
  confirmedProperty = null,
  viewings,
  inventory,
  shortlist,
  matches = [],
  userRole,
  userId,
  leadFollowUp,
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
    property_id?: string | null;
  }[];
  mergedDocuments?: LeadDocument[];
  docCategories?: DocCategoryChoice[];
  kycPerson?: KycPersonRecord | null;
  personCustomerId?: string | null;
  confirmedProperty?: DealConfirmedProperty | null;
  viewings: ViewingRow[];
  inventory: InventoryChoice[];
  shortlist: DealPropertyRow[];
  matches?: InventoryMatch[];
  userRole: string;
  userId: string;
  leadFollowUp?: {
    leadId: string;
    leadName: string;
    nextFollowUpAt: string | null;
    scheduledNotes: string | null;
  } | null;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [activityText, setActivityText] = useState("");
  const [activityType, setActivityType] = useState("note");
  const [lostOpen, setLostOpen] = useState(false);
  const [closedOpen, setClosedOpen] = useState(false);
  const [closedAgentCommission, setClosedAgentCommission] = useState("");
  const [closedAgencyCommission, setClosedAgencyCommission] = useState("");
  const [lostReason, setLostReason] = useState("");

  useEffect(() => {
    if (!closedOpen) return;
    setClosedAgentCommission(deal.commission_amount ? String(deal.commission_amount / 100) : "");
    setClosedAgencyCommission(deal.agency_commission_amount ? String(deal.agency_commission_amount / 100) : "");
  }, [closedOpen, deal.commission_amount, deal.agency_commission_amount]);

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

  const finalizePerson = {
    name: deal.customer?.name ?? deal.lead?.name ?? null,
    nationality: deal.customer?.nationality ?? null,
    emirates_id: deal.customer?.emirates_id ?? null,
    passport_no: deal.customer?.passport_no ?? null,
    trn: deal.customer?.trn ?? null,
  };

  const finalizeReadiness = dealReadyToFinalize(deal, mergedDocuments, finalizePerson);
  const clientKyc = personKycReadiness(
    {
      nationality: deal.customer?.nationality ?? deal.kyc_nationality,
      emirates_id: deal.customer?.emirates_id ?? deal.kyc_emirates_id,
      passport_no: deal.customer?.passport_no ?? deal.kyc_passport_no,
      trn: deal.customer?.trn ?? deal.kyc_trn,
    },
    mergedDocuments
  );

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
    startTransition(async () => {
      const result = await updateDealStage({
        id: deal.id,
        stage: newStage as "new" | "negotiations" | "contract" | "closed" | "lost",
      });
      if (result.ok) {
        toast.success(`Deal moved to ${STAGES.find((s) => s.key === newStage)?.label}`);
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
        commission_amount: closedAgentCommission.trim() ? Number(closedAgentCommission) : undefined,
        agency_commission_amount: closedAgencyCommission.trim() ? Number(closedAgencyCommission) : undefined,
      });
      if (result.ok) {
        toast.success("Deal closed — client record updated");
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
    startTransition(async () => {
      const result = await addDealActivity(deal.id, activityType, text);
      if (result.ok) {
        toast.success("Activity logged");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-[1460px] flex-col gap-[18px]">
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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[0.82rem] font-semibold ${colors.bg} ${colors.text}`}
              >
                {dealStageLabel(deal.stage)}
              </span>
              <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-[0.82rem] font-semibold capitalize text-white">
                {deal.deal_type.replace(/_/g, " ")}
              </span>
              <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-[0.88rem] font-semibold tabular-nums text-white">
                {formatAED(deal.value)}
              </span>
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

      <PersonDocumentsKycSection
        uploadEntityType="deal"
        uploadEntityId={deal.id}
        customerId={personCustomerId ?? deal.customer?.id}
        leadId={deal.lead_id}
        customerHref={deal.customer ? `/customers/${deal.customer.id}` : undefined}
        person={kycPerson}
        documents={mergedDocuments.map((doc) => ({
          id: doc.id,
          name: doc.name,
          storage_path: doc.storage_path,
          mime_type: doc.mime_type,
          category: doc.category,
          expiry_date: doc.expiry_date ?? null,
          notes: doc.notes ?? null,
          created_at: doc.created_at,
          property_id: doc.property_id ?? null,
        }))}
        categories={docCategories}
        canEdit={canEdit && !deal.finalized_at}
        propertyChoices={
          confirmedProperty
            ? [{ id: confirmedProperty.id, label: propertyLabel(confirmedProperty) }]
            : []
        }
        defaultPropertyId={confirmedProperty?.id ?? deal.property_id ?? null}
        sourcesHint="Includes files from the linked lead, person profile, confirmed property, and this deal. New uploads here attach to the deal."
        overview={
      <div className="space-y-4">
        <DealPropertyClientPanel
          dealId={deal.id}
          property={confirmedProperty}
          inventory={inventory}
          client={
            deal.customer
              ? ({
                  id: deal.customer.id,
                  name: deal.customer.name,
                  phone: deal.customer.phone,
                  email: deal.customer.email,
                  nationality: deal.customer.nationality,
                  status: deal.customer.status,
                  emirates_id: deal.customer.emirates_id ?? null,
                  passport_no: deal.customer.passport_no ?? null,
                  trn: deal.customer.trn ?? null,
                } satisfies DealClientProfile)
              : null
          }
          fallbackBuyer={{
            name: deal.buyer_name,
            phone: deal.buyer_phone,
            email: deal.buyer_email,
            nationality: deal.kyc_nationality,
            emirates_id: deal.kyc_emirates_id,
            passport_no: deal.kyc_passport_no,
            trn: deal.kyc_trn,
          }}
          ejariNo={deal.ejari_no}
          kycStatus={clientKyc.status}
          canEdit={canEdit && !deal.finalized_at}
        />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <DealTransactionForm
            deal={deal}
            canEdit={canEdit}
            canManage={canManage}
            agents={agentOptions}
            documents={mergedDocuments}
            person={finalizePerson}
          />

          <MatchPanel matches={matches} dealId={deal.id} canEdit={canEdit} />

          <DealShortlist dealId={deal.id} items={shortlist} properties={inventory} canEdit={canEdit} />

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
          <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/40 px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">Assigned agent</h2>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#EDEBF4] font-heading text-[0.78rem] text-secondary"
                  style={{ fontFamily: "var(--font-display), serif" }}
                >
                  {deal.assigned_to_profile
                    ? deal.assigned_to_profile.full_name
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase() ?? "")
                        .join("") || "—"
                    : "—"}
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <b className="block truncate text-[0.9rem] font-semibold text-foreground">
                    {deal.assigned_to_profile?.full_name ?? "Unassigned"}
                  </b>
                  <span className="text-[0.72rem] capitalize text-muted-foreground">
                    {deal.assigned_to_profile?.role ?? "No agent yet"}
                  </span>
                </div>
              </div>
              {canManage ? (
                <div className="mt-3">
                  <Select
                    value={deal.assigned_to ?? "unassigned"}
                    onValueChange={(v) => {
                      const next = v === "unassigned" ? null : v ?? null;
                      startTransition(async () => {
                        const result = await assignDeal(deal.id, next);
                        if (result.ok) {
                          toast.success(next ? "Agent assigned" : "Agent cleared");
                          router.refresh();
                        } else {
                          toast.error(result.error ?? "Could not assign");
                        }
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 w-full text-[0.78rem]">
                      <SelectValue placeholder="Reassign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {agentOptions.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          </div>

          {leadFollowUp ? (
            <FollowUpPanel
              leadId={leadFollowUp.leadId}
              leadName={leadFollowUp.leadName}
              nextFollowUpAt={leadFollowUp.nextFollowUpAt}
              scheduledNotes={leadFollowUp.scheduledNotes}
              canEdit={canEdit}
            />
          ) : deal.lead_id ? (
            <FollowUpPanel
              leadId={deal.lead_id}
              leadName={deal.lead?.name ?? "Lead"}
              nextFollowUpAt={null}
              scheduledNotes={null}
              canEdit={canEdit}
            />
          ) : null}

          <ViewingPanel
            leadId={deal.lead_id}
            dealId={deal.id}
            viewings={viewings}
            properties={inventory}
            agents={agents}
            defaultAgentId={deal.assigned_to}
            canEdit={canEdit}
          />

          <LeadContextPanel
            context={deal.lead_context}
            leadHref={deal.lead_id ? `/leads/${deal.lead_id}` : deal.lead ? `/leads/${deal.lead.id}` : undefined}
            variant="compact"
          />
        </div>
      </div>
      </div>
        }
      />

      <Dialog open={closedOpen} onOpenChange={setClosedOpen}>
        <DialogContent className="max-w-2xl gap-0 p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Close deal?</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Marks this deal <strong>closed</strong> and creates the long-term records below.
            </p>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            {!finalizeReadiness.ok && (
              <p className="rounded-[8px] bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Still needed: {finalizeReadiness.missing.join(", ")}. Complete Payment and Documents first.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <CloseOutcomeCard
                icon={User}
                title="Owner"
                description="Customer profile activated (or created) with buyer + KYC details."
                detail={deal.buyer_name ?? deal.customer?.name ?? "—"}
              />
              <CloseOutcomeCard
                icon={Building2}
                title="Property"
                description="Company property record under Properties, linked to this deal."
                detail={deal.property_title ? formatPropertyLine(deal) : "—"}
              />
              <CloseOutcomeCard
                icon={FolderOpen}
                title="Documents"
                description="Pipeline files copied onto the owner profile."
                detail="Lead + deal docs"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 rounded-[10px] border border-border bg-muted/30 p-3 text-sm">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-primary">Deal summary</p>
                <CloseSummaryRow label="Property" value={deal.property_title ? formatPropertyLine(deal) : "—"} />
                {deal.property_type ? (
                  <CloseSummaryRow label="Type" value={formatPropertyType(deal.property_type)} />
                ) : null}
                <CloseSummaryRow label="Owner / buyer" value={deal.buyer_name ?? deal.customer?.name ?? "—"} />
                <CloseSummaryRow label="Deal value" value={formatAED(deal.value)} />
                {deal.payment_method ? (
                  <CloseSummaryRow
                    label="Payment"
                    value={
                      PAYMENT_METHODS.find((m) => m.value === deal.payment_method)?.label ?? deal.payment_method
                    }
                  />
                ) : null}
                {deal.assigned_to_profile ? (
                  <CloseSummaryRow label="Agent" value={deal.assigned_to_profile.full_name} />
                ) : null}
              </div>

              <div className="space-y-3 rounded-[10px] border border-border p-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-primary">Commission</p>
                <p className="text-xs text-muted-foreground">
                  Pre-filled from Payment. Adjust before closing — saved on the property record.
                </p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="closed-agency-commission">Agency commission (AED)</Label>
                    <Input
                      id="closed-agency-commission"
                      type="number"
                      min={0}
                      value={closedAgencyCommission}
                      onChange={(e) => setClosedAgencyCommission(e.target.value)}
                      placeholder={
                        deal.agency_commission_rate != null && deal.value > 0
                          ? `Est. ${Math.round((deal.value * deal.agency_commission_rate) / 10000)}`
                          : "Optional"
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="closed-agent-commission">Agent commission (AED)</Label>
                    <Input
                      id="closed-agent-commission"
                      type="number"
                      min={0}
                      value={closedAgentCommission}
                      onChange={(e) => setClosedAgentCommission(e.target.value)}
                      placeholder={
                        deal.commission_rate != null && deal.value > 0
                          ? `Est. ${Math.round((deal.value * deal.commission_rate) / 10000)}`
                          : "Optional"
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border bg-muted/20 px-6 py-3">
            <Button variant="outline" size="sm" onClick={() => setClosedOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={pending || !finalizeReadiness.ok} onClick={confirmClosed}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, close deal
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

function CloseSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/60 py-1.5 last:border-b-0">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function CloseOutcomeCard({
  icon: Icon,
  title,
  description,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  detail: string;
}) {
  return (
    <div className="rounded-[10px] border border-primary/20 bg-primary/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      <p className="mt-2 truncate text-xs font-medium text-foreground" title={detail}>
        {detail}
      </p>
    </div>
  );
}
