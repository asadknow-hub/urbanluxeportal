"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PreferredAreasPicker } from "@/components/leads/preferred-areas-picker";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { whatsappLink } from "@/lib/phone";
import { formatAED } from "@/lib/money";
import { formatDate, timeAgo } from "@/lib/dates";
import { formatLeadInterest, formatLeadTag } from "@/lib/lead-format";
import {
  assignLead,
  scheduleFollowUp,
  addLeadActivity,
  convertLead,
  updateLead,
  updateLeadStage,
  claimLead,
  deleteLead,
} from "@/server/leads";
import { toast } from "sonner";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  PenLine,
  UserPlus,
  XCircle,
  Activity,
  CalendarClock,
  UserCog,
  TrendingUp,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Briefcase,
  Home,
  Tag,
  FileText,
  Trash2,
} from "lucide-react";

type Lead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  interest: string;
  budget_min: number | null;
  budget_max: number | null;
  preferred_areas: string[] | null;
  notes: string | null;
  status: string;
  score: number | null;
  score_reason: string | null;
  assigned_to: string | null;
  next_follow_up_at: string | null;
  converted_customer_id: string | null;
  converted_deal_id: string | null;
  created_at: string;
  updated_at: string;
  stage_id: string | null;
  language: string | null;
  financing: string | null;
  timeframe: string | null;
  purpose: string | null;
  bedrooms: string | null;
  category: string | null;
  tags: string[];
  custom: Record<string, unknown>;
  assigned_to_profile: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    role: string;
    email: string | null;
    phone: string | null;
  } | null;
  created_by_profile: { id: string; full_name: string } | null;
};

type DuplicateLead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  stage_id: string | null;
  updated_at: string;
  assigned_to: string | null;
};

type LeadActivity = {
  id: string;
  type: string;
  summary: string | null;
  occurred_at: string;
  created_by: string | null;
  author: { id: string; full_name: string } | null;
};

type Agent = { id: string; full_name: string; role: string };

type FieldDef = {
  id: string;
  entity: string;
  key: string;
  label: string;
  type: string;
  options: Array<{ value: string; label: string }> | null;
  required: boolean;
  show_on_card: boolean;
  show_in_list: boolean;
  group_name: string | null;
  sort: number;
  is_active: boolean;
};

type InlineEditState =
  | {
      key: string;
      label: string;
      kind: "text" | "number" | "money" | "textarea" | "select" | "checkbox";
      value: string;
      options?: Array<{ value: string; label: string }> | null;
      custom?: boolean;
    }
  | {
      key: string;
      label: string;
      kind: "areas" | "tags";
      value: string[];
      custom?: boolean;
    };

// Format any DB string into a readable label (e.g. "property_finder" → "Property Finder")
// No hardcoded labels — everything is derived dynamically from the data.
function formatLabel(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function mixHexWithWhite(hex: string, colorWeight: number): string {
  const cleaned = hex.replace("#", "").trim();
  const normalized = cleaned.length === 3
    ? cleaned.split("").map((ch) => ch + ch).join("")
    : cleaned;
  const parsed = Number.parseInt(normalized, 16);

  if (Number.isNaN(parsed)) return hex;

  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;
  const mix = (channel: number) => Math.round(255 * (1 - colorWeight) + channel * colorWeight);

  return `rgb(${mix(r)} ${mix(g)} ${mix(b)})`;
}

const WORKFLOW_STAGE_COLORS = [
  "#4fcfe5",
  "#3ed2c2",
  "#38bdf8",
  "#a78bfa",
  "#f59e0b",
  "#fb7185",
  "#f97316",
  "#94a3b8",
];

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  note: Activity,
  call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  meeting: UserCog,
  viewing: Home,
  assignment: UserCog,
  status_change: Tag,
  follow_up_scheduled: CalendarClock,
  converted: CheckCircle2,
};

export function LeadDetail({
  lead,
  activities,
  agents,
  stages,
  fieldDefs,
  customer,
  deal,
  documents,
  lostReasons,
  duplicateMatches,
  userRole,
  userId,
}: {
  lead: Lead;
  activities: LeadActivity[];
  agents: Agent[];
  stages: { id: string; name: string; color: string; kind: string; sort: number; helper_text: string | null }[];
  fieldDefs: FieldDef[];
  customer: { id: string; name: string; phone: string | null; email: string | null } | null;
  deal: { id: string; title: string; stage: string; value: number; deal_type: string } | null;
  documents: { id: string; file_name: string; file_url: string; file_type: string; created_at: string }[];
  lostReasons: Record<string, string[]>;
  duplicateMatches: DuplicateLead[];
  userRole: string;
  userId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // ─── Optimistic state ─────────────────────────────────────
  // These mirror the server-side lead data but allow instant UI updates.
  // When an action is triggered, we update local state immediately,
  // then fire the server action in the background.
  // router.refresh() is called WITHOUT awaiting so the UI never blocks.
  const [optimisticLead, setOptimisticLead] = useState(lead);
  const [optimisticActivities, setOptimisticActivities] = useState(activities);
  const [activityText, setActivityText] = useState("");
  const [activityType, setActivityType] = useState("note");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [inlineEdit, setInlineEdit] = useState<InlineEditState | null>(null);
  const [converting, setConverting] = useState(false);
  const [reasonDialog, setReasonDialog] = useState<{ stageId: string; stageName: string; kind: string } | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentStage = stages.find((s) => s.id === optimisticLead.stage_id) ?? null;
  const waLink = whatsappLink(optimisticLead.phone);
  const mailLink = optimisticLead.email ? `mailto:${optimisticLead.email}` : null;
  const phoneLink = optimisticLead.phone ? `tel:${optimisticLead.phone}` : null;
  const canManage = userRole === "admin" || userRole === "manager";
  const canEdit = canManage || optimisticLead.assigned_to === userId;
  const initials = optimisticLead.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const lastTouchAt = optimisticActivities[0]?.occurred_at ?? optimisticLead.updated_at;
  const workflowStages = stages;

  function startInlineEdit(next: InlineEditState) {
    setInlineEdit(next);
  }

  function cancelInlineEdit() {
    setInlineEdit(null);
  }

  function setInlineEditValue(nextValue: string | string[]) {
    setInlineEdit((prev) => (prev ? ({ ...prev, value: nextValue } as InlineEditState) : prev));
  }

  function handleInlineSave() {
    if (!inlineEdit) return;

    const updatePayload: Record<string, unknown> = {};
    const nextCustom = { ...(optimisticLead.custom ?? {}) };
    const nextLeadState: Partial<Lead> = { updated_at: new Date().toISOString() };

    if (inlineEdit.kind === "areas") {
      const areas = inlineEdit.value.map((item) => item.trim()).filter(Boolean);
      updatePayload.preferred_areas = areas;
      nextLeadState.preferred_areas = areas;
    } else if (inlineEdit.kind === "tags") {
      const tags = inlineEdit.value.map((item) => item.trim()).filter(Boolean);
      if (inlineEdit.custom) {
        if (tags.length > 0) nextCustom[inlineEdit.key] = tags;
        else delete nextCustom[inlineEdit.key];
        updatePayload.custom = nextCustom;
      } else {
        updatePayload.tags = tags;
        nextLeadState.tags = tags;
      }
    } else if (inlineEdit.kind === "money") {
      const money = inlineEdit.value.trim() ? Math.round(Number(inlineEdit.value) * 100) : null;
      if (inlineEdit.custom) {
        if (money === null) delete nextCustom[inlineEdit.key];
        else nextCustom[inlineEdit.key] = money;
        updatePayload.custom = nextCustom;
      } else {
        updatePayload[inlineEdit.key] = money;
        (nextLeadState as Record<string, unknown>)[inlineEdit.key] = money;
      }
    } else if (inlineEdit.kind === "number") {
      const numeric = inlineEdit.value.trim() ? Number(inlineEdit.value) : null;
      if (inlineEdit.custom) {
        if (numeric === null) delete nextCustom[inlineEdit.key];
        else nextCustom[inlineEdit.key] = numeric;
        updatePayload.custom = nextCustom;
      } else {
        updatePayload[inlineEdit.key] = numeric;
        (nextLeadState as Record<string, unknown>)[inlineEdit.key] = numeric;
      }
    } else if (inlineEdit.kind === "checkbox") {
      const checked = inlineEdit.value === "true";
      if (inlineEdit.custom) {
        nextCustom[inlineEdit.key] = checked;
        updatePayload.custom = nextCustom;
      } else {
        updatePayload[inlineEdit.key] = checked;
        (nextLeadState as Record<string, unknown>)[inlineEdit.key] = checked;
      }
    } else {
      const nextValue = typeof inlineEdit.value === "string" ? inlineEdit.value.trim() : "";
      if (inlineEdit.custom) {
        if (nextValue) nextCustom[inlineEdit.key] = nextValue;
        else delete nextCustom[inlineEdit.key];
        updatePayload.custom = nextCustom;
      } else {
        updatePayload[inlineEdit.key] = nextValue || null;
        (nextLeadState as Record<string, unknown>)[inlineEdit.key] = nextValue || null;
      }
    }

    setOptimisticLead((prev) => ({
      ...prev,
      ...nextLeadState,
      ...(updatePayload.tags ? { tags: updatePayload.tags as string[] } : {}),
      ...(updatePayload.preferred_areas ? { preferred_areas: updatePayload.preferred_areas as string[] } : {}),
      ...(updatePayload.custom ? { custom: nextCustom } : {}),
    }));

    startTransition(async () => {
      const result = await updateLead(optimisticLead.id, updatePayload as any);
      if (result.ok) {
        toast.success(`${inlineEdit.label} updated`);
        setInlineEdit(null);
        router.refresh();
      } else {
        setOptimisticLead(lead);
        toast.error(result.error ?? "Failed");
      }
    });
  }

  // ─── Optimistic action handlers ──────────────────────────
  // Each handler updates local state IMMEDIATELY for instant feedback,
  // then fires the server action. router.refresh() is non-blocking.

  function handleAssign(agentId: string | null) {
    // Instant UI update
    const agent = agents.find((a) => a.id === agentId);
    setOptimisticLead((prev) => ({
      ...prev,
      assigned_to: agentId,
      assigned_to_profile: agent
        ? { id: agent.id, full_name: agent.full_name, avatar_url: null, role: agent.role, email: null, phone: null }
        : null,
    }));
    startTransition(async () => {
      const result = await assignLead(optimisticLead.id, agentId);
      if (result.ok) {
        toast.success(agentId ? "Lead assigned" : "Lead unassigned");
        router.refresh(); // non-blocking background refresh
      } else {
        // Revert on failure
        setOptimisticLead((prev) => ({ ...prev, assigned_to: lead.assigned_to, assigned_to_profile: lead.assigned_to_profile }));
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleStageChange(stageId: string) {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) return;

    // Lost / Junk stages require a reason — show dialog
    if (stage.kind === "lost" || stage.kind === "junk") {
      setReasonDialog({ stageId, stageName: stage.name, kind: stage.kind });
      setSelectedReason("");
      return;
    }

    // Instant UI update — also map stage kind to legacy status for backward compat
    setOptimisticLead((prev) => ({
      ...prev,
      stage_id: stageId,
      status: stage?.kind === "won" ? "converted"
        : (stage?.kind === "lost" || stage?.kind === "junk") ? "unqualified"
        : prev.status,
    }));
    // Add optimistic activity to timeline
    const optimisticActivity: LeadActivity = {
      id: `optimistic_${Date.now()}`,
      type: "stage_change",
      summary: `Moved to ${stage?.name ?? "new stage"}`,
      occurred_at: new Date().toISOString(),
      created_by: userId,
      author: { id: userId, full_name: "You" },
    };
    setOptimisticActivities((prev) => [optimisticActivity, ...prev]);
    startTransition(async () => {
      const result = await updateLeadStage(optimisticLead.id, stageId);
      if (result.ok) {
        toast.success(`Moved to ${stage?.name ?? "new stage"}`);
        router.refresh();
      } else {
        // Revert on failure
        setOptimisticLead((prev) => ({ ...prev, stage_id: lead.stage_id }));
        setOptimisticActivities((prev) => prev.filter((a) => a.id !== optimisticActivity.id));
        toast.error(result.error ?? "Failed to change stage");
      }
    });
  }

  function handleReasonConfirm() {
    if (!reasonDialog || !selectedReason) return;
    const stage = stages.find((s) => s.id === reasonDialog.stageId);
    // Instant UI update
    setOptimisticLead((prev) => ({
      ...prev,
      stage_id: reasonDialog.stageId,
      status: "unqualified",
    }));
    const optimisticActivity: LeadActivity = {
      id: `optimistic_${Date.now()}`,
      type: "stage_change",
      summary: `Moved to ${reasonDialog.stageName} — ${selectedReason}`,
      occurred_at: new Date().toISOString(),
      created_by: userId,
      author: { id: userId, full_name: "You" },
    };
    setOptimisticActivities((prev) => [optimisticActivity, ...prev]);
    setReasonDialog(null);
    startTransition(async () => {
      const extra: { lost_reason?: string; junk_reason?: string } = {};
      if (reasonDialog.kind === "lost") extra.lost_reason = selectedReason;
      else extra.junk_reason = selectedReason;
      const result = await updateLeadStage(optimisticLead.id, reasonDialog.stageId, extra);
      if (result.ok) {
        toast.success(`Moved to ${stage?.name ?? "new stage"}`);
        router.refresh();
      } else {
        setOptimisticLead((prev) => ({ ...prev, stage_id: lead.stage_id }));
        setOptimisticActivities((prev) => prev.filter((a) => a.id !== optimisticActivity.id));
        toast.error(result.error ?? "Failed to change stage");
      }
      setSelectedReason("");
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteLead(optimisticLead.id);
      if (result.ok) {
        toast.success("Lead deleted");
        router.push("/leads");
      } else {
        toast.error(result.error ?? "Failed to delete lead");
      }
      setShowDeleteConfirm(false);
    });
  }

  function handleClaim() {
    // Instant UI update
    setOptimisticLead((prev) => ({
      ...prev,
      assigned_to: userId,
      assigned_to_profile: { id: userId, full_name: "You", avatar_url: null, role: userRole, email: null, phone: null },
    }));
    startTransition(async () => {
      const result = await claimLead(optimisticLead.id);
      if (result.ok) {
        toast.success("Lead claimed");
        router.refresh();
      } else {
        setOptimisticLead((prev) => ({ ...prev, assigned_to: lead.assigned_to, assigned_to_profile: lead.assigned_to_profile }));
        toast.error(result.error ?? "Failed to claim");
      }
    });
  }

  function handleAddActivity() {
    if (!activityText.trim()) return;
    // Instant UI update — add to timeline immediately
    const newActivity: LeadActivity = {
      id: `optimistic_${Date.now()}`,
      type: activityType,
      summary: activityText,
      occurred_at: new Date().toISOString(),
      created_by: userId,
      author: { id: userId, full_name: "You" },
    };
    setOptimisticActivities((prev) => [newActivity, ...prev]);
    setActivityText("");
    startTransition(async () => {
      const result = await addLeadActivity(optimisticLead.id, activityType, activityText);
      if (result.ok) {
        toast.success("Activity logged");
        router.refresh();
      } else {
        // Revert on failure
        setOptimisticActivities((prev) => prev.filter((a) => a.id !== newActivity.id));
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleScheduleFollowUp() {
    if (!followUpDate) return;
    // Instant UI update
    setOptimisticLead((prev) => ({ ...prev, next_follow_up_at: followUpDate }));
    startTransition(async () => {
      const result = await scheduleFollowUp(optimisticLead.id, followUpDate, followUpNotes || undefined);
      if (result.ok) {
        toast.success("Follow-up scheduled");
        setFollowUpDate("");
        setFollowUpNotes("");
      } else {
        setOptimisticLead((prev) => ({ ...prev, next_follow_up_at: lead.next_follow_up_at }));
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function confirmConvert() {
    startTransition(async () => {
      const result = await convertLead(optimisticLead.id, {});
      if (result.ok) {
        toast.success("Lead converted to pipeline deal");
        setConverting(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Conversion failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative flex flex-col gap-5 rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 pt-10 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur xl:flex-row xl:items-start xl:justify-between">
        <Link
          href="/leads"
          className="absolute left-6 top-4 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition-colors hover:border-slate-300 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Leads
        </Link>

        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{optimisticLead.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              {currentStage && (
                <span
                  className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${currentStage.color}15`,
                    color: currentStage.color,
                  }}
                >
                  {currentStage.name}
                </span>
              )}
              <span className="capitalize">{formatLabel(optimisticLead.source)}</span>
              <span>·</span>
              <span>{formatLeadInterest(optimisticLead.interest)}</span>
              {optimisticLead.score !== null && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Score: {optimisticLead.score}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <div className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 shadow-[0_10px_20px_rgba(15,23,42,0.05)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Last touched</p>
            <p className="text-sm font-semibold text-slate-900">{timeAgo(lastTouchAt)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 shadow-[0_10px_20px_rgba(15,23,42,0.05)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Created</p>
            <p className="text-sm font-semibold text-slate-900">{formatDate(optimisticLead.created_at)}</p>
          </div>
          {phoneLink && (
            <a href={phoneLink} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Phone className="mr-2 h-4 w-4" />
              Call
            </a>
          )}
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </a>
          )}
          {mailLink && (
            <a href={mailLink} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </a>
          )}
          <DocumentUploadDialog triggerLabel="Upload Lead Document" entityType="lead" entityId={optimisticLead.id} />
          {!optimisticLead.assigned_to && canEdit && (
            <Button size="sm" variant="outline" onClick={handleClaim} disabled={pending}>
              <UserPlus className="mr-2 h-4 w-4" />
              Claim
            </Button>
          )}
          {canManage && (
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setShowDeleteConfirm(true)} disabled={pending}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Stage workflow */}
      {stages.length > 0 && (
        <div className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white p-2 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${workflowStages.length}, minmax(0, 1fr))` }}>
            {workflowStages.map((stage, idx) => {
              const currentIdx = workflowStages.findIndex((s) => s.id === optimisticLead.stage_id);
              const isCurrent = idx === currentIdx;
              const isPassed = currentIdx >= 0 && idx < currentIdx;
              const isEditable = canEdit && !pending;
              const stageColor = stage.color || WORKFLOW_STAGE_COLORS[idx % WORKFLOW_STAGE_COLORS.length];
              const softFill = mixHexWithWhite(stageColor, isCurrent ? 0.88 : isPassed ? 0.22 : 0.16);
              const softBorder = mixHexWithWhite(stageColor, 0.42);
              const accentLine = mixHexWithWhite(stageColor, isCurrent ? 1 : 0.78);

              return (
                <button
                  key={stage.id}
                  onClick={() => isEditable && handleStageChange(stage.id)}
                  disabled={!isEditable}
                  className={`relative h-9 min-w-0 overflow-hidden rounded-[0.85rem] px-3 text-left text-[11px] font-medium leading-none transition-all ${
                    isEditable ? "cursor-pointer hover:-translate-y-[1px]" : "cursor-default"
                  } ${isCurrent ? "shadow-[0_10px_18px_rgba(15,23,42,0.10)]" : ""}`}
                  style={{
                    background: isCurrent
                      ? `linear-gradient(180deg, ${stageColor}, ${mixHexWithWhite(stageColor, 0.68)})`
                      : `linear-gradient(180deg, ${softFill}, ${mixHexWithWhite(stageColor, 0.1)})`,
                    border: `1px solid ${softBorder}`,
                    color: isCurrent ? "#ffffff" : "#334155",
                  }}
                >
                  <span className="block truncate pr-6">{stage.name}</span>
                  <span
                    className="absolute inset-x-0 bottom-0 h-[2px]"
                    style={{ backgroundColor: accentLine }}
                  />
                  {isCurrent && <span className="absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white/90" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: details + edit */}
        <div className="space-y-4 lg:col-span-2">
          {/* Contact info */}
          <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Lead Snapshot</h3>
                <p className="text-xs text-slate-400">Tap the pen beside any field to edit it inline.</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50/60 text-sm">
              {[
                { label: "Name", kind: "text" as const, value: optimisticLead.name, key: "name" },
                { label: "Phone", kind: "text" as const, value: optimisticLead.phone ?? "", key: "phone" },
                { label: "Email", kind: "text" as const, value: optimisticLead.email ?? "", key: "email" },
                { label: "Interest", kind: "text" as const, value: optimisticLead.interest, key: "interest" },
                { label: "Budget Min (AED)", kind: "money" as const, value: optimisticLead.budget_min ? String(optimisticLead.budget_min / 100) : "", key: "budget_min" },
                { label: "Budget Max (AED)", kind: "money" as const, value: optimisticLead.budget_max ? String(optimisticLead.budget_max / 100) : "", key: "budget_max" },
                { label: "Preferred Areas", kind: "areas" as const, value: optimisticLead.preferred_areas?.length ? optimisticLead.preferred_areas.join(", ") : "", key: "preferred_areas" },
                { label: "Language", kind: "text" as const, value: optimisticLead.language ?? "", key: "language" },
                { label: "Financing", kind: "text" as const, value: optimisticLead.financing ?? "", key: "financing" },
                { label: "Timeframe", kind: "text" as const, value: optimisticLead.timeframe ?? "", key: "timeframe" },
                { label: "Purpose", kind: "text" as const, value: optimisticLead.purpose ?? "", key: "purpose" },
                { label: "Bedrooms", kind: "text" as const, value: optimisticLead.bedrooms ?? "", key: "bedrooms" },
                { label: "Category", kind: "text" as const, value: optimisticLead.category ?? "", key: "category" },
                { label: "Tags", kind: "tags" as const, value: optimisticLead.tags ?? [], key: "tags" },
                { label: "Notes", kind: "textarea" as const, value: optimisticLead.notes ?? "", key: "notes" },
              ].map((field, index) => {
                const valueText =
                  field.kind === "areas"
                    ? field.value || "—"
                    : field.kind === "tags"
                    ? field.value.length > 0
                      ? field.value.map((tag) => formatLeadTag(tag)).join(", ")
                      : "—"
                    : field.value || "—";

                return (
                  <button
                    key={field.key}
                    type="button"
                    onClick={() =>
                      startInlineEdit(
                        field.kind === "areas"
                          ? { key: field.key, label: field.label, kind: field.kind, value: optimisticLead.preferred_areas ?? [] }
                          : field.kind === "tags"
                          ? { key: field.key, label: field.label, kind: field.kind, value: optimisticLead.tags ?? [] }
                          : { key: field.key, label: field.label, kind: field.kind, value: field.value }
                      )
                    }
                    className={`group flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                      index !== 0 ? "border-t border-slate-100" : ""
                    } ${inlineEdit?.key === field.key ? "bg-emerald-50/50" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{field.label}</span>
                      <span className="mt-0.5 block truncate text-sm font-medium text-slate-800">{valueText}</span>
                    </div>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                        inlineEdit?.key === field.key
                          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                          : "border-slate-200 bg-white text-slate-400 group-hover:border-slate-300 group-hover:text-slate-600"
                      }`}
                      aria-hidden="true"
                    >
                      <PenLine className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}

              {inlineEdit && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Editing field</p>
                      <p className="text-sm font-medium text-slate-900">{inlineEdit.label}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={cancelInlineEdit}>
                      Close
                    </Button>
                  </div>
                  {inlineEdit.kind === "areas" ? (
                    <PreferredAreasPicker
                      value={inlineEdit.value}
                      onChange={(value) => setInlineEditValue(value)}
                      label={inlineEdit.label}
                      description="Search and select the Dubai communities this lead prefers."
                      className="w-full"
                    />
                  ) : inlineEdit.kind === "textarea" ? (
                    <Textarea rows={4} value={inlineEdit.value} onChange={(e) => setInlineEditValue(e.target.value)} />
                  ) : inlineEdit.kind === "select" && inlineEdit.options ? (
                    <Select value={inlineEdit.value || undefined} onValueChange={(v) => setInlineEditValue(v ?? "")}>
                      <SelectTrigger><SelectValue placeholder={`Select ${inlineEdit.label}`} /></SelectTrigger>
                      <SelectContent>
                        {inlineEdit.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : inlineEdit.kind === "checkbox" ? (
                    <Select value={inlineEdit.value || "false"} onValueChange={(v) => setInlineEditValue(v ?? "false")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : inlineEdit.kind === "tags" ? (
                    <Input
                      value={inlineEdit.value.join(", ")}
                      onChange={(e) => setInlineEditValue(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                      placeholder="Comma separated values"
                    />
                  ) : (
                    <Input
                      type={inlineEdit.kind === "number" || inlineEdit.kind === "money" ? "number" : "text"}
                      value={inlineEdit.value}
                      onChange={(e) => setInlineEditValue(e.target.value)}
                      placeholder={inlineEdit.kind === "money" ? "Amount in AED" : inlineEdit.label}
                    />
                  )}
                  <div className="mt-3 flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={cancelInlineEdit}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleInlineSave} disabled={pending}>
                      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity timeline */}
          <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Activity className="h-4 w-4" />
                  Activity Timeline
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Recent actions, calls, notes, and touchpoints stay in one place.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                {optimisticActivities.length} items
              </span>
            </div>

            {/* Quick add activity */}
            {canEdit && (
              <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 lg:flex-row lg:items-center">
                <Select value={activityType} onValueChange={(v) => setActivityType(v ?? "note")}>
                  <SelectTrigger className="w-36 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="viewing">Viewing</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => { setActivityType("call"); setActivityText(`Called ${optimisticLead.phone ?? optimisticLead.name}`); }}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call log
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setActivityType("whatsapp"); setActivityText(`WhatsApped ${optimisticLead.name}`); }}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp log
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setActivityType("email"); setActivityText(`Emailed ${optimisticLead.email ?? optimisticLead.name}`); }}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email log
                  </Button>
                </div>
                <Input
                  placeholder="Log activity..."
                  value={activityText}
                  onChange={(e) => setActivityText(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleAddActivity()}
                />
                <Button size="sm" onClick={handleAddActivity} disabled={pending || !activityText.trim()}>
                  Add
                </Button>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-3">
              {optimisticActivities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-slate-500">No activities yet.</p>
                  <p className="mt-1 text-xs text-slate-400">Log the first call, note, or follow-up to start the trail.</p>
                </div>
              ) : (
                optimisticActivities.map((a) => {
                  const Icon = ACTIVITY_ICONS[a.type] ?? Activity;
                  return (
                    <div key={a.id} className="flex gap-3 rounded-2xl border border-slate-100 bg-gradient-to-r from-white to-slate-50/80 p-3 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
                        <Icon className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-700 capitalize">
                            {a.type.replace(/_/g, " ")}
                            {a.author && (
                              <span className="text-slate-400 font-normal ml-1">· {a.author.full_name}</span>
                            )}
                          </span>
                          <span className="text-xs font-medium text-slate-400">{timeAgo(a.occurred_at)}</span>
                        </div>
                        {a.summary && (
                          <p className="mt-1 text-sm text-slate-600">{a.summary}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column: assignment + actions */}
        <div className="space-y-4">
          {duplicateMatches.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Possible Duplicates</p>
                  <p className="text-xs text-amber-700/80">Matched by email or phone.</p>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                  {duplicateMatches.length}
                </span>
              </div>
              <div className="space-y-2">
                {duplicateMatches.map((dup) => {
                  const dupPhoneLink = dup.phone ? `tel:${dup.phone}` : null;
                  const dupMailLink = dup.email ? `mailto:${dup.email}` : null;
                  const dupWaLink = dup.phone ? whatsappLink(dup.phone) : null;
                  return (
                    <div key={dup.id} className="rounded-xl border border-amber-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link href={`/leads/${dup.id}`} className="font-medium text-slate-900 hover:underline">
                            {dup.name}
                          </Link>
                          <p className="text-xs text-slate-500">Updated {formatDate(dup.updated_at)}</p>
                          <p className="text-xs text-slate-400">
                            {dup.phone ?? "—"} {dup.email ? `· ${dup.email}` : ""}
                          </p>
                        </div>
                        <Link href={`/leads/${dup.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                          Open
                        </Link>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {dupPhoneLink && <a href={dupPhoneLink} className={buttonVariants({ variant: "outline", size: "xs" })}>Call</a>}
                        {dupWaLink && <a href={dupWaLink} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "xs" })}>WhatsApp</a>}
                        {dupMailLink && <a href={dupMailLink} className={buttonVariants({ variant: "outline", size: "xs" })}>Email</a>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assignment + Follow-up combined */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 space-y-3">
            {/* Assignment */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Assigned To</span>
                {optimisticLead.assigned_to_profile && (
                  <span className="text-xs text-slate-400 capitalize">{optimisticLead.assigned_to_profile.role}</span>
                )}
              </div>
              {optimisticLead.assigned_to_profile ? (
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={optimisticLead.assigned_to_profile.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                      {optimisticLead.assigned_to_profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium text-slate-900">{optimisticLead.assigned_to_profile.full_name}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 mb-2">Unassigned</p>
              )}
              {canManage && (
                <Select
                  value={optimisticLead.assigned_to ?? "unassigned"}
                  onValueChange={(v) => handleAssign(v === "unassigned" ? null : v ?? null)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    {optimisticLead.assigned_to_profile ? (
                      <span className="text-sm">{optimisticLead.assigned_to_profile.full_name}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Assign to agent</span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.full_name} ({a.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Follow-up */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Follow-up</span>
                {optimisticLead.next_follow_up_at && !followUpDate && (
                  <span className="text-xs text-amber-600">{formatDate(optimisticLead.next_follow_up_at)}</span>
                )}
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <Input
                    type="datetime-local"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                  <Button size="sm" className="h-8" onClick={handleScheduleFollowUp} disabled={pending || !followUpDate}>
                    {pending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    Set
                  </Button>
                </div>
              )}
              {canEdit && followUpDate && (
                <Input
                  placeholder="Notes (optional)"
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  className="h-8 text-xs mt-2"
                />
              )}
            </div>
          </div>

          {/* Convert action — compact */}
          {currentStage?.kind !== "won" && currentStage?.kind !== "lost" && currentStage?.kind !== "junk" && canEdit && (
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
              {converting ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600">Creates a prospect customer and pipeline deal.</p>
                  <Button size="sm" className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={() => confirmConvert()} disabled={pending}>
                    {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirm Conversion
                  </Button>
                  <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => setConverting(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600" size="sm" onClick={() => setConverting(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Convert to Deal
                </Button>
              )}
            </div>
          )}

          {/* Conversion info — compact */}
          {currentStage?.kind === "won" && (
            <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                Converted
              </div>
              {customer && (
                <Link href={`/customers/${customer.id}`} className="flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800">
                  <ExternalLink className="h-3 w-3" />
                  {customer.name}
                </Link>
              )}
              {deal && (
                <Link href={`/pipeline/${deal.id}`} className="flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800">
                  <Briefcase className="h-3 w-3" />
                  {deal.title} ({deal.stage})
                </Link>
              )}
            </div>
          )}

          {/* Score — inline, no big card */}
          {optimisticLead.score !== null && (
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Lead Score</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${optimisticLead.score >= 70 ? "text-emerald-600" : optimisticLead.score >= 40 ? "text-amber-600" : "text-slate-400"}`}>
                    {optimisticLead.score}
                  </span>
                  <span className="text-xs text-slate-400">
                    {optimisticLead.score >= 70 ? "Hot" : optimisticLead.score >= 40 ? "Warm" : "Cold"}
                  </span>
                </div>
              </div>
              {optimisticLead.score_reason && (
                <p className="text-xs text-slate-400 mt-1">{optimisticLead.score_reason}</p>
              )}
            </div>
          )}

          {/* Documents — compact */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Documents</span>
              <span className="text-xs text-slate-400">{documents.length}</span>
            </div>
            <div className="mb-3">
              <DocumentUploadDialog triggerLabel="Attach Document" entityType="lead" entityId={optimisticLead.id} />
            </div>
            {documents.length === 0 ? (
              <p className="text-xs text-slate-400">No documents yet.</p>
            ) : (
              <div className="space-y-1">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-700 truncate flex-1">{doc.file_name}</span>
                    <ExternalLink className="h-3 w-3 text-slate-300 shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reason dialog for Lost / Junk stage changes */}
      <Dialog open={reasonDialog !== null} onOpenChange={(open) => { if (!open) setReasonDialog(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move to {reasonDialog?.stageName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Please select a reason for marking this lead as {reasonDialog?.stageName}:
            </p>
            <Select value={selectedReason} onValueChange={(v) => setSelectedReason(v ?? "")}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select a reason..." /></SelectTrigger>
              <SelectContent>
                {(lostReasons[reasonDialog?.kind ?? ""] ?? []).map((reason) => (
                  <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReasonDialog(null)}>Cancel</Button>
            <Button size="sm" onClick={handleReasonConfirm} disabled={!selectedReason || pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Are you sure you want to delete <strong>{optimisticLead.name}</strong>? This will soft-delete the lead — it will be hidden from all views but can be restored if needed.
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
