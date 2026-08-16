"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PreferredAreasPicker } from "@/components/leads/preferred-areas-picker";
import { NationalityPicker } from "@/components/leads/nationality-picker";
import { HoverEditRow, BlurSaveInput } from "@/components/leads/hover-edit-row";
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
import { formatAED } from "@/lib/money";
import { formatDateTime, isOverdue } from "@/lib/dates";
import { formatLeadInterest, formatLeadTag } from "@/lib/lead-format";
import { getSignedUrl } from "@/server/documents";
import {
  assignLead,
  scheduleFollowUp,
  completeFollowUp,
  snoozeFollowUp,
  convertLead,
  updateLead,
  updateLeadStage,
  deleteLead,
} from "@/server/leads";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  MessageCircle,
  UserPlus,
  CheckCircle2,
  MoreHorizontal,
  Loader2,
  FileText,
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
  assigned_to: string | null;
  next_follow_up_at: string | null;
  converted_customer_id: string | null;
  converted_deal_id: string | null;
  created_at: string;
  updated_at: string;
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

type DocumentRow = {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  created_at: string;
};

type Agent = { id: string; full_name: string; role: string };

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatLabel(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {children}
    </a>
  );
}

export function LeadDetail({
  lead,
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
  activities: unknown[];
  agents: Agent[];
  stages: { id: string; name: string; color: string; kind: string; sort: number; helper_text: string | null }[];
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
  const [editing, setEditing] = useState<string | null>(null);
  const [followUpDate, setFollowUpDate] = useState(toDatetimeLocal(lead.next_follow_up_at));
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [converting, setConverting] = useState(false);
  const [reasonDialog, setReasonDialog] = useState<{ stageId: string; stageName: string; kind: string } | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentStage = stages.find((s) => s.id === optimisticLead.stage_id) ?? null;
  const waLink = whatsappLink(optimisticLead.phone);
  const mailLink = optimisticLead.email ? `mailto:${optimisticLead.email}` : null;
  const phoneHref = telLink(optimisticLead.phone);
  const canManage = userRole === "admin" || userRole === "manager";
  const canEdit = canManage || optimisticLead.assigned_to === userId;
  const lostStage = stages.find((s) => s.kind === "lost");

  function saveField(payload: Record<string, unknown>, nextState: Partial<Lead>, close = true) {
    setOptimisticLead((prev) => ({ ...prev, ...nextState }));
    if (close) setEditing(null);
    startTransition(async () => {
      const result = await updateLead(optimisticLead.id, payload as never);
      if (result.ok) {
        router.refresh();
      } else {
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
    startTransition(async () => {
      const result = await scheduleFollowUp(optimisticLead.id, iso, followUpNotes || undefined);
      if (result.ok) {
        setFollowUpNotes("");
        router.refresh();
      } else {
        setOptimisticLead(lead);
        setOptimisticFollowUps(followUps);
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleCompleteFollowUp() {
    setOptimisticLead((prev) => ({ ...prev, next_follow_up_at: null }));
    setOptimisticFollowUps((prev) =>
      prev.map((row) =>
        row.status === "scheduled"
          ? { ...row, status: "done" as const, completed_at: new Date().toISOString() }
          : row
      )
    );
    startTransition(async () => {
      const result = await completeFollowUp(optimisticLead.id);
      if (result.ok) router.refresh();
      else {
        setOptimisticLead(lead);
        setOptimisticFollowUps(followUps);
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleSnooze(days: number) {
    const next = new Date();
    next.setDate(next.getDate() + days);
    const iso = next.toISOString();
    setFollowUpDate(toDatetimeLocal(iso));
    startTransition(async () => {
      const result = await snoozeFollowUp(optimisticLead.id, iso);
      if (result.ok) router.refresh();
      else toast.error(result.error ?? "Failed");
    });
  }

  async function openDocument(path: string) {
    const result = await getSignedUrl(path);
    if (result.ok && result.data?.url) window.open(result.data.url, "_blank");
    else toast.error(result.error ?? "Could not open file");
  }

  const dash = <span className="text-muted-foreground">—</span>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {currentStage && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ backgroundColor: `${currentStage.color}18`, color: currentStage.color }}
            >
              {currentStage.name}
            </span>
          )}
          <span className="truncate text-xs text-muted-foreground">
            {formatLabel(optimisticLead.source)} · {formatLeadInterest(optimisticLead.interest)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={optimisticLead.assigned_to ?? "unassigned"}
            onValueChange={(v) => handleAssign(v === "unassigned" ? null : v ?? null)}
          >
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="Assign">
                {optimisticLead.assigned_to_profile?.full_name ?? "Unassigned"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {deal ? (
            <Link href={`/pipeline/${deal.id}`} className="text-xs font-medium text-primary hover:underline">
              Open deal
            </Link>
          ) : (
            <Button size="sm" className="h-8" onClick={() => setConverting(true)} disabled={!!optimisticLead.converted_deal_id}>
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Convert
            </Button>
          )}
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                  Delete lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {stages.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
          {stages.map((stage, idx) => {
            const currentIdx = stages.findIndex((s) => s.id === optimisticLead.stage_id);
            const isCurrent = idx === currentIdx;
            const isPassed = currentIdx >= 0 && idx < currentIdx;
            const clipPath =
              idx === 0
                ? "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%)"
                : idx === stages.length - 1
                  ? "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 5% 50%)"
                  : "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%)";
            return (
              <button
                key={stage.id}
                onClick={() => canEdit && !pending && handleStageChange(stage.id)}
                disabled={!canEdit || pending}
                style={isCurrent ? { backgroundColor: stage.color, clipPath } : { clipPath }}
                className={`relative flex h-10 min-w-[120px] flex-1 items-center justify-center text-xs font-semibold ${
                  isCurrent ? "text-white" : isPassed ? "bg-muted text-foreground" : "bg-muted/40 text-muted-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  {isPassed && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {stage.name}
                </span>
              </button>
            );
          })}
          {lostStage && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-8 text-xs"
              onClick={() => handleStageChange(lostStage.id)}
            >
              Mark as Lost
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-2">
            <p className="px-3 pt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Customer</p>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <HoverEditRow
                label="Name"
                display={optimisticLead.name}
                editing={editing === "name"}
                canEdit={canEdit}
                onEdit={() => setEditing("name")}
              >
                <BlurSaveInput
                  value={optimisticLead.name}
                  onCancel={() => setEditing(null)}
                  onSave={(next) => {
                    if (!next.trim()) return setEditing(null);
                    saveField({ name: next.trim() }, { name: next.trim() });
                  }}
                />
              </HoverEditRow>
              <HoverEditRow
                label="WhatsApp"
                display={optimisticLead.phone || dash}
                editing={editing === "phone"}
                canEdit={canEdit}
                onEdit={() => setEditing("phone")}
                trailing={
                  <>
                    {phoneHref && (
                      <IconLink href={phoneHref} label="Call">
                        <Phone className="h-3.5 w-3.5" />
                      </IconLink>
                    )}
                    {waLink && (
                      <IconLink href={waLink} label="WhatsApp">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </IconLink>
                    )}
                  </>
                }
              >
                <BlurSaveInput
                  value={optimisticLead.phone ?? ""}
                  onCancel={() => setEditing(null)}
                  onSave={(next) => saveField({ phone: next.trim() || null }, { phone: next.trim() || null })}
                />
              </HoverEditRow>
              <HoverEditRow
                label="Email"
                display={optimisticLead.email || dash}
                editing={editing === "email"}
                canEdit={canEdit}
                onEdit={() => setEditing("email")}
                trailing={
                  mailLink ? (
                    <IconLink href={mailLink} label="Email">
                      <Mail className="h-3.5 w-3.5" />
                    </IconLink>
                  ) : null
                }
              >
                <BlurSaveInput
                  value={optimisticLead.email ?? ""}
                  type="email"
                  onCancel={() => setEditing(null)}
                  onSave={(next) => saveField({ email: next.trim() || null }, { email: next.trim() || null })}
                />
              </HoverEditRow>
              <HoverEditRow
                label="Nationality"
                display={optimisticLead.nationality || dash}
                editing={editing === "nationality"}
                canEdit={canEdit}
                onEdit={() => setEditing("nationality")}
              >
                <NationalityPicker
                  value={optimisticLead.nationality ?? ""}
                  options={nationalities}
                  autoFocus
                  onCancel={() => setEditing(null)}
                  onChange={(next) => saveField({ nationality: next || null }, { nationality: next || null })}
                />
              </HoverEditRow>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-2">
            <p className="px-3 pt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Preferences</p>
            <div className="grid grid-cols-1 sm:grid-cols-3">
              <HoverEditRow
                className="sm:col-span-3"
                label="Preferred areas"
                display={optimisticLead.preferred_areas?.length ? optimisticLead.preferred_areas.join(", ") : dash}
                editing={editing === "preferred_areas"}
                canEdit={canEdit}
                onEdit={() => setEditing("preferred_areas")}
              >
                <PreferredAreasPicker
                  areas={areas}
                  value={optimisticLead.preferred_areas ?? []}
                  onChange={(value) => saveField({ preferred_areas: value }, { preferred_areas: value }, false)}
                  label=""
                  description=""
                />
              </HoverEditRow>
              <HoverEditRow
                label="Budget min"
                display={optimisticLead.budget_min ? formatAED(optimisticLead.budget_min) : dash}
                editing={editing === "budget_min"}
                canEdit={canEdit}
                onEdit={() => setEditing("budget_min")}
              >
                <BlurSaveInput
                  type="number"
                  value={optimisticLead.budget_min ? String(optimisticLead.budget_min / 100) : ""}
                  onCancel={() => setEditing(null)}
                  onSave={(next) => {
                    const money = next.trim() ? Math.round(Number(next) * 100) : null;
                    saveField({ budget_min: money }, { budget_min: money });
                  }}
                />
              </HoverEditRow>
              <HoverEditRow
                label="Budget max"
                display={optimisticLead.budget_max ? formatAED(optimisticLead.budget_max) : dash}
                editing={editing === "budget_max"}
                canEdit={canEdit}
                onEdit={() => setEditing("budget_max")}
              >
                <BlurSaveInput
                  type="number"
                  value={optimisticLead.budget_max ? String(optimisticLead.budget_max / 100) : ""}
                  onCancel={() => setEditing(null)}
                  onSave={(next) => {
                    const money = next.trim() ? Math.round(Number(next) * 100) : null;
                    saveField({ budget_max: money }, { budget_max: money });
                  }}
                />
              </HoverEditRow>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-2">
            <p className="px-3 pt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Requirements</p>
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {(
                [
                  ["interest", formatLeadInterest(optimisticLead.interest)],
                  ["financing", optimisticLead.financing],
                  ["timeframe", optimisticLead.timeframe],
                  ["purpose", optimisticLead.purpose],
                  ["bedrooms", optimisticLead.bedrooms],
                  ["category", optimisticLead.category],
                ] as const
              ).map(([key, value]) => (
                <HoverEditRow
                  key={key}
                  label={formatLabel(key)}
                  display={value ? formatLabel(value) : dash}
                  editing={editing === key}
                  canEdit={canEdit}
                  onEdit={() => setEditing(key)}
                >
                  <BlurSaveInput
                    value={value ?? ""}
                    onCancel={() => setEditing(null)}
                    onSave={(next) => saveField({ [key]: next.trim() || null }, { [key]: next.trim() || null })}
                  />
                </HoverEditRow>
              ))}
              <HoverEditRow
                className="col-span-2"
                label="Tags"
                display={optimisticLead.tags?.length ? optimisticLead.tags.map(formatLeadTag).join(", ") : dash}
                editing={editing === "tags"}
                canEdit={canEdit}
                onEdit={() => setEditing("tags")}
              >
                <BlurSaveInput
                  value={optimisticLead.tags.join(", ")}
                  onCancel={() => setEditing(null)}
                  onSave={(next) => {
                    const tags = next.split(",").map((s) => s.trim()).filter(Boolean);
                    saveField({ tags }, { tags });
                  }}
                />
              </HoverEditRow>
              <HoverEditRow
                className="col-span-2 sm:col-span-4"
                label="Notes"
                display={optimisticLead.notes || dash}
                editing={editing === "notes"}
                canEdit={canEdit}
                onEdit={() => setEditing("notes")}
              >
                <Textarea
                  autoFocus
                  rows={3}
                  defaultValue={optimisticLead.notes ?? ""}
                  className="text-sm"
                  onBlur={(e) => {
                    const next = e.target.value.trim() || null;
                    if (next === (optimisticLead.notes || null)) {
                      setEditing(null);
                      return;
                    }
                    saveField({ notes: next }, { notes: next });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditing(null);
                  }}
                />
              </HoverEditRow>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Follow-up</p>
            {optimisticLead.next_follow_up_at && (
              <p className={`mt-2 text-sm ${isOverdue(optimisticLead.next_follow_up_at) ? "text-destructive" : "text-foreground"}`}>
                Next {formatDateTime(optimisticLead.next_follow_up_at)}
                {isOverdue(optimisticLead.next_follow_up_at) ? " · overdue" : ""}
              </p>
            )}
            <div className="mt-3 space-y-2">
              <Input
                type="datetime-local"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="h-9 text-xs"
              />
              <Input
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                placeholder="Note (optional)"
                className="h-9 text-xs"
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="h-8" onClick={handleScheduleFollowUp} disabled={!followUpDate || pending}>
                  Set
                </Button>
                {optimisticLead.next_follow_up_at && (
                  <>
                    <Button size="sm" variant="outline" className="h-8" onClick={handleCompleteFollowUp} disabled={pending}>
                      Done
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => handleSnooze(1)} disabled={pending}>
                      +1 day
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">History</p>
              {optimisticFollowUps.length === 0 ? (
                <p className="text-xs text-muted-foreground">No follow-ups yet.</p>
              ) : (
                <ul className="space-y-2">
                  {optimisticFollowUps.map((row) => (
                    <li key={row.id} className="text-xs">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium capitalize text-foreground">{row.status}</span>
                        <span className="text-muted-foreground">{formatDateTime(row.scheduled_at)}</span>
                      </div>
                      {row.notes && <p className="mt-0.5 text-muted-foreground">{row.notes}</p>}
                      {row.completed_at && (
                        <p className="text-muted-foreground">Completed {formatDateTime(row.completed_at)}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Documents</p>
              <DocumentUploadDialog triggerLabel="Upload" entityType="lead" entityId={optimisticLead.id} quiet />
            </div>
            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground">No documents yet.</p>
            ) : (
              <ul className="space-y-1">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5">
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{doc.name}</span>
                    </span>
                    <button
                      type="button"
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-label={`Open ${doc.name}`}
                      onClick={() => openDocument(doc.storage_path)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {customer && (
            <p className="px-1 text-xs text-muted-foreground">
              Linked customer{" "}
              <Link href={`/customers/${customer.id}`} className="text-foreground hover:underline">
                {customer.name}
              </Link>
            </p>
          )}
        </div>
      </div>

      <Dialog open={converting} onOpenChange={setConverting}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convert to deal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This creates a customer and a pipeline deal from this lead.</p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConverting(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await convertLead(optimisticLead.id, {});
                  if (result.ok) {
                    toast.success("Converted to deal");
                    setConverting(false);
                    router.refresh();
                  } else toast.error(result.error ?? "Conversion failed");
                });
              }}
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Convert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reasonDialog !== null} onOpenChange={(open) => { if (!open) setReasonDialog(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move to {reasonDialog?.stageName}</DialogTitle>
          </DialogHeader>
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
          <DialogHeader>
            <DialogTitle>Delete lead</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Delete {optimisticLead.name}? This hides the lead from the pipeline.</p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await deleteLead(optimisticLead.id);
                  if (result.ok) {
                    toast.success("Lead deleted");
                    router.push("/leads");
                  } else toast.error(result.error ?? "Failed");
                });
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
