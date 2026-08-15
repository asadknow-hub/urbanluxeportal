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
  Building2,
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

  function renderInlineEditor() {
    if (!inlineEdit) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Editing field</p>
            <p className="truncate text-sm font-medium text-slate-900">{inlineEdit.label}</p>
          </div>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={cancelInlineEdit}>
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
          <Textarea rows={4} value={inlineEdit.value} onChange={(e) => setInlineEditValue(e.target.value)} className="min-h-24 text-sm" />
        ) : inlineEdit.kind === "select" && inlineEdit.options ? (
          <Select value={inlineEdit.value || undefined} onValueChange={(v) => setInlineEditValue(v ?? "") }>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder={`Select ${inlineEdit.label}`} />
            </SelectTrigger>
            <SelectContent>
              {inlineEdit.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : inlineEdit.kind === "checkbox" ? (
          <Select value={inlineEdit.value || "false"} onValueChange={(v) => setInlineEditValue(v ?? "false")}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
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
            className="h-9 text-sm"
          />
        ) : (
          <Input
            type={inlineEdit.kind === "number" || inlineEdit.kind === "money" ? "number" : "text"}
            value={inlineEdit.value}
            onChange={(e) => setInlineEditValue(e.target.value)}
            placeholder={inlineEdit.kind === "money" ? "Amount in AED" : inlineEdit.label}
            className="h-9 text-sm"
          />
        )}

        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={cancelInlineEdit}>
            Cancel
          </Button>
          <Button size="sm" className="h-8 px-3 text-xs" onClick={handleInlineSave} disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </div>
    );
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
    <div className="space-y-4">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 xl:flex-row xl:items-center xl:justify-between">
        
        <div className="flex items-center gap-4">
          <Avatar className="flex h-16 w-16 items-center justify-center bg-secondary text-xl font-semibold text-secondary-foreground">
            <AvatarFallback className="bg-transparent">{initials}</AvatarFallback>
            <AvatarImage src={optimisticLead.assigned_to_profile?.avatar_url ?? undefined} />
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              {currentStage && (
                <span 
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase"
                  style={{ backgroundColor: `${currentStage.color}15`, color: currentStage.color }}
                >
                  {currentStage.name}
                </span>
              )}
            </div>
            <h1 className="mb-2 text-xl font-semibold leading-none text-foreground">{optimisticLead.name}</h1>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span>Source: <span className="text-foreground">{formatLabel(optimisticLead.source)}</span></span>
              <span className="text-border">•</span>
              <span><span className="text-foreground">{formatLeadInterest(optimisticLead.interest)}</span></span>
              {optimisticLead.score !== null && (
                <>
                  <span className="text-border">•</span>
                  <span>Score: <span className={optimisticLead.score >= 70 ? "text-primary" : optimisticLead.score >= 40 ? "text-amber-600" : "text-muted-foreground"}>{optimisticLead.score} ({optimisticLead.score >= 70 ? "Hot" : optimisticLead.score >= 40 ? "Warm" : "Cold"})</span></span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8 xl:justify-end">
          <div className="flex items-center gap-8 border-r border-slate-200 pr-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Last touched</p>
              <p className="text-sm font-bold text-slate-900" suppressHydrationWarning>{timeAgo(lastTouchAt)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Created on</p>
              <p className="text-sm font-bold text-slate-900" suppressHydrationWarning>{formatDate(optimisticLead.created_at)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {phoneLink && (
              <a href={phoneLink} className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">
                <Phone className="mr-2 h-3.5 w-3.5 text-slate-400" /> Call
              </a>
            )}
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">
                <MessageCircle className="mr-2 h-3.5 w-3.5 text-slate-400" /> WhatsApp
              </a>
            )}
            {mailLink && (
              <a href={mailLink} className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">
                <Mail className="mr-2 h-3.5 w-3.5 text-slate-400" /> Email
              </a>
            )}
            
            <Dialog>
              <DialogTrigger render={<Button className="h-9 px-4" />}>
                <ArrowLeft className="mr-2 h-3.5 w-3.5 rotate-90" /> Upload Document
              </DialogTrigger>
              <DialogContent>
                 <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                 <p className="text-sm text-slate-500">Document upload logic goes here...</p>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="h-9 w-9 p-0 rounded-lg border-slate-200">
              <span className="flex flex-col gap-0.5 items-center justify-center">
                <span className="h-0.5 w-0.5 bg-slate-600 rounded-full"></span>
                <span className="h-0.5 w-0.5 bg-slate-600 rounded-full"></span>
                <span className="h-0.5 w-0.5 bg-slate-600 rounded-full"></span>
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Chevron Stepper */}
      {stages.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
          {workflowStages.map((stage, idx) => {
            const currentIdx = workflowStages.findIndex((s) => s.id === optimisticLead.stage_id);
            const isCurrent = idx === currentIdx;
            const isPassed = currentIdx >= 0 && idx < currentIdx;
            const isEditable = canEdit && !pending;
            
            // Define colors
            let bgColor = "bg-slate-50";
            let textColor = "text-slate-500";
            
            if (isCurrent) {
              bgColor = ""; // We'll set style inline
              textColor = "text-white";
            } else if (isPassed) {
              bgColor = "bg-slate-100";
              textColor = "text-slate-700";
            } else {
               bgColor = "bg-slate-50/50";
               textColor = "text-slate-400";
            }

            const clipPath = idx === 0 
              ? "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%)"
              : idx === workflowStages.length - 1
              ? "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 5% 50%)"
              : "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%)";

            return (
              <button
                key={stage.id}
                onClick={() => isEditable && handleStageChange(stage.id)}
                disabled={!isEditable}
                style={isCurrent ? { backgroundColor: stage.color, clipPath } : { clipPath }}
                className={`relative flex-1 flex items-center justify-center h-10 min-w-[120px] transition-all ${bgColor} ${isEditable ? "cursor-pointer hover:brightness-95" : "cursor-default opacity-80"}`}
              >
                <div className={`flex items-center gap-2 text-xs font-semibold ${textColor}`}>
                  {isPassed && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {stage.name}
                </div>
              </button>
            );
          })}
          
          <Button variant="ghost" size="sm" className="ml-2 h-8 text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg">
            Mark as Lost
          </Button>
        </div>
      )}

      {/* Main Grid: 2 columns left, 1 column right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* LEFT & MIDDLE: Snapshot and Timeline */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* 3. Lead Snapshot Bento */}
          <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Lead Snapshot</h3>
                  <p className="text-xs text-slate-500">Hover a field and click to edit it inline.</p>
                </div>
              </div>
            </div>
            
            {/* Inline-editable field grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
              {[
                { label: "Name", kind: "text" as const, value: optimisticLead.name, key: "name", span: "" },
                { label: "Phone", kind: "text" as const, value: optimisticLead.phone ?? "", key: "phone", span: "" },
                { label: "Email", kind: "text" as const, value: optimisticLead.email ?? "", key: "email", span: "" },
                { label: "Interest", kind: "text" as const, value: optimisticLead.interest, key: "interest", span: "" },
                { label: "Budget Min (AED)", kind: "money" as const, value: optimisticLead.budget_min ? String(optimisticLead.budget_min / 100) : "", key: "budget_min", span: "" },
                { label: "Budget Max (AED)", kind: "money" as const, value: optimisticLead.budget_max ? String(optimisticLead.budget_max / 100) : "", key: "budget_max", span: "" },
                { label: "Preferred Areas", kind: "areas" as const, value: optimisticLead.preferred_areas?.length ? optimisticLead.preferred_areas.join(", ") : "", key: "preferred_areas", span: "" },
                { label: "Language", kind: "text" as const, value: optimisticLead.language ?? "", key: "language", span: "" },
                { label: "Financing", kind: "text" as const, value: optimisticLead.financing ?? "", key: "financing", span: "" },
                { label: "Timeframe", kind: "text" as const, value: optimisticLead.timeframe ?? "", key: "timeframe", span: "" },
                { label: "Purpose", kind: "text" as const, value: optimisticLead.purpose ?? "", key: "purpose", span: "" },
                { label: "Bedrooms", kind: "text" as const, value: optimisticLead.bedrooms ?? "", key: "bedrooms", span: "" },
                { label: "Category", kind: "text" as const, value: optimisticLead.category ?? "", key: "category", span: "" },
                { label: "Tags", kind: "tags" as const, value: optimisticLead.tags ?? [], key: "tags", span: "" },
                { label: "Notes", kind: "textarea" as const, value: optimisticLead.notes ?? "", key: "notes", span: "sm:col-span-2 xl:col-span-3" },
              ].map((field) => {
                const isEditing = inlineEdit?.key === field.key;
                const valueText =
                  field.kind === "areas"
                    ? field.value || "—"
                    : field.kind === "tags"
                    ? field.value.length > 0
                      ? field.value.map((tag) => formatLeadTag(tag)).join(", ")
                      : "—"
                    : field.value || "—";
                const editState =
                  field.kind === "areas"
                    ? { key: field.key, label: field.label, kind: field.kind, value: optimisticLead.preferred_areas ?? [] }
                    : field.kind === "tags"
                    ? { key: field.key, label: field.label, kind: field.kind, value: optimisticLead.tags ?? [] }
                    : { key: field.key, label: field.label, kind: field.kind, value: field.value };

                return isEditing ? (
                  <div
                    key={field.key}
                    className={`rounded-xl border border-primary/20 bg-primary/5 p-3 ${field.span}`}
                  >
                    {renderInlineEditor()}
                  </div>
                ) : (
                  <button
                    key={field.key}
                    type="button"
                    onClick={() => startInlineEdit(editState as InlineEditState)}
                    className={`group flex w-full items-center justify-between gap-3 rounded-xl border border-transparent bg-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring ${field.span}`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">{field.label}</span>
                      <span className="mt-0.5 block truncate text-[12px] font-medium text-slate-700 group-hover:text-slate-900">{valueText}</span>
                    </div>
                    <PenLine className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm p-5">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-2">
                 <Activity className="h-4 w-4 text-slate-400" />
                 <div>
                   <h3 className="text-sm font-bold text-slate-900">Activity Timeline</h3>
                   <p className="text-xs text-slate-500">All interactions and notes in chronological order.</p>
                 </div>
               </div>
               <Select value="all">
                 <SelectTrigger className="h-8 w-32 text-xs bg-slate-50 border-slate-200 rounded-lg"><SelectValue placeholder="All Activities" /></SelectTrigger>
                 <SelectContent><SelectItem value="all">All Activities</SelectItem></SelectContent>
               </Select>
            </div>

            <div className="space-y-0">
               {optimisticActivities.length === 0 ? (
                  <div className="text-center py-6 text-sm text-slate-500">No activities yet.</div>
               ) : (
                 optimisticActivities.map((a, idx) => {
                   const isLast = idx === optimisticActivities.length - 1;
                   const isWhatsApp = a.type === 'whatsapp';
                   const isCall = a.type === 'call';
                   const isViewing = a.type === 'viewing';
                   
                   let Icon = Activity;
                   let iconBg = "bg-blue-500";
                   
                   if (isWhatsApp) { Icon = MessageCircle; iconBg = "bg-green-500"; }
                   else if (isCall) { Icon = Phone; iconBg = "bg-blue-500"; }
                   else if (isViewing) { Icon = Home; iconBg = "bg-purple-500"; }
                   else { Icon = FileText; iconBg = "bg-blue-400"; }

                   return (
                     <div key={a.id} className={`flex gap-4 py-4 ${!isLast ? 'border-b border-slate-100' : ''}`}>
                       <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg} text-white shadow-sm`}>
                         <Icon className="h-4 w-4" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between">
                           <p className="text-sm font-bold text-slate-900 capitalize">{a.type.replace(/_/g, " ")}</p>
                           <p className="text-xs text-slate-400 shrink-0" suppressHydrationWarning>{formatDate(a.occurred_at)}, {new Date(a.occurred_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                         </div>
                         {a.summary && <p className="text-sm text-slate-500 mt-1">{a.summary}</p>}
                       </div>
                     </div>
                   );
                 })
               )}
            </div>
            
            {optimisticActivities.length > 0 && (
              <div className="mt-4 text-center border-t border-slate-100 pt-4">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-600 bg-slate-50 rounded-lg h-9 px-6">View All Activities</Button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          
          {/* Assigned To */}
          <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserCog className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-900">Assigned To</span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Agent</span>
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <Avatar className="h-10 w-10 bg-secondary text-xs font-medium text-secondary-foreground">
                 <AvatarFallback>{optimisticLead.assigned_to_profile?.full_name.substring(0,2).toUpperCase() || "??"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Select value={optimisticLead.assigned_to ?? "unassigned"} onValueChange={(v) => handleAssign(v === "unassigned" ? null : v ?? null)}>
                  <SelectTrigger className="h-9 border-none bg-transparent shadow-none px-0 text-sm font-medium focus:ring-0">
                    <SelectValue placeholder="Assign agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-bold text-slate-900 mb-2">Follow Up</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    type="datetime-local" 
                    value={followUpDate} 
                    onChange={(e) => setFollowUpDate(e.target.value)} 
                    className="h-10 text-xs rounded-lg pl-3 pr-10 bg-white border-slate-200" 
                  />
                  <CalendarClock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
                <Button size="sm" className="h-10 px-4" onClick={handleScheduleFollowUp} disabled={!followUpDate || pending}>
                  Set
                </Button>
              </div>
            </div>

            <Button className="h-11 w-full text-sm" onClick={() => setConverting(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Convert to Deal
            </Button>
          </div>

          {/* Lead Score */}
          <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm p-5">
             <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2">
                 <Activity className="h-4 w-4 text-blue-500" />
                 <span className="text-sm font-bold text-slate-900">Lead Score</span>
               </div>
               <div className="flex items-baseline gap-1.5">
                 <span className="text-2xl font-bold text-slate-700">{optimisticLead.score ?? 0}</span>
                 <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-sm">{optimisticLead.score && optimisticLead.score >= 70 ? "Hot" : optimisticLead.score && optimisticLead.score >= 40 ? "Warm" : "Cold"}</span>
               </div>
             </div>
             <p className="text-xs text-slate-500 mb-4">Score based on engagement and budget</p>
             <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, optimisticLead.score ?? 0))}%` }}></div>
             </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm p-5">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <FileText className="h-4 w-4 text-slate-700" />
                 <span className="text-sm font-bold text-slate-900">Documents</span>
               </div>
               <span className="text-sm font-bold text-slate-700">{documents.length}</span>
             </div>
             
             <Dialog>
               <DialogTrigger render={<button className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10" />}>
                 <ArrowLeft className="h-3.5 w-3.5 rotate-90" /> Attach Document
               </DialogTrigger>
               <DialogContent>
                 <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                 <p className="text-sm text-slate-500">Document logic goes here...</p>
               </DialogContent>
             </Dialog>
             
             {documents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center mt-4">No documents yet.</p>
             ) : (
                <div className="mt-4 space-y-2">
                  {documents.map(d => (
                    <div key={d.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-slate-50">
                      <span className="truncate">{d.file_name}</span>
                      <a href={d.file_url} target="_blank" className="text-primary"><ExternalLink className="h-3.5 w-3.5" /></a>
                    </div>
                  ))}
                </div>
             )}
          </div>

          {/* Lead Insights */}
          <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm p-5">
             <div className="flex items-center gap-2 mb-5">
                <Activity className="h-4 w-4 text-slate-700" />
                <span className="text-sm font-bold text-slate-900">Lead Insights</span>
             </div>
             <div className="space-y-4">
               <div className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2 text-slate-500"><Activity className="h-3.5 w-3.5" /> Engagement Level</div>
                 <span className="font-bold text-slate-900">Low</span>
               </div>
               <div className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2 text-slate-500"><CalendarClock className="h-3.5 w-3.5" /> Last Activity</div>
                 <span className="font-bold text-slate-900" suppressHydrationWarning>{timeAgo(lastTouchAt)}</span>
               </div>
               <div className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2 text-slate-500"><CalendarClock className="h-3.5 w-3.5" /> First Contact</div>
                 <span className="font-bold text-slate-900" suppressHydrationWarning>{formatDate(optimisticLead.created_at)}</span>
               </div>
               <div className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2 text-slate-500"><FileText className="h-3.5 w-3.5" /> Total Activities</div>
                 <span className="font-bold text-slate-900">{optimisticActivities.length}</span>
               </div>
             </div>
          </div>

        </div>
      </div>

      {/* Dialogs */}
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
      
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Are you sure you want to delete <strong>{optimisticLead.name}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={pending}>
              Delete Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
