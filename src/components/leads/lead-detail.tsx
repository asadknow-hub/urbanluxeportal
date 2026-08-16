"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PreferredAreasPicker } from "@/components/leads/preferred-areas-picker";
import { NationalityPicker } from "@/components/leads/nationality-picker";
import { BlurSaveInput } from "@/components/leads/hover-edit-row";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
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
import { formatAED, formatAEDRange } from "@/lib/money";
import { daysSince, formatDate, formatDateTime, isOverdue, timeAgo } from "@/lib/dates";
import { formatLeadInterest } from "@/lib/lead-format";
import { getSignedUrl } from "@/server/documents";
import {
  assignLead,
  scheduleFollowUp,
  completeFollowUp,
  convertLead,
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
  ExternalLink,
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
  last_activity_at: string | null;
  stage_id: string | null;
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

type DocumentRow = {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  created_at: string;
};

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
  return formatLabel(type);
}

function IconBtn({
  href,
  label,
  disabled,
  children,
}: {
  href?: string | null;
  label: string;
  disabled?: boolean;
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
    >
      {children}
    </a>
  );
}

function LedgerRow({
  label,
  editing,
  canEdit,
  onEdit,
  children,
  display,
}: {
  label: string;
  editing: boolean;
  canEdit: boolean;
  onEdit: () => void;
  display: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-baseline gap-1 border-b border-border/70 py-2.5 last:border-b-0 sm:grid-cols-[170px_1fr] sm:gap-4">
      <span className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      {editing ? (
        <div>{children}</div>
      ) : (
        <button
          type="button"
          disabled={!canEdit}
          onClick={onEdit}
          className="rounded-md px-1 py-0.5 text-left text-[0.9rem] text-foreground hover:bg-muted/70 disabled:cursor-default"
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
  followUps,
  customer,
  deal,
  documents,
  lostReasons,
  userRole,
  userId,
}: {
  lead: Lead;
  activities: LeadActivity[];
  agents: Agent[];
  stages: Stage[];
  areas: string[];
  nationalities: string[];
  followUps: LeadFollowUp[];
  customer: { id: string; name: string; phone: string | null; email: string | null } | null;
  deal: { id: string; title: string; stage: string; value: number; deal_type: string } | null;
  documents: DocumentRow[];
  lostReasons: Record<string, string[]>;
  duplicateMatches: unknown[];
  userRole: string;
  userId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [optimisticLead, setOptimisticLead] = useState(lead);
  const [optimisticFollowUps, setOptimisticFollowUps] = useState(followUps);
  const [optimisticActivities, setOptimisticActivities] = useState(activities);
  const [editing, setEditing] = useState<string | null>(null);
  const [followUpDate, setFollowUpDate] = useState(toDatetimeLocal(lead.next_follow_up_at));
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [converting, setConverting] = useState(false);
  const [reasonDialog, setReasonDialog] = useState<{ stageId: string; stageName: string; kind: string } | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activityFilter, setActivityFilter] = useState("all");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [showNote, setShowNote] = useState(false);

  const currentStage = stages.find((s) => s.id === optimisticLead.stage_id) ?? null;
  const pipelineStages = stages.filter((s) => s.kind !== "lost" && s.kind !== "junk");
  const lostStage = stages.find((s) => s.kind === "lost");
  const waLink = whatsappLink(optimisticLead.phone);
  const mailLink = optimisticLead.email ? `mailto:${optimisticLead.email}` : null;
  const phoneHref = telLink(optimisticLead.phone);
  const canManage = userRole === "admin" || userRole === "manager";
  const canEdit = canManage || optimisticLead.assigned_to === userId;
  const score = optimisticLead.score ?? 0;
  const temp = score >= 70 ? "Hot" : score >= 40 ? "Warm" : "Cold";
  const engagement = optimisticActivities.length >= 15 ? "High" : optimisticActivities.length >= 5 ? "Medium" : "Low";
  const budgetLine = formatAEDRange(optimisticLead.budget_min, optimisticLead.budget_max);
  const lastTouch = optimisticActivities[0]?.occurred_at ?? optimisticLead.last_activity_at ?? optimisticLead.updated_at;
  const currentIdx = pipelineStages.findIndex((s) => s.id === optimisticLead.stage_id);
  const fillPct = pipelineStages.length <= 1 || currentIdx < 0 ? 0 : (currentIdx / (pipelineStages.length - 1)) * 100;
  const daysInStage = (() => {
    const change = optimisticActivities.find((a) => a.type === "stage_change" || a.type === "status_change");
    return daysSince(change?.occurred_at ?? optimisticLead.created_at);
  })();
  const sla = currentStage?.stale_after_days ?? null;

  const visibleActivities = useMemo(() => {
    const filtered =
      activityFilter === "all"
        ? optimisticActivities
        : optimisticActivities.filter((a) => a.type.toLowerCase().includes(activityFilter));
    return showAllActivity ? filtered : filtered.slice(0, 4);
  }, [optimisticActivities, activityFilter, showAllActivity]);

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
    if (stage.kind === "lost" || stage.kind === "junk") {
      setReasonDialog({ stageId, stageName: stage.name, kind: stage.kind });
      setSelectedReason("");
      return;
    }
    setOptimisticLead((prev) => ({ ...prev, stage_id: stageId }));
    startTransition(async () => {
      const result = await updateLeadStage(optimisticLead.id, stageId);
      if (result.ok) {
        toast.success(`Moved to ${stage.name}`);
        router.refresh();
      } else {
        setOptimisticLead((prev) => ({ ...prev, stage_id: lead.stage_id }));
        toast.error(result.error ?? "Failed to change stage");
      }
    });
  }

  function handleReasonConfirm() {
    if (!reasonDialog || !selectedReason) return;
    setOptimisticLead((prev) => ({ ...prev, stage_id: reasonDialog.stageId, status: "unqualified" }));
    setReasonDialog(null);
    startTransition(async () => {
      const extra: { lost_reason?: string; junk_reason?: string } = {};
      if (reasonDialog.kind === "lost") extra.lost_reason = selectedReason;
      else extra.junk_reason = selectedReason;
      const result = await updateLeadStage(optimisticLead.id, reasonDialog.stageId, extra);
      if (result.ok) {
        toast.success(`Moved to ${reasonDialog.stageName}`);
        router.refresh();
      } else {
        setOptimisticLead((prev) => ({ ...prev, stage_id: lead.stage_id }));
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

  function followUpTitle() {
    if (!optimisticLead.next_follow_up_at) return "Set the next step";
    if (isOverdue(optimisticLead.next_follow_up_at)) return "Follow-up overdue";
    const until = -daysSince(optimisticLead.next_follow_up_at);
    if (until <= 0) return "Follow-up today";
    if (until === 1) return "Follow-up in 1 day";
    return `Follow-up in ${until} days`;
  }

  async function openDocument(path: string) {
    const result = await getSignedUrl(path);
    if (result.ok && result.data?.url) window.open(result.data.url, "_blank");
    else toast.error(result.error ?? "Could not open file");
  }

  const ref = optimisticLead.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const nextOpen = optimisticFollowUps.find((f) => f.status === "scheduled");

  return (
    <div className="mx-auto flex w-full max-w-[1460px] flex-col gap-[18px]">
      <p className="font-mono text-[0.78rem] text-muted-foreground">
        <Link href="/leads" className="hover:text-foreground">Leads</Link>
        <span className="mx-2 text-[#C4C1B6]">/</span>
        <span className="rounded-md border border-border bg-card px-2 py-0.5 tracking-wide">{ref.slice(0, 4)}-{ref.slice(4, 8)}</span>
      </p>

      <section className="overflow-hidden rounded-[14px] border border-border bg-card">
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
              <span>{formatLabel(optimisticLead.source)}</span>
              <span className="h-1 w-1 rounded-full bg-[#C4C1B6]" />
              <span>{formatLeadInterest(optimisticLead.interest)}</span>
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
              {budgetLine && (
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Building2 className="h-[15px] w-[15px]" />
                  <span className="font-mono text-[0.82rem]">{budgetLine}</span>
                </span>
              )}
              {optimisticLead.preferred_areas?.length ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-[15px] w-[15px]" />
                  {optimisticLead.preferred_areas.join(" · ")}
                </span>
              ) : null}
              {optimisticLead.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-[15px] w-[15px]" />
                  <span className="font-mono text-[0.82rem]">{optimisticLead.phone}</span>
                </span>
              )}
              {optimisticLead.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-[15px] w-[15px]" />
                  {optimisticLead.email}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-3 md:items-end">
            <div className="flex gap-2">
              <IconBtn href={phoneHref} label="Call"><Phone className="h-[18px] w-[18px]" /></IconBtn>
              <IconBtn href={waLink} label="WhatsApp"><MessageCircle className="h-[18px] w-[18px]" /></IconBtn>
              <IconBtn href={mailLink} label="Email"><Mail className="h-[18px] w-[18px]" /></IconBtn>
              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="grid h-10 w-10 place-items-center rounded-[10px] border border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground">
                    <MoreHorizontal className="h-[18px] w-[18px]" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                      Delete lead
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              <DocumentUploadDialog
                entityType="lead"
                entityId={optimisticLead.id}
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
            </div>
          </div>
        </div>

        {pipelineStages.length > 0 && (
          <div className="relative border-t border-border/80 px-6 pb-6 pt-7 md:px-8">
            <div className="relative h-0.5 rounded-sm bg-border">
              <div className="absolute inset-y-0 left-0 rounded-sm bg-foreground" style={{ width: `${fillPct}%` }} />
              <div className="absolute inset-0">
                {pipelineStages.map((stage, idx) => {
                  const left = pipelineStages.length === 1 ? 0 : (idx / (pipelineStages.length - 1)) * 100;
                  const isCurrent = idx === currentIdx;
                  const isDone = currentIdx >= 0 && idx < currentIdx;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      disabled={!canEdit || pending}
                      onClick={() => handleStageChange(stage.id)}
                      className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                      style={{ left: `${left}%` }}
                    >
                      {isDone && <Check className="absolute -top-6 h-[13px] w-[13px] text-foreground" />}
                      {isCurrent && sla != null && (
                        <span className="absolute -top-7 whitespace-nowrap font-mono text-[0.7rem] text-[#8A6D2C]">
                          day {Math.max(1, daysInStage || 1)} of {sla}
                        </span>
                      )}
                      {isCurrent ? (
                        <span className="h-[13px] w-[13px] rotate-45 rounded-[2px] bg-primary shadow-[0_0_0_5px_#F5EEDC]" />
                      ) : (
                        <span className={`h-3 w-[1.5px] ${isDone ? "bg-foreground" : "bg-[#C9C6BB]"}`} />
                      )}
                      <span
                        className={`absolute top-4 whitespace-nowrap text-[0.72rem] font-medium tracking-wide ${
                          isCurrent
                            ? "top-5 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#8A6D2C]"
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
            <div className="mt-11 flex items-center justify-between gap-3">
              <span className="text-[0.78rem] text-muted-foreground">
                {optimisticLead.next_follow_up_at ? (
                  <>
                    Next: <b className="font-semibold text-foreground">{formatDateTime(optimisticLead.next_follow_up_at)}</b>
                    {nextOpen?.notes ? ` — ${nextOpen.notes}` : null}
                  </>
                ) : (
                  <>Next milestone: <b className="font-semibold text-foreground">set a follow-up</b></>
                )}
              </span>
              {lostStage && (
                <button
                  type="button"
                  className="rounded-lg px-2.5 py-1.5 text-[0.8rem] font-semibold text-[#9C4130] hover:bg-[#F7ECE9]"
                  onClick={() => handleStageChange(lostStage.id)}
                >
                  Mark as lost
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 items-start gap-[18px] xl:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <section className="rounded-[14px] border border-border bg-card px-[26px] py-6">
            <div className="mb-1 flex items-baseline justify-between">
              <div>
                <h2 className="font-heading text-[1.12rem]" style={{ fontFamily: "var(--font-display), serif" }}>Lead snapshot</h2>
                <p className="mt-0.5 text-[0.8rem] text-muted-foreground">Requirements and preferences on record</p>
              </div>
              {canEdit && (
                <button type="button" className="rounded-md px-2 py-1 text-[0.8rem] font-semibold text-[#8A6D2C] hover:bg-[#F5EEDC]" onClick={() => setEditing("budget")}>
                  Edit
                </button>
              )}
            </div>
            <div className="mt-3.5">
              <LedgerRow
                label="Budget"
                editing={editing === "budget"}
                canEdit={canEdit}
                onEdit={() => setEditing("budget")}
                display={budgetLine ? <span className="font-mono text-[0.85rem]">{formatAED(optimisticLead.budget_min)} – {optimisticLead.budget_max ? formatAED(optimisticLead.budget_max).replace(/^AED\s/, "") : "—"}</span> : emptyValue()}
              >
                <div className="flex gap-2">
                  <BlurSaveInput
                    type="number"
                    value={optimisticLead.budget_min ? String(optimisticLead.budget_min / 100) : ""}
                    onCancel={() => setEditing(null)}
                    onSave={(next) => saveField({ budget_min: next.trim() ? Math.round(Number(next) * 100) : null }, { budget_min: next.trim() ? Math.round(Number(next) * 100) : null })}
                  />
                  <BlurSaveInput
                    type="number"
                    value={optimisticLead.budget_max ? String(optimisticLead.budget_max / 100) : ""}
                    onCancel={() => setEditing(null)}
                    onSave={(next) => saveField({ budget_max: next.trim() ? Math.round(Number(next) * 100) : null }, { budget_max: next.trim() ? Math.round(Number(next) * 100) : null })}
                  />
                </div>
              </LedgerRow>
              <LedgerRow
                label="Interest"
                editing={editing === "interest"}
                canEdit={canEdit}
                onEdit={() => setEditing("interest")}
                display={formatLeadInterest(optimisticLead.interest) + (optimisticLead.category ? ` ${optimisticLead.category}` : "")}
              >
                <BlurSaveInput value={optimisticLead.interest} onCancel={() => setEditing(null)} onSave={(next) => saveField({ interest: next.trim() }, { interest: next.trim() })} />
              </LedgerRow>
              <LedgerRow
                label="Preferred areas"
                editing={editing === "preferred_areas"}
                canEdit={canEdit}
                onEdit={() => setEditing("preferred_areas")}
                display={
                  optimisticLead.preferred_areas?.length ? (
                    <span className="flex flex-wrap gap-1.5">
                      {optimisticLead.preferred_areas.map((area) => (
                        <span key={area} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[0.8rem] text-muted-foreground">{area}</span>
                      ))}
                    </span>
                  ) : emptyValue()
                }
              >
                <PreferredAreasPicker areas={areas} value={optimisticLead.preferred_areas ?? []} onChange={(value) => saveField({ preferred_areas: value }, { preferred_areas: value }, false)} label="" description="" />
              </LedgerRow>
              <LedgerRow
                label="Nationality"
                editing={editing === "nationality"}
                canEdit={canEdit}
                onEdit={() => setEditing("nationality")}
                display={optimisticLead.nationality || emptyValue()}
              >
                <NationalityPicker value={optimisticLead.nationality ?? ""} options={nationalities} autoFocus onCancel={() => setEditing(null)} onChange={(next) => saveField({ nationality: next || null }, { nationality: next || null })} />
              </LedgerRow>
              {(["bedrooms", "financing", "timeframe", "purpose"] as const).map((key) => (
                <LedgerRow
                  key={key}
                  label={formatLabel(key)}
                  editing={editing === key}
                  canEdit={canEdit}
                  onEdit={() => setEditing(key)}
                  display={optimisticLead[key] ? formatLabel(optimisticLead[key] as string) : emptyValue(key === "timeframe" ? "Not captured" : "Not captured — ask at viewing")}
                >
                  <BlurSaveInput value={optimisticLead[key] ?? ""} onCancel={() => setEditing(null)} onSave={(next) => saveField({ [key]: next.trim() || null }, { [key]: next.trim() || null })} />
                </LedgerRow>
              ))}
              <LedgerRow
                label="Notes"
                editing={editing === "notes"}
                canEdit={canEdit}
                onEdit={() => setEditing("notes")}
                display={optimisticLead.notes ? <div className="border-l-2 border-primary py-0.5 pl-3.5 text-[0.88rem] leading-relaxed text-muted-foreground">{optimisticLead.notes}</div> : emptyValue()}
              >
                <Textarea autoFocus rows={3} defaultValue={optimisticLead.notes ?? ""} className="text-sm" onBlur={(e) => {
                  const next = e.target.value.trim() || null;
                  if (next === (optimisticLead.notes || null)) return setEditing(null);
                  saveField({ notes: next }, { notes: next });
                }} onKeyDown={(e) => { if (e.key === "Escape") setEditing(null); }} />
              </LedgerRow>
            </div>
          </section>

          <section className="rounded-[14px] border border-border bg-card px-[26px] py-6">
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <div>
                <h2 className="font-heading text-[1.12rem]" style={{ fontFamily: "var(--font-display), serif" }}>Activity</h2>
                <p className="mt-0.5 text-[0.8rem] text-muted-foreground">{optimisticActivities.length} interactions since first contact</p>
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
              </select>
            </div>
            <div className="relative mt-[18px] pl-[26px] before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-[1.5px] before:bg-border">
              {visibleActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                visibleActivities.map((a) => {
                  const key = a.type.includes("follow_up") || a.type.includes("stage") || a.type.includes("viewing") || a.type === "converted";
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
                        <span className="shrink-0 font-mono text-[0.74rem] text-muted-foreground">{formatDate(a.occurred_at, "dd MMM")} · {formatDate(a.occurred_at, "HH:mm")}</span>
                      </div>
                      {a.summary && <p className="mt-1 max-w-[60ch] text-[0.85rem] leading-relaxed text-muted-foreground">{a.summary}</p>}
                    </div>
                  );
                })
              )}
            </div>
            {optimisticActivities.length > 4 && (
              <button type="button" className="mt-4 h-10 w-full rounded-[10px] border border-dashed border-border text-[0.83rem] font-semibold text-muted-foreground hover:border-muted-foreground hover:text-foreground" onClick={() => setShowAllActivity((v) => !v)}>
                {showAllActivity ? "Show less" : "View all activity"}
              </button>
            )}
            {showNote ? (
              <div className="mt-3 space-y-2">
                <Textarea rows={2} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Log a note" className="text-sm" />
                <div className="flex gap-2">
                  <Button size="sm" className="h-8" disabled={!noteDraft.trim() || pending} onClick={() => {
                    const text = noteDraft.trim();
                    const row: LeadActivity = { id: `opt_${Date.now()}`, type: "note", summary: text, occurred_at: new Date().toISOString(), created_by: userId, author: { id: userId, full_name: "You" } };
                    setOptimisticActivities((prev) => [row, ...prev]);
                    setNoteDraft("");
                    setShowNote(false);
                    startTransition(async () => {
                      const result = await addLeadActivity(optimisticLead.id, "note", text);
                      if (result.ok) router.refresh();
                      else {
                        setOptimisticActivities(activities);
                        toast.error(result.error ?? "Failed");
                      }
                    });
                  }}>Save note</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowNote(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <button type="button" className="mt-3 text-[0.8rem] font-semibold text-[#8A6D2C]" onClick={() => setShowNote(true)}>Log a note</button>
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
                  {isOverdue(optimisticLead.next_follow_up_at) ? ". This follow-up is overdue." : ". Confirm or reschedule before it slips."}
                </>
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
                <Input value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)} placeholder="Note (optional)" className="h-9 border-white/20 bg-white/5 text-xs text-white" />
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
                    onClick={() => {
                      startTransition(async () => {
                        const result = await completeFollowUp(optimisticLead.id);
                        if (result.ok) router.refresh();
                        else toast.error(result.error ?? "Failed");
                      });
                    }}
                  >
                    Mark done
                  </button>
                ) : (
                  <button type="button" className="inline-flex h-[42px] flex-1 items-center justify-center rounded-[10px] border border-white/25 text-[0.88rem] font-semibold text-[#EDEBE0] hover:border-white" onClick={() => setShowNote(true)}>
                    Add note
                  </button>
                )}
              </div>
            )}
            {optimisticFollowUps.length > 0 && (
              <ul className="mt-4 space-y-1.5 border-t border-white/12 pt-3 text-[0.75rem] text-[#D8D5C8]">
                {optimisticFollowUps.slice(0, 4).map((row) => (
                  <li key={row.id} className="flex justify-between gap-2">
                    <span className="capitalize">{row.status}</span>
                    <span className="font-mono text-primary/90">{formatDate(row.scheduled_at, "dd MMM, HH:mm")}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[14px] border border-border bg-card px-[26px] py-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-heading text-[1.12rem]" style={{ fontFamily: "var(--font-display), serif" }}>Lead score</h2>
              <span className="rounded-full border border-[#D6E0E9] bg-[#E9EEF3] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#44607A]">{temp}</span>
            </div>
            <div className="mt-3.5 font-heading text-[2.6rem] leading-none" style={{ fontFamily: "var(--font-display), serif" }}>
              {score}<small className="ml-1 font-sans text-base text-muted-foreground">/ 100</small>
            </div>
            <div className="mt-4 h-[5px] overflow-hidden rounded-[3px] bg-border">
              <i className="block h-full rounded-[3px] bg-linear-to-r from-primary to-[#8A6D2C]" style={{ width: `${Math.min(100, score)}%` }} />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[0.68rem] text-muted-foreground">
              <span>0</span><span>Cold · Warm · Hot</span><span>100</span>
            </div>
            <div className="mt-4 border-t border-border/70">
              <div className="flex justify-between border-b border-border/70 py-2.5 text-[0.84rem]"><span className="text-muted-foreground">Engagement</span><b>{engagement}</b></div>
              <div className="flex justify-between border-b border-border/70 py-2.5 text-[0.84rem]"><span className="text-muted-foreground">Last activity</span><b className="font-mono text-[0.8rem]">{timeAgo(lastTouch)}</b></div>
              <div className="flex justify-between border-b border-border/70 py-2.5 text-[0.84rem]"><span className="text-muted-foreground">First contact</span><b className="font-mono text-[0.8rem]">{formatDate(optimisticLead.created_at)}</b></div>
              <div className="flex justify-between py-2.5 text-[0.84rem]"><span className="text-muted-foreground">Total activities</span><b className="font-mono text-[0.8rem]">{optimisticActivities.length}</b></div>
            </div>
          </section>

          <section className="rounded-[14px] border border-border bg-card px-[26px] py-6">
            <div className="mb-1 flex items-baseline justify-between">
              <h2 className="font-heading text-[1.12rem]" style={{ fontFamily: "var(--font-display), serif" }}>Documents</h2>
              <span className="font-mono text-[0.8rem] text-muted-foreground">{documents.length}</span>
            </div>
            <DocumentUploadDialog
              entityType="lead"
              entityId={optimisticLead.id}
              trigger={
                <span className="mt-3.5 block cursor-pointer rounded-[10px] border-[1.5px] border-dashed border-border px-4 py-[26px] text-center hover:border-primary hover:bg-[#F5EEDC]">
                  <b className="text-[0.86rem] font-semibold text-[#8A6D2C]">Attach a document</b>
                  <p className="mt-1 text-[0.76rem] text-muted-foreground">Passport copy, EOI form, booking receipt — click to upload</p>
                </span>
              }
            />
            {documents.length > 0 && (
              <ul className="mt-3 space-y-1">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-2 py-1 text-sm">
                    <span className="truncate">{doc.name}</span>
                    <button type="button" aria-label={`Open ${doc.name}`} onClick={() => openDocument(doc.storage_path)}>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {customer && (
            <p className="px-1 text-xs text-muted-foreground">
              Linked customer <Link href={`/customers/${customer.id}`} className="text-foreground hover:underline">{customer.name}</Link>
            </p>
          )}
        </div>
      </div>

      <Dialog open={converting} onOpenChange={setConverting}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Convert to deal</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This creates a customer and a pipeline deal from this lead.</p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConverting(false)}>Cancel</Button>
            <Button size="sm" disabled={pending} onClick={() => {
              startTransition(async () => {
                const result = await convertLead(optimisticLead.id, {});
                if (result.ok) { toast.success("Converted to deal"); setConverting(false); router.refresh(); }
                else toast.error(result.error ?? "Conversion failed");
              });
            }}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Convert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reasonDialog !== null} onOpenChange={(open) => { if (!open) setReasonDialog(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Move to {reasonDialog?.stageName}</DialogTitle></DialogHeader>
          <Select value={selectedReason} onValueChange={(v) => setSelectedReason(v ?? "")}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select a reason" /></SelectTrigger>
            <SelectContent>
              {(lostReasons[reasonDialog?.kind ?? ""] ?? []).map((reason) => (
                <SelectItem key={reason} value={reason}>{reason}</SelectItem>
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
