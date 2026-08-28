"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
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
import { ConversionPath } from "@/components/crm/conversion-path";
import { ViewingPanel, type ViewingRow, type InventoryChoice } from "@/components/crm/viewing-panel";
import { MatchPanel } from "@/components/crm/match-panel";
import { LeadDocumentsList, type LeadDocument } from "@/components/leads/lead-documents";
import { LeadAssignmentHistory } from "@/components/leads/lead-assignment-history";
import type { LeadAssignmentRow, LeadEventRow } from "@/lib/lead-audit";
import { filterTimelineItems, mergeLeadTimeline } from "@/lib/lead-timeline";
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
  Loader2,
  Upload,
  ArrowRight,
  MapPin,
  Building2,
  Check,
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
  assigned_to: string | null;
  next_follow_up_at: string | null;
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

type LeadActivity = {
  id: string;
  type: string;
  summary: string | null;
  occurred_at: string;
  created_by: string | null;
  author: { id: string; full_name: string } | null;
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

function activityKind(type: string) {
  if (type.includes("whatsapp")) return "WhatsApp";
  if (type.includes("call") || type === "phone") return "Phone";
  if (type.includes("email")) return "Email";
  if (type.includes("follow_up")) return "Follow-up";
  if (type.includes("stage")) return "Stage";
  if (type.includes("viewing") || type.includes("calendar")) return "Calendar";
  if (type === "note") return "Note";
  if (type === "created" || type === "claimed" || type === "sla_reclaim") return "System";
  return formatLabel(type);
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
      <PopoverTrigger disabled={disabled} className="rounded-md text-left hover:bg-muted/70 disabled:cursor-default">
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
        <span className="rounded-full bg-[#F5EEDC] px-3 py-0.5 text-center text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#8A6D2C]">
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
      className={`h-7 w-full rounded-md bg-transparent px-1 text-[0.86rem] text-foreground outline-none placeholder:text-[#B9B6AB] hover:bg-muted/70 focus:bg-muted/80 disabled:cursor-default ${className ?? ""}`}
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
                opt.value === value ? "bg-[#F5EEDC] text-[#8A6D2C]" : "text-foreground"
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
  activities,
  agents,
  stages,
  areas,
  nationalities,
  fieldOptions,
  followUps,
  customer,
  deal,
  documents,
  viewings,
  inventory,
  matches = [],
  duplicateMatches,
  assignments = [],
  events = [],
  userRole,
  userId,
}: {
  lead: Lead;
  activities: LeadActivity[];
  agents: Agent[];
  stages: Stage[];
  areas: string[];
  nationalities: string[];
  fieldOptions: Record<string, LeadFieldOption[]>;
  followUps: LeadFollowUp[];
  customer: { id: string; name: string; phone: string | null; email: string | null; status?: string } | null;
  deal: { id: string; title: string; stage: string; value: number; deal_type: string } | null;
  documents: DocumentRow[];
  viewings: ViewingRow[];
  inventory: InventoryChoice[];
  matches?: InventoryMatch[];
  duplicateMatches: unknown[];
  assignments?: LeadAssignmentRow[];
  events?: LeadEventRow[];
  userRole: string;
  userId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [optimisticLead, setOptimisticLead] = useState(lead);
  const [optimisticFollowUps, setOptimisticFollowUps] = useState(followUps);
  const [optimisticActivities, setOptimisticActivities] = useState(activities);
  const [optimisticDocs, setOptimisticDocs] = useState<LeadDocument[]>(
    documents.map((doc) => ({ ...doc, category: doc.category || "other" }))
  );

  useEffect(() => {
    setOptimisticLead(lead);
    setOptimisticFollowUps(followUps);
    setOptimisticActivities(activities);
    setOptimisticDocs(documents.map((doc) => ({ ...doc, category: doc.category || "other" })));
  }, [lead, followUps, activities, documents]);

  const [editing, setEditing] = useState<string | null>(null);
  const [followUpDate, setFollowUpDate] = useState(toDatetimeLocal(lead.next_follow_up_at));
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [converting, setConverting] = useState(false);
  const [reasonDialog, setReasonDialog] = useState<{ stageId: string; stageName: string; kind: string } | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activityFilter, setActivityFilter] = useState("all");
  const [timelineVisibleCount, setTimelineVisibleCount] = useState(20);
  const TIMELINE_PAGE = 20;
  const [noteDraft, setNoteDraft] = useState("");

  const currentStage = stages.find((s) => s.id === optimisticLead.stage_id) ?? null;
  const pipelineStages = stages.filter((s) => s.kind !== "lost" && s.kind !== "junk");
  const lostStage = stages.find((s) => s.kind === "lost");
  const waLink = whatsappLink(optimisticLead.phone);
  const mailLink = optimisticLead.email ? `mailto:${optimisticLead.email}` : null;
  const phoneHref = telLink(optimisticLead.phone);
  const canManage = canManageCrm(userRole);
  const canEdit = canManage || userRole === "agent";
  const score = optimisticLead.score ?? 0;
  const scoreBand = scoreBandForValue(fieldOptions.score, score);
  const scoreLegend = (fieldOptions.score ?? []).map((row) => row.label).join(" · ");
  const engagement = optimisticActivities.length >= 15 ? "High" : optimisticActivities.length >= 5 ? "Medium" : "Low";
  const budgetLine = formatAEDRange(optimisticLead.budget_min, optimisticLead.budget_max);
  const timelineItems = useMemo(
    () => mergeLeadTimeline(optimisticActivities, events),
    [optimisticActivities, events]
  );
  const lastTouch = timelineItems[0]?.occurred_at ?? optimisticLead.last_activity_at ?? optimisticLead.updated_at;
  const currentIdx = pipelineStages.findIndex((s) => s.id === optimisticLead.stage_id);
  const fillPct = pipelineStages.length <= 1 || currentIdx < 0 ? 0 : (currentIdx / (pipelineStages.length - 1)) * 100;
  const slaClock = stageSlaClock(
    optimisticLead.stage_entered_at ?? optimisticLead.created_at,
    currentStage?.kind === "open" ? currentStage.stale_after_days : null
  );
  const firstResponse = firstResponseClock(optimisticLead);
  const scheduledFollowUp = optimisticFollowUps.find((row) => row.status === "scheduled") ?? null;

  const visibleActivities = useMemo(() => {
    const filtered = filterTimelineItems(timelineItems, activityFilter);
    return filtered.slice(0, timelineVisibleCount);
  }, [timelineItems, activityFilter, timelineVisibleCount]);

  const filteredTimelineCount = useMemo(
    () => filterTimelineItems(timelineItems, activityFilter).length,
    [timelineItems, activityFilter]
  );

  useEffect(() => {
    setTimelineVisibleCount(20);
  }, [activityFilter]);

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
    setOptimisticLead((prev) => ({ ...prev, stage_id: reasonDialog.stageId, status: "unqualified", stage_entered_at: new Date().toISOString() }));
    setReasonDialog(null);
    startTransition(async () => {
      const extra: { lost_reason?: string; junk_reason?: string } = {};
      if (reasonDialog.kind === "lost") extra.lost_reason = selectedReason;
      else extra.junk_reason = selectedReason;
      const result = await updateLeadStage(optimisticLead.id, reasonDialog.stageId, extra);
      if (result.ok) {
        router.refresh();
      } else {
        setOptimisticLead((prev) => ({ ...prev, stage_id: lead.stage_id, stage_entered_at: lead.stage_entered_at }));
        toast.error(result.error ?? "Failed");
      }
      setSelectedReason("");
    });
  }

  function handleScheduleFollowUp() {
    if (!followUpDate) return;
    const iso = new Date(followUpDate).toISOString();
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
        setOptimisticLead(lead);
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
    setOptimisticActivities((prev) => [
      {
        id: `opt_fu_${Date.now()}`,
        type: "follow_up_done",
        summary: "Follow-up completed",
        occurred_at: now,
        created_by: userId,
        author: { id: userId, full_name: "You" },
      },
      ...prev,
    ]);
    startTransition(async () => {
      const result = await completeFollowUp(optimisticLead.id);
      if (result.ok) router.refresh();
      else {
        setOptimisticLead(lead);
        setOptimisticFollowUps(followUps);
        setOptimisticActivities(activities);
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

  function logContact(type: "call" | "whatsapp" | "email") {
    const summary =
      type === "call"
        ? `Called ${optimisticLead.phone}`
        : type === "whatsapp"
          ? `WhatsApp ${optimisticLead.phone}`
          : `Emailed ${optimisticLead.email}`;
    startTransition(async () => {
      await addLeadActivity(optimisticLead.id, type, summary);
      router.refresh();
    });
  }

  function saveNote() {
    const text = noteDraft.trim();
    if (!text) return;
    const row: LeadActivity = {
      id: `opt_${Date.now()}`,
      type: "note",
      summary: text,
      occurred_at: new Date().toISOString(),
      created_by: userId,
      author: { id: userId, full_name: "You" },
    };
    setOptimisticActivities((prev) => [row, ...prev]);
    setNoteDraft("");
    startTransition(async () => {
      const result = await addLeadActivity(optimisticLead.id, "note", text);
      if (result.ok) router.refresh();
      else {
        setOptimisticActivities(activities);
        toast.error(result.error ?? "Failed");
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-[1460px] flex-col gap-[18px]">
      {(customer || deal) && (
        <ConversionPath
          current="lead"
          lead={{ id: optimisticLead.id, name: optimisticLead.name }}
          customer={
            customer
              ? { id: customer.id, name: customer.name, status: customer.status }
              : null
          }
          deal={deal ? { id: deal.id, title: deal.title, stage: deal.stage } : null}
        />
      )}
      <section className="overflow-visible rounded-[14px] border border-border bg-card">
        <div className="flex flex-col gap-6 px-6 py-7 md:flex-row md:items-start md:gap-[26px] md:px-8">
          <div className="relative grid h-[84px] w-[84px] shrink-0 place-items-center rounded-md border-[1.5px] border-primary bg-[#F5EEDC]">
            <span className="absolute inset-[5px] rounded-[3px] border border-primary/35" />
            <span className="font-heading text-[1.8rem] tracking-wide text-[#8A6D2C]" style={{ fontFamily: "var(--font-display), serif" }}>
              {initials(optimisticLead.name)}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {currentStage && (
                <span className="rounded-full border border-[#D9D5E8] bg-[#EDEBF4] px-2.5 py-0.5 tracking-[0.06em] text-[#4C4470] normal-case">
                  {currentStage.name}
                </span>
              )}
              <span className="h-1 w-1 rounded-full bg-[#C4C1B6]" />
              <span>{optionLabel(fieldOptions.source, optimisticLead.source)}</span>
              <span className="h-1 w-1 rounded-full bg-[#C4C1B6]" />
              <span>{optionLabel(fieldOptions.interest, optimisticLead.interest)}</span>
            </div>
            {editing === "name" ? (
              <BlurSaveInput
                value={optimisticLead.name}
                onCancel={() => setEditing(null)}
                onSave={(next) => {
                  if (!next.trim()) return setEditing(null);
                  saveField({ name: next.trim() }, { name: next.trim() });
                }}
              />
            ) : (
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setEditing("name")}
                className="mb-2.5 text-left font-heading text-[2.1rem] leading-[1.05] font-normal tracking-tight text-foreground disabled:cursor-default md:text-[2.35rem]"
                style={{ fontFamily: "var(--font-display), serif" }}
              >
                {optimisticLead.name}
              </button>
            )}
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
                  value={optimisticLead.phone ?? ""}
                  disabled={!canEdit}
                  placeholder="Add phone"
                  className="font-mono text-[0.82rem]"
                  onSave={(next) => saveField({ phone: next.trim() || null }, { phone: next.trim() || null })}
                />
              </span>
              <span className="flex min-w-[14rem] flex-1 items-center gap-1.5">
                <Mail className="h-[15px] w-[15px] shrink-0" />
                <QuietSaveInput
                  type="email"
                  value={optimisticLead.email ?? ""}
                  disabled={!canEdit}
                  placeholder="Add email"
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
                  {canManage && (
                    <DropdownMenuItem variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                      Delete lead
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <DocumentUploadDialog
                entityType="lead"
                entityId={optimisticLead.id}
                categories={docCategoryChoices(fieldOptions.doc_category)}
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
              {deal ? (
                <Link
                  href={`/pipeline/${deal.id}`}
                  className="inline-flex h-[42px] items-center gap-2 rounded-[10px] bg-primary px-5 text-[0.88rem] font-semibold text-white hover:bg-[#8A6D2C]"
                >
                  Open deal <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setConverting(true)}
                  className="inline-flex h-[42px] items-center gap-2 rounded-[10px] bg-primary px-5 text-[0.88rem] font-semibold text-white hover:bg-[#8A6D2C]"
                >
                  Convert to deal <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {customer?.status === "active" && (
                <Link
                  href={`/customers/${customer.id}`}
                  className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-border bg-card px-5 text-[0.88rem] font-semibold text-muted-foreground hover:border-foreground hover:text-foreground"
                >
                  Open customer
                </Link>
              )}
            </div>
          </div>
        </div>

        {pipelineStages.length > 0 && (
          <div className="relative border-t border-border/80 px-6 pb-2 pt-8 md:px-8">
            <div className="relative h-[5px] rounded-full bg-border">
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${fillPct}%` }} />
              <div className="absolute inset-0">
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
                      className={`absolute top-1/2 flex -translate-y-1/2 flex-col ${
                        isFirst
                          ? "left-0 items-start"
                          : isLast
                            ? "right-0 items-end"
                            : "items-center -translate-x-1/2"
                      }`}
                      style={isFirst || isLast ? undefined : { left: `${left}%` }}
                    >
                      {isDone && <Check className="absolute -top-5 h-[13px] w-[13px] text-primary" />}
                      {isCurrent && slaClock && (
                        <span
                          title="Days in this stage versus the SLA in Lead Settings"
                          className={`absolute -top-6 whitespace-nowrap font-mono text-[0.7rem] ${
                            slaClock.overdue ? "font-semibold text-red-700" : "text-[#8A6D2C]"
                          }`}
                        >
                          {slaClock.dayNum}/{slaClock.sla}d
                          {slaClock.overdue ? " overdue" : ""}
                        </span>
                      )}
                      {isCurrent ? (
                        <span className="h-[13px] w-[13px] rotate-45 rounded-[2px] bg-primary shadow-[0_0_0_5px_#F5EEDC]" />
                      ) : (
                        <span className={`h-3 w-[1.5px] ${isDone ? "bg-primary" : "bg-[#C9C6BB]"}`} />
                      )}
                      <span
                        className={`absolute top-3.5 whitespace-nowrap text-[0.72rem] font-medium tracking-wide ${
                          isCurrent
                            ? "top-[18px] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#8A6D2C]"
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
            <div className="h-8" />
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 items-start gap-[18px] xl:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <section className="rounded-[14px] border border-border bg-card px-[22px] py-4">
            <h2 className="mb-3 text-center font-heading text-[1.12rem]" style={{ fontFamily: "var(--font-display), serif" }}>Lead snapshot</h2>
            <div className="grid grid-cols-1 items-start gap-x-0 gap-y-5 md:grid-cols-2 md:gap-x-8">
              <div className="flex min-w-0 flex-col gap-5">
              <SnapshotBlock title="Contact">
                <LedgerRow label="Name" overlay>
                  <QuietSaveInput
                    value={optimisticLead.name}
                    disabled={!canEdit}
                    onSave={(next) => {
                      if (!next.trim()) return;
                      saveField({ name: next.trim() }, { name: next.trim() });
                    }}
                  />
                </LedgerRow>
                <LedgerRow label="Nationality" overlay>
                  <FloatPicker
                    disabled={!canEdit}
                    className="w-[18rem] p-2"
                    trigger={
                      <span className="block px-1 py-0.5 text-[0.86rem]">
                        {optimisticLead.nationality || emptyValue()}
                      </span>
                    }
                  >
                    {(close) => (
                      <NationalityPicker
                        value={optimisticLead.nationality ?? ""}
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

          <section className="rounded-[14px] border border-border bg-card px-[26px] py-6">
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <div>
                <h2 className="font-heading text-[1.12rem]" style={{ fontFamily: "var(--font-display), serif" }}>Activity</h2>
                <p className="mt-0.5 text-[0.8rem] text-muted-foreground">
                  {timelineItems.length} entries · human + system
                </p>
              </div>
              <select
                className="h-8 rounded-lg border border-border bg-muted px-2 text-[0.8rem] text-muted-foreground"
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
              >
                <option value="all">All activity</option>
                <option value="call">Calls</option>
                <option value="whatsapp">Messages</option>
                <option value="note">Notes</option>
                <option value="follow_up">Follow-ups</option>
                <option value="system">System</option>
              </select>
            </div>
            {canEdit && (
              <div className="mt-3 mb-1 rounded-xl border border-border bg-muted/40 p-2.5">
                <Textarea
                  id="lead-note"
                  rows={1}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Write a note…"
                  className="min-h-9 h-9 resize-none border-0 bg-transparent p-1 text-sm shadow-none focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      saveNote();
                    }
                  }}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={!noteDraft.trim() || pending}
                    className="h-8 rounded-lg bg-primary px-3 text-[0.78rem] font-semibold text-white disabled:opacity-40"
                    onClick={saveNote}
                  >
                    Add note
                  </button>
                </div>
              </div>
            )}
            <div className="relative mt-[14px] pl-[26px] before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-[1.5px] before:bg-border">
              {visibleActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                visibleActivities.map((a) => {
                  const key =
                    a.isSystem ||
                    a.type.includes("follow_up") ||
                    a.type.includes("stage") ||
                    a.type.includes("viewing") ||
                    a.type === "converted" ||
                    a.type === "created" ||
                    a.type === "claimed";
                  return (
                    <div key={a.id} className="relative pb-[22px] last:pb-1">
                      <div className={`absolute top-1 -left-[26px] grid h-[15px] w-[15px] place-items-center rounded-full border-[1.5px] bg-card ${key ? "border-primary bg-[#F5EEDC]" : "border-muted-foreground"}`}>
                        <i className={`block h-[5px] w-[5px] rounded-full ${key ? "bg-[#8A6D2C]" : "bg-muted-foreground"}`} />
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <span>
                          <span className="text-[0.9rem] font-semibold">{a.summary?.slice(0, 48) || formatLabel(a.type)}</span>
                          <span className="ml-2 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{activityKind(a.type)}</span>
                        </span>
                        <span className="shrink-0 text-[0.74rem] text-muted-foreground" title={formatDateTime(a.occurred_at)}>
                          {shortTimeAgo(a.occurred_at)}
                        </span>
                      </div>
                      {a.summary && a.summary.length > 48 ? (
                        <p className="mt-1 max-w-[60ch] text-[0.85rem] leading-relaxed text-muted-foreground">{a.summary}</p>
                      ) : null}
                      {a.authorName && a.isSystem ? (
                        <p className="mt-0.5 text-[0.72rem] text-muted-foreground">{a.authorName}</p>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
            {filteredTimelineCount > timelineVisibleCount && (
              <button
                type="button"
                className="mt-4 h-10 w-full rounded-[10px] border border-dashed border-border text-[0.83rem] font-semibold text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                onClick={() => setTimelineVisibleCount((n) => n + TIMELINE_PAGE)}
              >
                Load more ({filteredTimelineCount - timelineVisibleCount} remaining)
              </button>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-[18px]">
          <section className="rounded-[14px] bg-[#16241F] px-[26px] py-6 text-[#EDEBE0]">
            <p className="mb-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary">Next step</p>
            <h2 className="font-heading text-[1.12rem] text-[#F4F2EA]" style={{ fontFamily: "var(--font-display), serif" }}>{followUpTitle()}</h2>
            <p className="mt-1.5 mb-[18px] text-[0.92rem] leading-relaxed text-[#D8D5C8]">
              {optimisticLead.next_follow_up_at ? (
                <>
                  <span className="font-mono text-[0.86rem] text-primary">{formatDateTime(optimisticLead.next_follow_up_at)}</span>
                  {isOverdue(optimisticLead.next_follow_up_at) ? ". This follow-up is overdue." : "."}
                  {scheduledFollowUp?.notes ? (
                    <span className="mt-2 block text-[0.88rem] text-[#EDEBE0]">{scheduledFollowUp.notes}</span>
                  ) : null}
                </>
              ) : firstResponse?.tone === "overdue" ? (
                <>First contact is overdue ({firstResponse.label}). Call or WhatsApp now or this lead returns to the pool.</>
              ) : slaClock?.overdue ? (
                <>This lead is past the {currentStage?.name} SLA ({slaClock.dayNum} of {slaClock.sla} days). Set a follow-up now.</>
              ) : (
                <>No follow-up is set — <b className="text-white">set one now</b>.</>
              )}
            </p>
            <div className="flex items-center gap-2.5 border-t border-white/12 py-3">
              <div className="grid h-[34px] w-[34px] place-items-center rounded-full bg-primary/20 font-heading text-[0.78rem] text-primary" style={{ fontFamily: "var(--font-display), serif" }}>
                {optimisticLead.assigned_to_profile ? initials(optimisticLead.assigned_to_profile.full_name) : "—"}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <b className="block text-[0.86rem] font-semibold text-white">{optimisticLead.assigned_to_profile?.full_name ?? "Unassigned"}</b>
                <span className="text-[0.72rem] uppercase tracking-wide text-[#9AA39B]">{optimisticLead.assigned_to_profile?.role ?? "Agent"}</span>
              </div>
              {canManage && (
                <Select value={optimisticLead.assigned_to ?? "unassigned"} onValueChange={(v) => handleAssign(v === "unassigned" ? null : v ?? null)}>
                  <SelectTrigger className="h-auto border-0 bg-transparent p-0 text-[0.78rem] font-semibold text-primary shadow-none">
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
                <Input type="datetime-local" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="h-9 border-white/20 bg-white/5 text-xs text-white" />
                <Input value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)} placeholder="What this is for — call, WhatsApp, viewing…" className="h-9 border-white/20 bg-white/5 text-xs text-white" />
                <div className="flex gap-2">
                  <button type="button" className="h-[42px] flex-1 rounded-[10px] bg-primary text-[0.88rem] font-semibold text-white" onClick={handleScheduleFollowUp} disabled={!followUpDate || pending}>Save</button>
                  <button type="button" className="h-[42px] flex-1 rounded-[10px] border border-white/25 text-[0.88rem] font-semibold" onClick={() => setShowFollowUpForm(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="mt-3.5 flex gap-2.5">
                <button type="button" className="inline-flex h-[42px] flex-1 items-center justify-center rounded-[10px] bg-primary text-[0.88rem] font-semibold text-white hover:bg-[#8A6D2C]" onClick={() => setShowFollowUpForm(true)}>
                  Set follow-up
                </button>
                {optimisticLead.next_follow_up_at ? (
                  <button
                    type="button"
                    className="inline-flex h-[42px] flex-1 items-center justify-center rounded-[10px] border border-white/25 text-[0.88rem] font-semibold text-[#EDEBE0] hover:border-white"
                    disabled={pending}
                    onClick={handleMarkDone}
                  >
                    Mark done
                  </button>
                ) : null}
              </div>
            )}
          </section>

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
              <i className="block h-full rounded-[3px] bg-linear-to-r from-primary to-[#8A6D2C]" style={{ width: `${Math.min(100, score)}%` }} />
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
              <div className="flex justify-between py-2.5 text-[0.84rem]"><span className="text-muted-foreground">Timeline entries</span><b className="font-mono text-[0.8rem]">{timelineItems.length}</b></div>
            </div>
          </section>

          <LeadAssignmentHistory assignments={assignments} />

          <MatchPanel
            matches={matches}
            dealId={optimisticLead.converted_deal_id}
            canEdit={canEdit}
          />

          <ViewingPanel
            leadId={optimisticLead.id}
            dealId={optimisticLead.converted_deal_id}
            viewings={viewings}
            properties={inventory}
            agents={agents}
            defaultAgentId={optimisticLead.assigned_to}
            canEdit={canEdit}
          />

          <section className="rounded-[14px] border border-border bg-card px-[26px] py-6">
            <div className="mb-1 flex items-baseline justify-between">
              <h2 className="font-heading text-[1.12rem]" style={{ fontFamily: "var(--font-display), serif" }}>Documents</h2>
              <span className="font-mono text-[0.8rem] text-muted-foreground">{optimisticDocs.length}</span>
            </div>
            <DocumentUploadDialog
              entityType="lead"
              entityId={optimisticLead.id}
              categories={docCategoryChoices(fieldOptions.doc_category)}
              onSaved={(doc) => {
                if (doc) setOptimisticDocs((prev) => [{ ...doc, category: doc.category || "other" }, ...prev]);
                router.refresh();
              }}
              trigger={
                <span className="mt-3.5 block cursor-pointer rounded-[10px] border-[1.5px] border-dashed border-border px-4 py-[26px] text-center hover:border-primary hover:bg-[#F5EEDC]">
                  <b className="text-[0.86rem] font-semibold text-[#8A6D2C]">Attach a document</b>
                  <p className="mt-1 text-[0.76rem] text-muted-foreground">Choose a category first — passport, N.O.C., permit, and so on</p>
                </span>
              }
            />
            <LeadDocumentsList
              documents={optimisticDocs}
              onChange={setOptimisticDocs}
              categories={docCategoryChoices(fieldOptions.doc_category)}
            />
          </section>

          {customer && (
            <p className="px-1 text-xs text-muted-foreground">
              Linked customer <Link href={`/customers/${customer.id}`} className="text-foreground hover:underline">{customer.name}</Link>
            </p>
          )}
        </div>
      </div>

      <ConvertLeadDialog
        open={converting}
        onOpenChange={setConverting}
        lead={{
          id: optimisticLead.id,
          name: optimisticLead.name,
          phone: optimisticLead.phone,
          email: optimisticLead.email,
          nationality: optimisticLead.nationality,
          interest: optimisticLead.interest,
          budget_min: optimisticLead.budget_min,
          budget_max: optimisticLead.budget_max,
          preferred_areas: optimisticLead.preferred_areas,
          bedrooms: optimisticLead.bedrooms,
          category: optimisticLead.category,
          financing: optimisticLead.financing,
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
          <p className="text-sm text-muted-foreground">Delete {optimisticLead.name}? This hides the lead from the pipeline.</p>
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
