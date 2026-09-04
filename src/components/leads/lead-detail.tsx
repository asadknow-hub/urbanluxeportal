"use client";

import { useMemo, useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PreferredAreasPicker } from "@/components/leads/preferred-areas-picker";
import { OptionMultiPicker } from "@/components/leads/option-multi-picker";
import { NationalityPicker } from "@/components/leads/nationality-picker";
import { BlurSaveInput } from "@/components/leads/hover-edit-row";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { ConvertLeadDialog } from "@/components/leads/convert-lead-dialog";
import { ViewingPanel, type ViewingRow, type InventoryChoice } from "@/components/crm/viewing-panel";
import {
  LeadProposedPropertySection,
  type LeadProposedProperty,
} from "@/components/leads/lead-proposed-property";
import { MatchPanel } from "@/components/crm/match-panel";
import { LeadDocumentsPage, LeadKycPage, useMergedLeadDocuments } from "@/components/leads/lead-documents-kyc-tabs";
import { LeadPageTabs, type LeadPageView } from "@/components/leads/lead-page-tabs";
import type { LeadDocument } from "@/components/leads/lead-documents";
import type { DocCategoryChoice } from "@/lib/lead-field-options";
import type { PersonKycFields } from "@/lib/kyc";
import type { KycPersonRecord } from "@/lib/kyc-form";
import { LeadAssignmentHistory } from "@/components/leads/lead-assignment-history";
import type { LeadAssignmentRow } from "@/lib/lead-audit";
import type { LeadTimelineItem } from "@/lib/lead-timeline";
import { loadLeadTimelinePage } from "@/server/lead-timeline";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { telLink, whatsappLink } from "@/lib/phone";
import { formatAEDRange } from "@/lib/money";
import { daysUntil, formatDate, formatDateTime, isOverdue, shortTimeAgo, timeAgo } from "@/lib/dates";
import { stageSlaClock, firstResponseClock } from "@/lib/lead-sla";
import { canManageCrm } from "@/lib/permissions";
import type { InventoryMatch } from "@/lib/match-inventory";
import {
  choiceItems,
  docCategoryChoices,
  optionLabel,
  scoreBandForValue,
  scoreFromBand,
  type LeadFieldOption,
} from "@/lib/lead-field-options";
import {
  assignLead,
  claimLead,
  scheduleFollowUp,
  completeFollowUp,
  updateLead,
  updateLeadStage,
  deleteLead,
  addLeadActivity,
} from "@/server/leads";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Upload,
  ArrowRight,
  MapPin,
  Building2,
  Check,
  UserRound,
  ChevronDown,
} from "lucide-react";

type Lead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  call_numbers?: string[] | null;
  source: string;
  interest: string;
  budget_min: number | null;
  budget_max: number | null;
  preferred_areas: string[] | null;
  notes: string | null;
  status: string;
  score: number | null;
  assigned_to: string | null;
  next_follow_up_at: string | null;
  lost_reason: string | null;
  junk_reason: string | null;
  converted_customer_id: string | null;
  converted_deal_id: string | null;
  customer_id: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
  stage_entered_at: string | null;
  stage_id: string | null;
  first_response_due_at?: string | null;
  first_responded_at?: string | null;
  first_response_minutes?: number | null;
  nationality: string | null;
  financing: string | null;
  timeframe: string | null;
  purpose: string | null;
  bedrooms: string | null;
  category: string | null;
  tags: string[];
  assigned_to_profile: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    role: string;
    email: string | null;
    phone: string | null;
  } | null;
};

type LeadFollowUp = {
  id: string;
  scheduled_at: string;
  completed_at: string | null;
  status: "scheduled" | "done" | "snoozed" | "skipped";
  notes: string | null;
  created_at: string;
};

type DocumentRow = LeadDocument;

type Agent = { id: string; full_name: string; role: string };
type Stage = { id: string; name: string; color: string; kind: string; sort: number; helper_text: string | null; stale_after_days?: number | null };

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatLabel(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function emptyValue(text = "Not captured") {
  return <span className="text-[#B9B6AB]">{text}</span>;
}

function IconBtn({
  href,
  label,
  disabled,
  onClick,
  children,
}: {
  href?: string | null;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const className =
    "grid h-10 w-10 place-items-center rounded-[10px] border border-border bg-card text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-40";
  if (!href || disabled) {
    return (
      <span className={`${className} opacity-40`} title={label} aria-disabled>
        {children}
      </span>
    );
  }
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      aria-label={label}
      title={label}
      className={className}
      onClick={onClick}
    >
      {children}
    </a>
  );
}

function FloatPicker({
  trigger,
  children,
  className,
  disabled,
}: {
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger disabled={disabled} className="rounded-md text-left hover:bg-muted/70 disabled:cursor-default disabled:hover:bg-transparent">
        {trigger}
      </PopoverTrigger>
      <PopoverContent className={className}>{children(() => setOpen(false))}</PopoverContent>
    </Popover>
  );
}

function SnapshotBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="mb-2 flex justify-center">
        <span className="rounded-full bg-accent px-3 py-0.5 text-center text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-secondary">
          {title}
        </span>
      </p>
      <div>{children}</div>
    </div>
  );
}

function QuietSaveInput({
  value,
  type = "text",
  disabled,
  placeholder,
  className,
  onSave,
}: {
  value: string;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onSave: (next: string) => void;
}) {
  return (
    <input
      key={value}
      type={type}
      defaultValue={value}
      disabled={disabled}
      placeholder={placeholder}
      className={`h-7 w-full rounded-md bg-transparent px-1 text-[0.86rem] text-foreground outline-none placeholder:text-[#B9B6AB] hover:bg-muted/70 focus:bg-muted/80 disabled:cursor-default disabled:hover:bg-transparent disabled:focus:bg-transparent ${className ?? ""}`}
      onBlur={(e) => {
        if (e.target.value.trim() === value.trim()) return;
        onSave(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
        if (e.key === "Escape") {
          e.currentTarget.value = value;
          e.currentTarget.blur();
        }
      }}
    />
  );
}

function ChoicePicker({
  value,
  options,
  disabled,
  placeholder = "Not captured",
  onChange,
}: {
  value?: string | null;
  options: { value: string; label: string }[] | string[];
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const items = options.map((opt) => (typeof opt === "string" ? { value: opt, label: formatLabel(opt) } : opt));
  return (
    <FloatPicker
      disabled={disabled}
      className="w-52 p-1.5"
      trigger={
        <span className="block px-1 py-0.5 text-[0.86rem]">
          {value ? items.find((opt) => opt.value === value)?.label ?? formatLabel(value) : emptyValue(placeholder)}
        </span>
      }
    >
      {(close) => (
        <div className="grid gap-0.5">
          {items.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`rounded-md px-2.5 py-1.5 text-left text-[0.84rem] hover:bg-muted ${
                opt.value === value ? "bg-accent text-secondary" : "text-foreground"
              }`}
              onClick={() => {
                onChange(opt.value);
                close();
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </FloatPicker>
  );
}

function LedgerRow({
  label,
  editing,
  canEdit,
  onEdit,
  children,
  display,
  overlay = false,
}: {
  label: string;
  editing?: boolean;
  canEdit?: boolean;
  onEdit?: () => void;
  display?: React.ReactNode;
  children?: React.ReactNode;
  overlay?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-0 border-b border-border py-[6px] last:border-b-0 sm:grid-cols-[108px_1fr]">
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:border-r sm:border-border sm:pr-3">{label}</span>
      {overlay ? (
        <div className="min-w-0 sm:pl-3">{children}</div>
      ) : editing ? (
        <div className="sm:pl-3">{children}</div>
      ) : (
        <button
          type="button"
          disabled={!canEdit}
          onClick={onEdit}
          className="rounded-md px-1 py-0.5 text-left text-[0.86rem] text-foreground hover:bg-muted/70 disabled:cursor-default sm:pl-3"
        >
          {display}
        </button>
      )}
    </div>
  );
}

export function LeadDetail({
  lead,
  initialTimeline,
  initialTimelineCursor,
  activityCount: initialActivityCount,
  agents,
  stages,
  areas,
  nationalities,
  fieldOptions,
  followUps,
  customer,
  existingOwner = false,
  personKyc,
  kycPerson,
  customerDocuments = [],
  kycDocCategories = [],
  deal,
  documents,
  viewings,
  inventory,
  proposedProperties = [],
  matches = [],
  assignments = [],
  userRole,
  userId,
}: {
  lead: Lead;
  initialTimeline: LeadTimelineItem[];
  initialTimelineCursor: string | null;
  activityCount: number;
  agents: Agent[];
  stages: Stage[];
  areas: string[];
  nationalities: string[];
  fieldOptions: Record<string, LeadFieldOption[]>;
  followUps: LeadFollowUp[];
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    status?: string;
    nationality?: string | null;
    emirates_id?: string | null;
    passport_no?: string | null;
    trn?: string | null;
  } | null;
  existingOwner?: boolean;
  personKyc?: PersonKycFields | null;
  kycPerson?: KycPersonRecord | null;
/** @deprecated Pass customerDocuments instead. */
  kycDocuments?: LeadDocument[];
  /** Person-profile documents merged into the Documents tab (deduped by storage_path). */
  customerDocuments?: LeadDocument[];
  kycDocCategories?: DocCategoryChoice[];
  deal: { id: string; title: string; stage: string; value: number; deal_type: string } | null;
  documents: DocumentRow[];
  viewings: ViewingRow[];
  inventory: InventoryChoice[];
  proposedProperties?: LeadProposedProperty[];
  matches?: InventoryMatch[];
  assignments?: LeadAssignmentRow[];
  userRole: string;
  userId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [optimisticLead, setOptimisticLead] = useState(lead);
  const [optimisticFollowUps, setOptimisticFollowUps] = useState(followUps);
  const [timelineItems, setTimelineItems] = useState(initialTimeline);
  const [timelineCursor, setTimelineCursor] = useState(initialTimelineCursor);
  const [activityCount, setActivityCount] = useState(initialActivityCount);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const skipTimelineBootstrap = useRef(true);
  const [optimisticDocs, setOptimisticDocs] = useState<LeadDocument[]>(
    documents.map((doc) => ({ ...doc, category: doc.category || "other" }))
  );

  useEffect(() => {
    setOptimisticLead(lead);
    setOptimisticFollowUps(followUps);
    setTimelineItems(initialTimeline);
    setTimelineCursor(initialTimelineCursor);
    setActivityCount(initialActivityCount);
    setOptimisticDocs(documents.map((doc) => ({ ...doc, category: doc.category || "other" })));
    skipTimelineBootstrap.current = true;
  }, [lead, followUps, initialTimeline, initialTimelineCursor, initialActivityCount, documents]);

  const [editing, setEditing] = useState<string | null>(null);
  const [followUpDate, setFollowUpDate] = useState(toDatetimeLocal(lead.next_follow_up_at));
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [converting, setConverting] = useState(false);
  const [reasonDialog, setReasonDialog] = useState<{ stageId: string; stageName: string; kind: string } | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [leadPage, setLeadPage] = useState<LeadPageView>("overview");
  const [contactMethod, setContactMethod] = useState<"whatsapp" | "call" | "email" | "in_person" | null>(null);
  const [contactNote, setContactNote] = useState("");
  const [contactHistoryOpen, setContactHistoryOpen] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [followUpHistoryOpen, setFollowUpHistoryOpen] = useState(false);

  const mergedDocuments = useMergedLeadDocuments(optimisticDocs, customerDocuments);

  const currentStage = stages.find((s) => s.id === optimisticLead.stage_id) ?? null;
  const pipelineStages = stages.filter((s) => s.kind !== "lost" && s.kind !== "junk");
  const lostStage = stages.find((s) => s.kind === "lost");
  const junkStage = stages.find((s) => s.kind === "junk");
  const terminalReason =
    currentStage?.kind === "junk"
      ? optimisticLead.junk_reason
      : currentStage?.kind === "lost"
        ? optimisticLead.lost_reason
        : optimisticLead.junk_reason ?? optimisticLead.lost_reason;
  const terminalReasonLabel = terminalReason
    ? optionLabel(
        currentStage?.kind === "junk" || (!currentStage && optimisticLead.junk_reason)
          ? fieldOptions.junk_reason
          : fieldOptions.lost_reason,
        terminalReason
      )
    : null;
  const canManage = canManageCrm(userRole);
  const needsClaim = userRole === "agent" && !optimisticLead.assigned_to;
  const canEdit = (canManage || userRole === "agent") && !needsClaim;
  /** Owner identity — locked when this lead sits under an already existing customer. */
  const canEditContact = canEdit && !existingOwner;
  const contactName =
    existingOwner && customer?.name?.trim() ? customer.name.trim() : optimisticLead.name;
  const contactPhone =
    existingOwner && customer ? (customer.phone ?? optimisticLead.phone) : optimisticLead.phone;
  const contactEmail =
    existingOwner && customer ? (customer.email ?? optimisticLead.email) : optimisticLead.email;
  const contactNationality =
    existingOwner && customer
      ? (customer.nationality ?? optimisticLead.nationality)
      : optimisticLead.nationality;
  const waLink = whatsappLink(contactPhone);
  const mailLink = contactEmail ? `mailto:${contactEmail}` : null;
  const phoneHref = telLink(contactPhone);
  const score = optimisticLead.score ?? 0;
  const scoreBand = scoreBandForValue(fieldOptions.score, score);
  const scoreLegend = (fieldOptions.score ?? []).map((row) => row.label).join(" · ");
  const engagement = activityCount >= 15 ? "High" : activityCount >= 5 ? "Medium" : "Low";
  const budgetLine = formatAEDRange(optimisticLead.budget_min, optimisticLead.budget_max);
  const lastTouch = timelineItems[0]?.occurred_at ?? optimisticLead.last_activity_at ?? optimisticLead.updated_at;
  const currentIdx = pipelineStages.findIndex((s) => s.id === optimisticLead.stage_id);
  const fillPct = pipelineStages.length <= 1 || currentIdx < 0 ? 0 : (currentIdx / (pipelineStages.length - 1)) * 100;
  const slaClock = stageSlaClock(
    optimisticLead.stage_entered_at ?? optimisticLead.created_at,
    currentStage?.kind === "open" ? currentStage.stale_after_days : null
  );
  const firstResponse = firstResponseClock(optimisticLead);
  const scheduledFollowUp = optimisticFollowUps.find((row) => row.status === "scheduled") ?? null;
  const pastFollowUps = useMemo(
    () =>
      optimisticFollowUps
        .filter((row) => row.status !== "scheduled")
        .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at)),
    [optimisticFollowUps]
  );
  const visiblePastFollowUps = followUpHistoryOpen ? pastFollowUps : pastFollowUps.slice(0, 3);
  const contactAttempts = useMemo(
    () =>
      timelineItems.filter((item) =>
        ["whatsapp", "call", "email", "in_person", "phone"].includes(item.type)
      ),
    [timelineItems]
  );
  const importantActivity = useMemo(() => {
    return timelineItems.filter((item) => {
      const t = item.type.toLowerCase();
      return (
        t.includes("follow_up") ||
        t.includes("viewing") ||
        ["whatsapp", "call", "email", "in_person", "phone"].includes(t)
      );
    });
  }, [timelineItems]);
  const visibleContactAttempts = contactHistoryOpen ? contactAttempts : contactAttempts.slice(0, 3);
  const visibleActivity = activityExpanded ? importantActivity : importantActivity.slice(0, 5);
  const viewingScheduled =
    currentStage?.name?.toLowerCase().includes("viewing") === true &&
    currentStage.name.toLowerCase().includes("scheduled");
  const contactedStage = currentStage?.name?.toLowerCase().includes("contacted") === true;

  useEffect(() => {
    if (skipTimelineBootstrap.current) {
      skipTimelineBootstrap.current = false;
      return;
    }
    let cancelled = false;
    setTimelineLoading(true);
    void loadLeadTimelinePage(optimisticLead.id, null, "all").then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setTimelineItems(result.items);
        setTimelineCursor(result.nextCursor);
      } else {
        toast.error(result.error ?? "Could not load timeline");
      }
      setTimelineLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [optimisticLead.id]);

  function saveField(payload: Record<string, unknown>, nextState: Partial<Lead>, close = true) {
    setOptimisticLead((prev) => ({ ...prev, ...nextState }));
    if (close) setEditing(null);
    startTransition(async () => {
      const result = await updateLead(optimisticLead.id, payload as never);
      if (result.ok) router.refresh();
      else {
        setOptimisticLead(lead);
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleClaim() {
    startTransition(async () => {
      const result = await claimLead(optimisticLead.id);
      if (result.ok) {
        toast.success("Lead claimed");
        setOptimisticLead((prev) => ({
          ...prev,
          assigned_to: userId,
        }));
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not claim lead");
      }
    });
  }

  function handleAssign(agentId: string | null) {
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
      if (result.ok) router.refresh();
      else {
        setOptimisticLead(lead);
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function stageNavEffect(stageName: string) {
    const lower = stageName.toLowerCase();
    if (lower.includes("contacted")) {
      setLeadPage("overview");
      setTimeout(() => document.getElementById("contact-attempts-section")?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    } else if (lower.includes("qualified")) {
      setLeadPage("documents");
    } else if (lower.includes("viewing") && lower.includes("scheduled")) {
      setLeadPage("overview");
      setTimeout(() => document.getElementById("viewings-section")?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    } else if (lower.includes("viewing") && (lower.includes("done") || lower.includes("offer"))) {
      setLeadPage("kyc");
    }
  }

  function handleStageChange(stageId: string) {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) return;
    if (stage.kind === "won") {
      const existingDealId = deal?.id ?? optimisticLead.converted_deal_id;
      if (existingDealId) {
        router.push(`/pipeline/${existingDealId}`);
        return;
      }
      setConverting(true);
      return;
    }
    if (stage.kind === "lost" || stage.kind === "junk") {
      setReasonDialog({ stageId, stageName: stage.name, kind: stage.kind });
      setSelectedReason("");
      return;
    }
    setOptimisticLead((prev) => ({ ...prev, stage_id: stageId, stage_entered_at: new Date().toISOString() }));
    stageNavEffect(stage.name);
    startTransition(async () => {
      const result = await updateLeadStage(optimisticLead.id, stageId);
      if (result.ok) {
        router.refresh();
      } else {
        setOptimisticLead((prev) => ({ ...prev, stage_id: lead.stage_id, stage_entered_at: lead.stage_entered_at }));
        toast.error(result.error ?? "Failed to change stage");
      }
    });
  }

  function handleReasonConfirm() {
    if (!reasonDialog || !selectedReason) return;
    const previous = {
      stage_id: optimisticLead.stage_id,
      stage_entered_at: optimisticLead.stage_entered_at,
      status: optimisticLead.status,
      lost_reason: optimisticLead.lost_reason,
      junk_reason: optimisticLead.junk_reason,
    };
    setOptimisticLead((prev) => ({
      ...prev,
      stage_id: reasonDialog.stageId,
      status: "unqualified",
      stage_entered_at: new Date().toISOString(),
      lost_reason: reasonDialog.kind === "lost" ? selectedReason : prev.lost_reason,
      junk_reason: reasonDialog.kind === "junk" ? selectedReason : prev.junk_reason,
    }));
    setReasonDialog(null);
    startTransition(async () => {
      const extra: { lost_reason?: string; junk_reason?: string } = {};
      if (reasonDialog.kind === "lost") extra.lost_reason = selectedReason;
      else extra.junk_reason = selectedReason;
      const result = await updateLeadStage(optimisticLead.id, reasonDialog.stageId, extra);
      if (result.ok) {
        router.refresh();
      } else {
        setOptimisticLead((prev) => ({ ...prev, ...previous }));
        toast.error(result.error ?? "Failed");
      }
      setSelectedReason("");
    });
  }

  function handleScheduleFollowUp() {
    if (!followUpDate) return;
    const iso = new Date(followUpDate).toISOString();
    const previousFollowUps = optimisticFollowUps;
    const previousLead = optimisticLead;
    setOptimisticLead((prev) => ({ ...prev, next_follow_up_at: iso }));
    setOptimisticFollowUps((prev) => [
      {
        id: `optimistic_${Date.now()}`,
        scheduled_at: iso,
        completed_at: null,
        status: "scheduled",
        notes: followUpNotes || null,
        created_at: new Date().toISOString(),
      },
      ...prev.map((row) => (row.status === "scheduled" ? { ...row, status: "snoozed" as const } : row)),
    ]);
    setShowFollowUpForm(false);
    startTransition(async () => {
      const result = await scheduleFollowUp(optimisticLead.id, iso, followUpNotes || undefined);
      if (result.ok) {
        setFollowUpNotes("");
        router.refresh();
      } else {
        setOptimisticLead(previousLead);
        setOptimisticFollowUps(previousFollowUps);
        setShowFollowUpForm(true);
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleMarkDone() {
    const now = new Date().toISOString();
    setOptimisticLead((prev) => ({ ...prev, next_follow_up_at: null, last_activity_at: now }));
    setOptimisticFollowUps((prev) =>
      prev.map((row) => (row.status === "scheduled" ? { ...row, status: "done", completed_at: now } : row))
    );
    setTimelineItems((prev) => [
      {
        id: `opt_fu_${Date.now()}`,
        source: "activity",
        type: "follow_up_done",
        summary: "Follow-up completed",
        occurred_at: now,
        authorName: "You",
        isSystem: false,
      },
      ...prev,
    ]);
    setActivityCount((n) => n + 1);
    startTransition(async () => {
      const result = await completeFollowUp(optimisticLead.id);
      if (result.ok) router.refresh();
      else {
        setOptimisticLead(lead);
        setOptimisticFollowUps(followUps);
        setTimelineItems(initialTimeline);
        setActivityCount(initialActivityCount);
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function followUpTitle() {
    const when = optimisticLead.next_follow_up_at;
    if (!when) return "Set the next step";
    if (isOverdue(when)) return "Follow-up overdue";
    const days = daysUntil(when);
    if (days <= 0) return "Follow-up today";
    if (days === 1) return "Follow-up in 1 day";
    return `Follow-up in ${days} days`;
  }

  function activityKindLabel(item: LeadTimelineItem) {
    const t = item.type.toLowerCase();
    if (t.includes("follow_up")) {
      if (t.includes("done") || t.includes("complete")) return "Follow-up completed";
      return "Follow-up created";
    }
    if (t.includes("viewing")) {
      if (t.includes("schedul") || t.includes("created") || t === "viewing") return "Viewing scheduled";
      return "Viewing updated";
    }
    if (t === "in_person") return "In person";
    if (["whatsapp", "call", "email", "phone"].includes(t)) return formatLabel(t);
    return formatLabel(item.type);
  }

  function activityDetail(item: LeadTimelineItem) {
    if (!item.summary?.trim()) return null;
    const kind = activityKindLabel(item);
    const summary = item.summary.trim();
    if (summary === kind) return null;
    if (summary.toLowerCase() === `${kind.toLowerCase()} contact attempt`) return null;
    return summary;
  }

  function logContact(type: "call" | "whatsapp" | "email") {
    const summary =
      type === "call"
        ? `Called ${contactPhone}`
        : type === "whatsapp"
          ? `WhatsApp ${contactPhone}`
          : `Emailed ${contactEmail}`;
    startTransition(async () => {
      const result = await addLeadActivity(optimisticLead.id, type, summary);
      if (result.ok) router.refresh();
      else toast.error(result.error ?? "Could not log contact");
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-[1460px] flex-col gap-[18px]">
      <section className="overflow-visible rounded-[14px] border border-border bg-card">
        <div className="flex flex-col gap-6 px-6 py-7 md:flex-row md:items-start md:gap-[26px] md:px-8">
          <div className="relative grid h-[84px] w-[84px] shrink-0 place-items-center rounded-md border-[1.5px] border-primary bg-accent">
            <span className="absolute inset-[5px] rounded-[3px] border border-primary/35" />
            <span className="font-heading text-[1.8rem] tracking-wide text-secondary" style={{ fontFamily: "var(--font-display), serif" }}>
              {initials(contactName)}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {currentStage && (
                <span
                  className={
                    currentStage.kind === "lost" || currentStage.kind === "junk"
                      ? "rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 tracking-[0.06em] text-red-800 normal-case"
                      : "rounded-full border border-[#D9D5E8] bg-[#EDEBF4] px-2.5 py-0.5 tracking-[0.06em] text-[#4C4470] normal-case"
                  }
                >
                  {currentStage.name}
                </span>
              )}
              <span className="h-1 w-1 rounded-full bg-[#C4C1B6]" />
              <span>{optionLabel(fieldOptions.source, optimisticLead.source)}</span>
              <span className="h-1 w-1 rounded-full bg-[#C4C1B6]" />
              <span>{optionLabel(fieldOptions.interest, optimisticLead.interest)}</span>
            </div>
            {terminalReasonLabel ? (
              <div
                className={
                  currentStage?.kind === "junk"
                    ? "mb-2.5 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-[0.82rem] text-amber-950"
                    : "mb-2.5 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[0.82rem] text-red-950"
                }
              >
                <span className="font-semibold">
                  {currentStage?.kind === "junk" || (!currentStage && optimisticLead.junk_reason)
                    ? "Junk reason"
                    : "Lost reason"}
                  :
                </span>{" "}
                {terminalReasonLabel}
              </div>
            ) : null}
            {editing === "name" && canEditContact ? (
              <BlurSaveInput
                value={contactName}
                onCancel={() => setEditing(null)}
                onSave={(next) => {
                  if (!next.trim()) return setEditing(null);
                  saveField({ name: next.trim() }, { name: next.trim() });
                }}
              />
            ) : (
              <button
                type="button"
                disabled={!canEditContact}
                onClick={() => setEditing("name")}
                className="mb-2.5 text-left font-heading text-[2.1rem] leading-[1.05] font-normal tracking-tight text-foreground disabled:cursor-default md:text-[2.35rem]"
                style={{ fontFamily: "var(--font-display), serif" }}
              >
                {contactName}
              </button>
            )}
            {existingOwner && customer ? (
              <p className="mb-2 text-[0.78rem] font-medium text-secondary">
                Already existing customer — name, phone, email &amp; nationality are locked
                {customer.name ? ` · ${customer.name}` : ""}
                {customer.nationality ? ` · ${customer.nationality}` : ""}
              </p>
            ) : null}
            {needsClaim ? (
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-[0.82rem] text-amber-950">
                <span className="min-w-0 flex-1">Unassigned pool lead — claim it before editing or moving stages.</span>
                <Button size="sm" className="shrink-0" disabled={pending} onClick={handleClaim}>
                  Claim lead
                </Button>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-[22px] gap-y-2 text-[0.86rem] text-muted-foreground">
              <FloatPicker
                disabled={!canEdit}
                className="w-56 p-1.5"
                trigger={
                  <span className="flex items-center gap-1.5 rounded-md px-1 font-semibold text-foreground hover:bg-muted/70">
                    <Building2 className="h-[15px] w-[15px]" />
                    <span className="font-mono text-[0.82rem]">{budgetLine ?? "Add budget"}</span>
                  </span>
                }
              >
                {(close) => (
                  <div className="grid gap-0.5">
                    {(fieldOptions.budget ?? []).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className="rounded-md px-2.5 py-1.5 text-left text-[0.84rem] hover:bg-muted"
                        onClick={() => {
                          const min = Number(opt.extra.min_fils);
                          const max = Number(opt.extra.max_fils);
                          saveField({ budget_min: min, budget_max: max }, { budget_min: min, budget_max: max }, false);
                          close();
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </FloatPicker>
              <FloatPicker
                disabled={!canEdit}
                className="w-[20rem] p-3"
                trigger={
                  <span
                    className="flex min-w-0 max-w-full items-center gap-1.5 px-1 hover:bg-muted/70"
                    title={optimisticLead.preferred_areas?.join(" · ")}
                  >
                    <MapPin className="h-[15px] w-[15px] shrink-0" />
                    {optimisticLead.preferred_areas?.length ? (
                      <>
                        <span className="min-w-0 truncate font-semibold text-foreground">
                          {optimisticLead.preferred_areas[0]}
                        </span>
                        {optimisticLead.preferred_areas.length > 1 ? (
                          <span className="shrink-0 rounded-full border border-border bg-muted px-1.5 py-px text-[0.68rem] font-bold tabular-nums text-muted-foreground">
                            +{optimisticLead.preferred_areas.length - 1}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      "Add areas"
                    )}
                  </span>
                }
              >
                {() => (
                  <PreferredAreasPicker
                    compact
                    areas={areas}
                    value={optimisticLead.preferred_areas ?? []}
                    onChange={(value) => saveField({ preferred_areas: value }, { preferred_areas: value }, false)}
                  />
                )}
              </FloatPicker>
              <span className="flex min-w-[10rem] items-center gap-1.5">
                <Phone className="h-[15px] w-[15px] shrink-0" />
                <QuietSaveInput
                  value={contactPhone ?? ""}
                  disabled={!canEditContact}
                  placeholder="WhatsApp"
                  className={`font-mono text-[0.82rem]${!canEditContact ? " text-secondary" : ""}`}
                  onSave={(next) => saveField({ phone: next.trim() || null }, { phone: next.trim() || null })}
                />
              </span>
              <span className="flex min-w-[12rem] items-center gap-1.5">
                <Phone className="h-[15px] w-[15px] shrink-0 text-muted-foreground" />
                <QuietSaveInput
                  value={(optimisticLead.call_numbers ?? []).join(", ")}
                  disabled={!canEdit}
                  placeholder="Call numbers"
                  className="font-mono text-[0.82rem]"
                  onSave={(next) => {
                    const nums = next
                      .split(",")
                      .map((n) => n.trim())
                      .filter(Boolean);
                    saveField({ call_numbers: nums }, { call_numbers: nums });
                  }}
                />
              </span>
              <span className="flex min-w-[14rem] flex-1 items-center gap-1.5">
                <Mail className="h-[15px] w-[15px] shrink-0" />
                <QuietSaveInput
                  type="email"
                  value={contactEmail ?? ""}
                  disabled={!canEditContact}
                  placeholder="Add email"
                  className={!canEditContact ? "text-secondary" : undefined}
                  onSave={(next) => saveField({ email: next.trim() || null }, { email: next.trim() || null })}
                />
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-3 md:items-end">
            <div className="flex gap-2">
              <IconBtn href={phoneHref} label="Call" onClick={() => logContact("call")}><Phone className="h-[18px] w-[18px]" /></IconBtn>
              <IconBtn href={waLink} label="WhatsApp" onClick={() => logContact("whatsapp")}><MessageCircle className="h-[18px] w-[18px]" /></IconBtn>
              <IconBtn href={mailLink} label="Email" onClick={() => logContact("email")}><Mail className="h-[18px] w-[18px]" /></IconBtn>
              <DropdownMenu>
                <DropdownMenuTrigger className="grid h-10 w-10 place-items-center rounded-[10px] border border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground">
                  <MoreHorizontal className="h-[18px] w-[18px]" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {lostStage && (
                    <DropdownMenuItem onClick={() => handleStageChange(lostStage.id)}>
                      Mark as lost
                    </DropdownMenuItem>
                  )}
                  {junkStage && (
                    <DropdownMenuItem onClick={() => handleStageChange(junkStage.id)}>
                      Mark as junk
                    </DropdownMenuItem>
                  )}
                  {canManage && (
                    <DropdownMenuItem variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                      Delete lead
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {canEdit ? (
              <DocumentUploadDialog
                entityType="lead"
                entityId={optimisticLead.id}
                categories={kycDocCategories.length > 0 ? kycDocCategories : docCategoryChoices(fieldOptions.doc_category)}
                onSaved={(doc) => {
                  if (doc) setOptimisticDocs((prev) => [{ ...doc, category: doc.category || "other" }, ...prev]);
                  router.refresh();
                }}
                trigger={
                  <span className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-border bg-card px-5 text-[0.88rem] font-semibold text-muted-foreground hover:border-foreground hover:text-foreground">
                    <Upload className="h-4 w-4" /> Upload document
                  </span>
                }
              />
              ) : null}
              {deal ? (
                <Link
                  href={`/pipeline/${deal.id}`}
                  className="inline-flex h-[42px] items-center gap-2 rounded-[10px] bg-secondary px-5 text-[0.88rem] font-semibold text-white hover:bg-secondary/90"
                >
                  Open deal <ArrowRight className="h-4 w-4" />
                </Link>
              ) : canEdit ? (
                <button
                  type="button"
                  onClick={() => setConverting(true)}
                  className="inline-flex h-[42px] items-center gap-2 rounded-[10px] bg-secondary px-5 text-[0.88rem] font-semibold text-white hover:bg-secondary/90"
                >
                  Convert to deal <ArrowRight className="h-4 w-4" />
                </button>
              ) : null}
              {customer?.status === "active" && (
                <Link
                  href={`/customers/${customer.id}`}
                  className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-border bg-card px-5 text-[0.88rem] font-semibold text-muted-foreground hover:border-foreground hover:text-foreground"
                >
                  Open customer
                </Link>
              )}
            </div>
            <div className="mt-1 space-y-0.5 text-right text-[0.72rem] leading-snug text-muted-foreground">
              <p>
                Lead created{" "}
                <span className="font-medium text-foreground" title={formatDateTime(optimisticLead.created_at)}>
                  {formatDate(optimisticLead.created_at)}
                </span>
              </p>
              <p>
                Last updated{" "}
                <span className="font-medium text-foreground" title={formatDateTime(optimisticLead.updated_at)}>
                  {timeAgo(optimisticLead.updated_at)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {pipelineStages.length > 0 && (
          <div className="relative border-t border-border/80 px-6 pb-12 pt-10 md:px-8">
            <div className="relative">
              <div className="relative h-[5px] rounded-full bg-border">
                <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${fillPct}%` }} />
              </div>
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-12 -translate-y-1/2">
                {pipelineStages.map((stage, idx) => {
                  const lastIdx = pipelineStages.length - 1;
                  const left = lastIdx <= 0 ? 0 : (idx / lastIdx) * 100;
                  const isCurrent = idx === currentIdx;
                  const isDone = currentIdx >= 0 && idx < currentIdx;
                  const isFirst = idx === 0;
                  const isLast = idx === lastIdx;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      disabled={!canEdit || pending}
                      onClick={() => handleStageChange(stage.id)}
                      aria-label={stage.name}
                      className={`pointer-events-auto group absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center ${
                        isFirst
                          ? "left-0 translate-x-0 justify-start"
                          : isLast
                            ? "right-0 translate-x-0 justify-end"
                            : "-translate-x-1/2"
                      }`}
                      style={isFirst || isLast ? undefined : { left: `${left}%` }}
                    >
                      {isDone && (
                        <Check className="pointer-events-none absolute -top-1 h-[13px] w-[13px] text-primary group-hover:opacity-0" />
                      )}
                      <span
                        aria-hidden
                        className={
                          isCurrent
                            ? "h-[13px] w-[13px] rotate-45 rounded-[2px] border-2 border-primary bg-primary shadow-[0_0_0_5px_var(--accent)] transition-all duration-200 group-hover:bg-transparent group-hover:shadow-[0_0_0_3px_rgba(255,255,255,0.9),0_0_18px_6px_rgba(37,99,235,0.65)]"
                            : `h-3 w-[1.5px] rotate-0 rounded-none border-0 bg-[#C9C6BB] transition-all duration-200 group-hover:h-[13px] group-hover:w-[13px] group-hover:rotate-45 group-hover:rounded-[2px] group-hover:border-2 group-hover:border-primary group-hover:bg-transparent group-hover:shadow-[0_0_0_3px_rgba(255,255,255,0.9),0_0_16px_6px_rgba(37,99,235,0.6)] ${
                                isDone ? "bg-primary group-hover:border-primary" : "bg-[#C9C6BB]"
                              }`
                        }
                      />
                      <span
                        className={`pointer-events-none absolute top-[calc(100%-6px)] max-w-[7.5rem] text-center text-[0.68rem] font-medium leading-tight tracking-wide group-hover:opacity-0 ${
                          isFirst ? "left-0 text-left" : isLast ? "right-0 text-right" : "left-1/2 -translate-x-1/2"
                        } ${
                          isCurrent
                            ? "font-bold uppercase tracking-[0.08em] text-secondary"
                            : isDone
                              ? "text-muted-foreground"
                              : "hidden text-muted-foreground md:block"
                        }`}
                      >
                        {stage.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      <LeadPageTabs
        value={leadPage}
        onChange={setLeadPage}
        kycDisabled={!customer || !kycPerson}
      />

      {leadPage === "overview" ? (
      <div className="grid grid-cols-1 items-start gap-[18px] xl:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <section className="rounded-[14px] border border-border bg-card px-[22px] py-4">
            <h2 className="mb-3 text-center font-heading text-[1.12rem]" style={{ fontFamily: "var(--font-display), serif" }}>Lead snapshot</h2>
            <div className="grid grid-cols-1 items-start gap-x-0 gap-y-5 md:grid-cols-2 md:gap-x-8">
              <div className="flex min-w-0 flex-col gap-5">
              <SnapshotBlock title="Contact">
                <LedgerRow label="Name" overlay>
                  <div>
                    <QuietSaveInput
                      value={contactName}
                      disabled={!canEditContact}
                      className={!canEditContact ? "text-secondary font-medium" : undefined}
                      onSave={(next) => {
                        if (!next.trim()) return;
                        saveField({ name: next.trim() }, { name: next.trim() });
                      }}
                    />
                    {existingOwner && customer ? (
                      <p className="px-1 text-[0.7rem] font-medium text-secondary">
                        Locked to customer: {customer.name}
                      </p>
                    ) : null}
                  </div>
                </LedgerRow>
                <LedgerRow label="Nationality" overlay>
                  <div>
                    <FloatPicker
                      disabled={!canEditContact}
                      className="w-[18rem] p-2"
                      trigger={
                        <span className={`block px-1 py-0.5 text-[0.86rem]${!canEditContact ? " font-medium text-secondary" : ""}`}>
                          {contactNationality || emptyValue()}
                        </span>
                      }
                    >
                      {(close) => (
                        <NationalityPicker
                          value={contactNationality ?? ""}
                          options={nationalities}
                          autoFocus
                          onCancel={close}
                          onChange={(next) => {
                            saveField({ nationality: next || null }, { nationality: next || null });
                            close();
                          }}
                        />
                      )}
                    </FloatPicker>
                    {existingOwner && customer ? (
                      <p className="px-1 text-[0.7rem] font-medium text-secondary">
                        Locked to customer: {customer.nationality?.trim() || "nationality not on file"}
                      </p>
                    ) : null}
                  </div>
                </LedgerRow>
                <LedgerRow label="Source" overlay>
                  <ChoicePicker
                    value={optimisticLead.source}
                    options={choiceItems(fieldOptions.source)}
                    disabled={!canEdit}
                    onChange={(v) => saveField({ source: v }, { source: v })}
                  />
                </LedgerRow>
              </SnapshotBlock>

              <SnapshotBlock title="Financing">
                <LedgerRow label="Budget" overlay>
                  <FloatPicker
                    disabled={!canEdit}
                    className="w-[18rem] p-3"
                    trigger={
                      <span className="block px-1 py-0.5 font-mono text-[0.82rem]">
                        {budgetLine ?? emptyValue()}
                      </span>
                    }
                  >
                    {(close) => (
                      <div className="grid gap-0.5">
                        {(fieldOptions.budget ?? []).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            className="rounded-md px-2.5 py-1.5 text-left text-[0.84rem] hover:bg-muted"
                            onClick={() => {
                              const min = Number(opt.extra.min_fils);
                              const max = Number(opt.extra.max_fils);
                              saveField({ budget_min: min, budget_max: max }, { budget_min: min, budget_max: max }, false);
                              close();
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </FloatPicker>
                </LedgerRow>
                <LedgerRow label="Financing" overlay>
                  <ChoicePicker
                    value={optimisticLead.financing}
                    options={choiceItems(fieldOptions.financing)}
                    disabled={!canEdit}
                    onChange={(v) => saveField({ financing: v || null }, { financing: v || null })}
                  />
                </LedgerRow>
                <LedgerRow label="Timeframe" overlay>
                  <ChoicePicker
                    value={optimisticLead.timeframe}
                    options={choiceItems(fieldOptions.timeframe)}
                    disabled={!canEdit}
                    onChange={(v) => saveField({ timeframe: v || null }, { timeframe: v || null })}
                  />
                </LedgerRow>
              </SnapshotBlock>
              </div>

              <div className="flex min-w-0 flex-col gap-5 md:border-l md:border-border/70 md:pl-8">
                <SnapshotBlock title="Tastes">
                  <LedgerRow label="Interest" overlay>
                    <ChoicePicker
                      value={optimisticLead.interest}
                      options={choiceItems(fieldOptions.interest)}
                      disabled={!canEdit}
                      onChange={(v) => saveField({ interest: v }, { interest: v })}
                    />
                  </LedgerRow>
                  <LedgerRow label="Category" overlay>
                    <ChoicePicker
                      value={optimisticLead.category}
                      options={choiceItems(fieldOptions.category)}
                      disabled={!canEdit}
                      onChange={(v) => saveField({ category: v || null }, { category: v || null })}
                    />
                  </LedgerRow>
                  <LedgerRow label="Preferred areas" overlay>
                    <FloatPicker
                      disabled={!canEdit}
                      className="w-[20rem] p-3"
                      trigger={
                        <span className="block px-1 py-0.5 text-[0.86rem]">
                          {optimisticLead.preferred_areas?.length ? (
                            <span className="flex flex-wrap gap-1">
                              {optimisticLead.preferred_areas.map((area) => (
                                <span key={area} className="rounded-full border border-border bg-muted px-2 py-0.5 text-[0.75rem] text-muted-foreground">{area}</span>
                              ))}
                            </span>
                          ) : emptyValue()}
                        </span>
                      }
                    >
                      {() => (
                        <PreferredAreasPicker
                          compact
                          areas={areas}
                          value={optimisticLead.preferred_areas ?? []}
                          onChange={(value) => saveField({ preferred_areas: value }, { preferred_areas: value }, false)}
                        />
                      )}
                    </FloatPicker>
                  </LedgerRow>
                  <LedgerRow label="Bedrooms" overlay>
                    <ChoicePicker
                      value={optimisticLead.bedrooms}
                      options={choiceItems(fieldOptions.bedrooms)}
                      disabled={!canEdit}
                      onChange={(v) => saveField({ bedrooms: v || null }, { bedrooms: v || null })}
                    />
                  </LedgerRow>
                  <LedgerRow label="Purpose" overlay>
                    <ChoicePicker
                      value={optimisticLead.purpose}
                      options={choiceItems(fieldOptions.purpose)}
                      disabled={!canEdit}
                      onChange={(v) => saveField({ purpose: v || null }, { purpose: v || null })}
                    />
                  </LedgerRow>
                </SnapshotBlock>

                <SnapshotBlock title="Notes">
                  <LedgerRow label="Tags" overlay>
                    <FloatPicker
                      disabled={!canEdit}
                      className="w-[20rem] p-3"
                      trigger={
                        <span className="block px-1 py-0.5 text-[0.86rem]">
                          {(optimisticLead.tags ?? []).length ? (
                            <span className="flex flex-wrap gap-1">
                              {(optimisticLead.tags ?? []).map((tag) => (
                                <span key={tag} className="rounded-full border border-border bg-muted px-2 py-0.5 text-[0.75rem] text-muted-foreground">
                                  {optionLabel(fieldOptions.tags, tag)}
                                </span>
                              ))}
                            </span>
                          ) : emptyValue()}
                        </span>
                      }
                    >
                      {() => (
                        <OptionMultiPicker
                          value={optimisticLead.tags ?? []}
                          options={choiceItems(fieldOptions.tags)}
                          onChange={(tags) => saveField({ tags }, { tags }, false)}
                        />
                      )}
                    </FloatPicker>
                  </LedgerRow>
                  <LedgerRow
                    label="Notes"
                    editing={editing === "notes"}
                    canEdit={canEdit}
                    onEdit={() => setEditing("notes")}
                    display={optimisticLead.notes ? <div className="py-0.5 text-[0.84rem] leading-relaxed text-muted-foreground">{optimisticLead.notes}</div> : emptyValue()}
                  >
                    <Textarea autoFocus rows={2} defaultValue={optimisticLead.notes ?? ""} className="text-sm" onBlur={(e) => {
                      const next = e.target.value.trim() || null;
                      if (next === (optimisticLead.notes || null)) return setEditing(null);
                      saveField({ notes: next }, { notes: next });
                    }} onKeyDown={(e) => { if (e.key === "Escape") setEditing(null); }} />
                  </LedgerRow>
                </SnapshotBlock>
              </div>
            </div>
          </section>

          <LeadProposedPropertySection
            leadId={optimisticLead.id}
            dealId={deal?.id ?? optimisticLead.converted_deal_id}
            clientName={contactName}
            clientPhone={contactPhone}
            linked={proposedProperties}
            inventory={inventory}
            agents={agents}
            defaultAgentId={optimisticLead.assigned_to ?? userId}
            canEdit={canEdit}
            canCreateProperty={canManage}
            defaultListingType={
              optimisticLead.interest === "rent"
                ? "rent"
                : optimisticLead.interest === "off_plan"
                  ? "off_plan"
                  : "sale"
            }
          />

          <section className="overflow-hidden rounded-[14px] border border-primary/25 bg-card">
            <div className="bg-primary px-[22px] py-3.5 text-white">
              <h2 className="font-heading text-[1.12rem] text-white" style={{ fontFamily: "var(--font-display), serif" }}>
                Activity
              </h2>
              <p className="mt-0.5 text-[0.8rem] text-white/70">
                Follow-ups, viewings, and contact notes
              </p>
            </div>
            <div className="bg-primary/5 px-[22px] py-4">
              {timelineLoading && importantActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading timeline…</p>
              ) : importantActivity.length === 0 ? (
                <p className="rounded-[12px] border border-dashed border-primary/20 bg-white/70 px-4 py-6 text-center text-sm text-muted-foreground">
                  No follow-ups, viewings, or contact attempts yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {visibleActivity.map((a) => {
                    const detail = activityDetail(a);
                    return (
                      <li
                        key={a.id}
                        className="rounded-[12px] border border-primary/15 bg-white px-3 py-2.5"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-[0.9rem] font-semibold text-foreground">
                            {activityKindLabel(a)}
                          </p>
                          <time
                            className="shrink-0 text-[0.72rem] tabular-nums text-primary/80"
                            dateTime={a.occurred_at}
                            title={formatDateTime(a.occurred_at)}
                          >
                            {formatDateTime(a.occurred_at)}
                          </time>
                        </div>
                        <p className="mt-0.5 text-[0.72rem] text-muted-foreground" title={formatDateTime(a.occurred_at)}>
                          {shortTimeAgo(a.occurred_at)}
                          {a.authorName ? ` · ${a.authorName}` : ""}
                        </p>
                        {detail ? (
                          <p className="mt-1.5 max-w-[60ch] text-[0.82rem] leading-relaxed text-muted-foreground">
                            {detail}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
              {importantActivity.length > 5 ? (
                <button
                  type="button"
                  className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1 rounded-[10px] border border-dashed border-primary/25 text-[0.8rem] font-semibold text-primary/80 hover:border-primary/50 hover:text-primary"
                  onClick={() => setActivityExpanded((v) => !v)}
                >
                  {activityExpanded ? "Show less" : `Show ${importantActivity.length - 5} more`}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${activityExpanded ? "rotate-180" : ""}`} />
                </button>
              ) : null}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-[18px]">
          <section
            id="contact-attempts-section"
            className={`rounded-[14px] border px-[26px] py-6 text-[#7c2d12] transition-shadow ${
              contactedStage
                ? "border-[#ea580c] bg-[#fff7ed] ring-2 ring-[#fb923c]/40"
                : "border-[#fdba74] bg-[#fff7ed]"
            }`}
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="font-heading text-[1.12rem] text-[#9a3412]" style={{ fontFamily: "var(--font-display), serif" }}>
                Contact Attempts
              </h2>
              <span className="rounded-full bg-[#ea580c] px-2.5 py-0.5 text-[0.72rem] font-bold tabular-nums text-white">
                {contactAttempts.length}
              </span>
            </div>
            <p className="mb-4 text-[0.78rem] text-[#9a3412]/75">Log how you reached out to this lead.</p>
            <div className="flex gap-2">
              {([
                { key: "whatsapp" as const, label: "WhatsApp", icon: <MessageCircle className="h-5 w-5" /> },
                { key: "call" as const, label: "Call", icon: <Phone className="h-5 w-5" /> },
                { key: "email" as const, label: "Email", icon: <Mail className="h-5 w-5" /> },
                { key: "in_person" as const, label: "In Person", icon: <UserRound className="h-5 w-5" /> },
              ]).map((m) => (
                <button
                  key={m.key}
                  type="button"
                  title={m.label}
                  onClick={() => setContactMethod(contactMethod === m.key ? null : m.key)}
                  className={`grid h-11 w-11 place-items-center rounded-[10px] border transition-colors ${
                    contactMethod === m.key
                      ? "border-[#ea580c] bg-[#ea580c] text-white"
                      : "border-[#fdba74] bg-white text-[#c2410c] hover:border-[#ea580c] hover:bg-[#ffedd5]"
                  }`}
                >
                  {m.icon}
                </button>
              ))}
            </div>
            <Textarea
              rows={2}
              value={contactNote}
              onChange={(e) => setContactNote(e.target.value)}
              placeholder="What happened? e.g. Left voicemail, scheduled callback…"
              className="mt-3 min-h-[60px] resize-none border-[#fdba74] bg-white text-sm text-foreground"
            />
            <Button
              size="sm"
              className="mt-3 w-full bg-[#ea580c] text-white hover:bg-[#c2410c]"
              disabled={!contactMethod || pending}
              onClick={() => {
                if (!contactMethod) return;
                const label = contactMethod === "in_person" ? "In-person" : contactMethod.charAt(0).toUpperCase() + contactMethod.slice(1);
                const summary = contactNote.trim()
                  ? `${label}: ${contactNote.trim()}`
                  : `${label} contact attempt`;
                const now = new Date().toISOString();
                setTimelineItems((prev) => [
                  {
                    id: `opt_ca_${Date.now()}`,
                    source: "activity",
                    type: contactMethod,
                    summary,
                    occurred_at: now,
                    authorName: "You",
                    isSystem: false,
                  },
                  ...prev,
                ]);
                setActivityCount((n) => n + 1);
                startTransition(async () => {
                  const result = await addLeadActivity(optimisticLead.id, contactMethod, summary);
                  if (result.ok) {
                    toast.success("Contact attempt logged");
                    setContactMethod(null);
                    setContactNote("");
                    router.refresh();
                  } else {
                    setTimelineItems(initialTimeline);
                    setActivityCount(initialActivityCount);
                    toast.error(result.error ?? "Failed");
                  }
                });
              }}
            >
              Save
            </Button>
            <div className="mt-4 border-t border-[#fdba74] pt-3">
              <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#9a3412]/70">History</p>
              {contactAttempts.length === 0 ? (
                <p className="text-[0.8rem] text-[#9a3412]/65">No attempts logged yet.</p>
              ) : (
                <>
                  <ul className="space-y-2">
                    {visibleContactAttempts.map((item) => (
                      <li key={item.id} className="rounded-lg border border-[#fed7aa] bg-white px-2.5 py-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[0.78rem] font-semibold capitalize text-[#9a3412]">
                            {item.type === "in_person" ? "In person" : item.type}
                          </span>
                          <span className="shrink-0 text-[0.68rem] text-[#c2410c]/80" title={formatDateTime(item.occurred_at)}>
                            {shortTimeAgo(item.occurred_at)}
                          </span>
                        </div>
                        {item.summary ? (
                          <p className="mt-0.5 text-[0.78rem] leading-snug text-foreground/80">{item.summary}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  {contactAttempts.length > 3 ? (
                    <button
                      type="button"
                      className="mt-2 inline-flex w-full items-center justify-center gap-1 text-[0.75rem] font-semibold text-[#c2410c] hover:text-[#9a3412]"
                      onClick={() => setContactHistoryOpen((v) => !v)}
                    >
                      {contactHistoryOpen ? "Show less" : `Show ${contactAttempts.length - 3} more`}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${contactHistoryOpen ? "rotate-180" : ""}`} />
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-[14px] border border-[#d4c4a8] bg-[#fbf7f0]">
            <div className="border-b border-[#eadfcb] bg-[#f3ead8] px-[22px] py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#8a6a32]">Next step</p>
              <h2 className="mt-1 font-heading text-[1.2rem] text-[#1f2933]" style={{ fontFamily: "var(--font-display), serif" }}>
                {followUpTitle()}
              </h2>
              <p className="mt-1.5 text-[0.86rem] leading-relaxed text-[#4b5563]">
                {optimisticLead.next_follow_up_at ? (
                  <>
                    <span className="font-medium text-[#1f2933]">{formatDateTime(optimisticLead.next_follow_up_at)}</span>
                    {isOverdue(optimisticLead.next_follow_up_at) ? " · overdue" : ""}
                    {scheduledFollowUp?.notes ? (
                      <span className="mt-1 block text-[#4b5563]">{scheduledFollowUp.notes}</span>
                    ) : null}
                  </>
                ) : firstResponse?.tone === "overdue" ? (
                  <>First contact is overdue ({firstResponse.label}). Call or WhatsApp now.</>
                ) : slaClock?.overdue ? (
                  <>Past the {currentStage?.name} SLA ({slaClock.dayNum} of {slaClock.sla} days). Set a follow-up.</>
                ) : (
                  <>No follow-up yet. Pick a time so this lead does not go cold.</>
                )}
              </p>
            </div>
            <div className="px-[22px] py-4">
              <div className="flex items-center gap-2.5 rounded-xl border border-[#eadfcb] bg-white px-3 py-2.5">
                <div className="grid h-[36px] w-[36px] place-items-center rounded-full bg-[#EDEBF4] font-heading text-[0.78rem] text-secondary" style={{ fontFamily: "var(--font-display), serif" }}>
                  {optimisticLead.assigned_to_profile ? initials(optimisticLead.assigned_to_profile.full_name) : "—"}
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Assigned agent</p>
                  <b className="block text-[0.9rem] font-semibold text-foreground">{optimisticLead.assigned_to_profile?.full_name ?? "Unassigned"}</b>
                  <span className="text-[0.72rem] capitalize text-muted-foreground">{optimisticLead.assigned_to_profile?.role ?? "No agent yet"}</span>
                </div>
                {canManage && (
                  <Select value={optimisticLead.assigned_to ?? "unassigned"} onValueChange={(v) => handleAssign(v === "unassigned" ? null : v ?? null)}>
                    <SelectTrigger className="h-8 w-auto border-border bg-muted px-2 text-[0.78rem] font-semibold text-foreground shadow-none">
                      <span>Reassign</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {agents.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {showFollowUpForm ? (
                <div className="mt-3 space-y-2">
                  <Input type="datetime-local" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="h-9 border-[#eadfcb] bg-white text-sm text-foreground" />
                  <Input value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)} placeholder="What this is for — call, WhatsApp, viewing…" className="h-9 border-[#eadfcb] bg-white text-sm text-foreground" />
                  <div className="flex gap-2">
                    <button type="button" className="h-10 flex-1 rounded-[10px] bg-secondary text-[0.86rem] font-semibold text-white hover:bg-secondary/90" onClick={handleScheduleFollowUp} disabled={!followUpDate || pending}>Save</button>
                    <button type="button" className="h-10 flex-1 rounded-[10px] border border-[#eadfcb] bg-white text-[0.86rem] font-semibold text-foreground" onClick={() => setShowFollowUpForm(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2.5">
                  <button type="button" className="inline-flex h-10 flex-1 items-center justify-center rounded-[10px] bg-secondary text-[0.86rem] font-semibold text-white hover:bg-secondary/90" onClick={() => setShowFollowUpForm(true)}>
                    {optimisticLead.next_follow_up_at ? "Change follow-up" : "Set follow-up"}
                  </button>
                  {optimisticLead.next_follow_up_at ? (
                    <button
                      type="button"
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-[10px] border border-[#eadfcb] bg-white text-[0.86rem] font-semibold text-foreground hover:bg-[#f3ead8]"
                      disabled={pending}
                      onClick={handleMarkDone}
                    >
                      Mark done
                    </button>
                  ) : null}
                </div>
              )}
              {pastFollowUps.length > 0 ? (
                <div className="mt-4 border-t border-[#eadfcb] pt-3">
                  <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#8a6a32]/80">
                    History
                  </p>
                  <ul className="space-y-2">
                    {visiblePastFollowUps.map((row) => (
                      <li key={row.id} className="rounded-lg border border-[#eadfcb] bg-white px-2.5 py-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[0.78rem] font-semibold capitalize text-[#1f2933]">
                            {row.status.replace(/_/g, " ")}
                          </span>
                          <span className="shrink-0 text-[0.68rem] text-[#8a6a32]/80" title={formatDateTime(row.scheduled_at)}>
                            {formatDateTime(row.scheduled_at)}
                          </span>
                        </div>
                        {row.notes ? (
                          <p className="mt-0.5 text-[0.78rem] leading-snug text-foreground/80">{row.notes}</p>
                        ) : null}
                        {row.completed_at ? (
                          <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
                            Done {formatDateTime(row.completed_at)}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  {pastFollowUps.length > 3 ? (
                    <button
                      type="button"
                      className="mt-2 inline-flex w-full items-center justify-center gap-1 text-[0.75rem] font-semibold text-[#8a6a32] hover:text-[#1f2933]"
                      onClick={() => setFollowUpHistoryOpen((v) => !v)}
                    >
                      {followUpHistoryOpen ? "Show less" : `Show ${pastFollowUps.length - 3} more`}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${followUpHistoryOpen ? "rotate-180" : ""}`} />
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          <div
            id="viewings-section"
            className={viewingScheduled ? "rounded-[14px] ring-2 ring-[#7c3aed]/40" : undefined}
          >
            <ViewingPanel
              leadId={optimisticLead.id}
              dealId={optimisticLead.converted_deal_id}
              viewings={viewings}
              properties={inventory}
              agents={agents}
              defaultAgentId={optimisticLead.assigned_to}
              canEdit={canEdit}
            />
          </div>

          <section className="rounded-[14px] border border-border bg-card px-[26px] py-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-heading text-[1.12rem]" style={{ fontFamily: "var(--font-display), serif" }}>Lead score</h2>
              {scoreBand ? (
                <span className="rounded-full border border-[#D6E0E9] bg-[#E9EEF3] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#44607A]">{scoreBand.label}</span>
              ) : null}
            </div>
            <div className="mt-3.5 font-heading text-[2.6rem] leading-none" style={{ fontFamily: "var(--font-display), serif" }}>
              {score}<small className="ml-1 font-sans text-base text-muted-foreground">/ 100</small>
            </div>
            <div className="mt-4 h-[5px] overflow-hidden rounded-[3px] bg-border">
              <i className="block h-full rounded-[3px] bg-linear-to-r from-primary to-secondary" style={{ width: `${Math.min(100, score)}%` }} />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[0.68rem] text-muted-foreground">
              <span>0</span><span>{scoreLegend || "Set bands in Lead Settings"}</span><span>100</span>
            </div>
            {(fieldOptions.score ?? []).length > 0 && canEdit ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(fieldOptions.score ?? []).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`rounded-full border px-2.5 py-1 text-[0.72rem] font-medium ${
                      scoreBand?.id === opt.id ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-foreground"
                    }`}
                    onClick={() => {
                      const next = scoreFromBand(opt);
                      saveField({ score: next }, { score: next });
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="mt-4 border-t border-border/70">
              {firstResponse ? (
                <div className="border-b border-border/70 py-2.5 text-[0.84rem]">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">First response</span>
                    <b className={firstResponse.tone === "overdue" ? "text-red-700" : "text-amber-700"}>
                      {firstResponse.label}
                    </b>
                  </div>
                  <p className="mt-1 text-[0.72rem] leading-snug text-muted-foreground">{firstResponse.title}</p>
                </div>
              ) : null}
              <div className="border-b border-border/70 py-2.5 text-[0.84rem]">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Time in this stage</span>
                  <b className={slaClock?.overdue ? "text-red-700" : undefined}>
                    {slaClock
                      ? `${slaClock.dayNum} of ${slaClock.sla} days${slaClock.overdue ? " · overdue" : ""}`
                      : "No limit set"}
                  </b>
                </div>
                <p className="mt-1 text-[0.72rem] leading-snug text-muted-foreground">
                  {slaClock
                    ? `How long this lead has sat in ${currentStage?.name ?? "this stage"}. Move them within ${slaClock.sla} days.`
                    : "Set a stage SLA in Lead Settings to track how long a lead sits here."}
                </p>
              </div>
              <div className="flex justify-between border-b border-border/70 py-2.5 text-[0.84rem]"><span className="text-muted-foreground">Engagement</span><b>{engagement}</b></div>
              <div className="flex justify-between border-b border-border/70 py-2.5 text-[0.84rem]"><span className="text-muted-foreground">Last activity</span><b className="font-mono text-[0.8rem]">{timeAgo(lastTouch)}</b></div>
              <div className="flex justify-between border-b border-border/70 py-2.5 text-[0.84rem]"><span className="text-muted-foreground">First contact</span><b className="font-mono text-[0.8rem]">{formatDate(optimisticLead.created_at)}</b></div>
              <div className="flex justify-between py-2.5 text-[0.84rem]"><span className="text-muted-foreground">Timeline entries</span><b className="font-mono text-[0.8rem]">{activityCount}</b></div>
            </div>
          </section>

          <LeadAssignmentHistory assignments={assignments} />

          <MatchPanel
            matches={matches}
            leadId={optimisticLead.id}
            dealId={optimisticLead.converted_deal_id}
            canEdit={canEdit}
          />
        </div>
      </div>
      ) : null}

      {leadPage === "documents" ? (
        <LeadDocumentsPage
          uploadEntityType="lead"
          uploadEntityId={optimisticLead.id}
          customerId={customer?.id}
          documents={mergedDocuments}
          categories={kycDocCategories}
          canEdit={canEdit}
          onDocumentSaved={(doc) => {
            if (doc) setOptimisticDocs((prev) => [{ ...doc, category: doc.category || "other" }, ...prev]);
            router.refresh();
          }}
          onDocumentDeleted={(docId) => {
            setOptimisticDocs((prev) => prev.filter((d) => d.id !== docId));
          }}
          onDocumentUpdated={(doc) => {
            setOptimisticDocs((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
          }}
          propertyChoices={inventory.map((unit) => ({
            id: unit.id,
            label: [unit.property_code, unit.community, unit.building_name, unit.unit_number].filter(Boolean).join(" · "),
          }))}
          defaultPropertyId={viewings.find((row) => row.property_id)?.property_id ?? null}
        />
      ) : null}

      {leadPage === "kyc" && customer && kycPerson ? (
        <LeadKycPage
          leadId={optimisticLead.id}
          customerId={customer.id}
          customerHref={`/customers/${customer.id}`}
          person={kycPerson}
          canEdit={canEdit}
          documents={mergedDocuments}
          onDocumentSaved={(doc) => {
            if (doc) setOptimisticDocs((prev) => [{ ...doc, category: doc.category || "other" }, ...prev]);
          }}
          onDocumentDeleted={(docId) => {
            setOptimisticDocs((prev) => prev.filter((d) => d.id !== docId));
          }}
        />
      ) : leadPage === "kyc" ? (
        <div className="rounded-[14px] border border-border bg-card p-6 text-sm text-muted-foreground">
          Person record required for KYC. Open this lead again in a moment or refresh the page.
        </div>
      ) : null}

      <ConvertLeadDialog
        open={converting}
        onOpenChange={setConverting}
        lead={{
          id: optimisticLead.id,
          name: optimisticLead.name,
          phone: optimisticLead.phone,
          email: optimisticLead.email,
          nationality: personKyc?.nationality ?? optimisticLead.nationality,
          interest: optimisticLead.interest,
          budget_min: optimisticLead.budget_min,
          budget_max: optimisticLead.budget_max,
          preferred_areas: optimisticLead.preferred_areas,
          bedrooms: optimisticLead.bedrooms,
          category: optimisticLead.category,
          financing: optimisticLead.financing,
          emirates_id: personKyc?.emirates_id ?? customer?.emirates_id ?? null,
          passport_no: personKyc?.passport_no ?? customer?.passport_no ?? null,
          trn: personKyc?.trn ?? customer?.trn ?? null,
        }}
      />

      <Dialog open={reasonDialog !== null} onOpenChange={(open) => { if (!open) setReasonDialog(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Move to {reasonDialog?.stageName}</DialogTitle></DialogHeader>
          <Select value={selectedReason} onValueChange={(v) => setSelectedReason(v ?? "")}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select a reason" /></SelectTrigger>
            <SelectContent>
              {(reasonDialog?.kind === "junk" ? choiceItems(fieldOptions.junk_reason) : choiceItems(fieldOptions.lost_reason)).map((reason) => (
                <SelectItem key={reason.value} value={reason.value}>{reason.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReasonDialog(null)}>Cancel</Button>
            <Button size="sm" onClick={handleReasonConfirm} disabled={!selectedReason || pending}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete lead</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete {optimisticLead.name}? This permanently removes the lead and cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" disabled={pending} onClick={() => {
              startTransition(async () => {
                const result = await deleteLead(optimisticLead.id);
                if (result.ok) { toast.success("Lead deleted"); router.push("/leads"); }
                else toast.error(result.error ?? "Failed");
              });
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
