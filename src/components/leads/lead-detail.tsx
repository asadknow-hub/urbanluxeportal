"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  assignLead,
  scheduleFollowUp,
  addLeadActivity,
  convertLead,
  updateLead,
  updateLeadStage,
  claimLead,
} from "@/server/leads";
import { toast } from "sonner";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
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
  Clock,
  FileText,
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

type LeadActivity = {
  id: string;
  type: string;
  summary: string | null;
  occurred_at: string;
  created_by: string | null;
  author: { id: string; full_name: string } | null;
};

type Agent = { id: string; full_name: string; role: string };

// Format any DB string into a readable label (e.g. "property_finder" → "Property Finder")
// No hardcoded labels — everything is derived dynamically from the data.
function formatLabel(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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
  customer,
  deal,
  documents,
  userRole,
  userId,
}: {
  lead: Lead;
  activities: LeadActivity[];
  agents: Agent[];
  stages: { id: string; name: string; color: string; kind: string; sort: number; helper_text: string | null }[];
  customer: { id: string; name: string; phone: string | null; email: string | null } | null;
  deal: { id: string; title: string; stage: string; value: number; deal_type: string } | null;
  documents: { id: string; file_name: string; file_url: string; file_type: string; created_at: string }[];
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
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: lead.name,
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    interest: lead.interest,
    budget_min: lead.budget_min ? String(lead.budget_min / 100) : "",
    budget_max: lead.budget_max ? String(lead.budget_max / 100) : "",
    notes: lead.notes ?? "",
  });
  const [converting, setConverting] = useState(false);

  const currentStage = stages.find((s) => s.id === optimisticLead.stage_id) ?? null;
  const waLink = whatsappLink(optimisticLead.phone);
  const canManage = userRole === "admin" || userRole === "manager";
  const canEdit = canManage || optimisticLead.assigned_to === userId;
  const initials = optimisticLead.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

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
        router.refresh();
      } else {
        setOptimisticLead((prev) => ({ ...prev, next_follow_up_at: lead.next_follow_up_at }));
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleSaveEdit() {
    startTransition(async () => {
      const result = await updateLead(optimisticLead.id, {
        name: editForm.name,
        phone: editForm.phone || null,
        email: editForm.email || undefined,
        interest: editForm.interest as any,
        budget_min: editForm.budget_min ? Number(editForm.budget_min) * 100 : null,
        budget_max: editForm.budget_max ? Number(editForm.budget_max) * 100 : null,
        notes: editForm.notes || null,
      } as any);
      if (result.ok) {
        // Instant UI update
        setOptimisticLead((prev) => ({
          ...prev,
          name: editForm.name,
          phone: editForm.phone || null,
          email: editForm.email || null,
          interest: editForm.interest,
          budget_min: editForm.budget_min ? Number(editForm.budget_min) * 100 : null,
          budget_max: editForm.budget_max ? Number(editForm.budget_max) * 100 : null,
          notes: editForm.notes || null,
        }));
        toast.success("Lead updated");
        setEditMode(false);
        router.refresh();
      } else {
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
      {/* Back link */}
      <Link href="/leads" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
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
              <span className="capitalize">{formatLabel(optimisticLead.interest)}</span>
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
        {canEdit && !editMode && currentStage?.kind !== "won" && (
          <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
            Edit
          </Button>
        )}
      </div>

      {/* Stage selector + claim */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-slate-500">Stage</Label>
          <Select
            value={optimisticLead.stage_id ?? undefined}
            onValueChange={(v) => canEdit && handleStageChange(v ?? "")}
            disabled={pending || !canEdit}
          >
            <SelectTrigger className="w-48">
              {currentStage ? (
                <span className="text-sm font-medium" style={{ color: currentStage.color }}>
                  {currentStage.name}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">No stage</span>
              )}
            </SelectTrigger>
            <SelectContent>
              {stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!optimisticLead.assigned_to && canEdit && (
          <Button size="sm" variant="outline" onClick={handleClaim} disabled={pending}>
            <UserPlus className="mr-2 h-4 w-4" />
            Claim
          </Button>
        )}
      </div>

      {/* Stage workflow — fully dynamic from lead_stages table, no hardcoding */}
      {stages.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Lead Workflow</h3>

          {/* Active stages as connected pills */}
          <div className="flex items-center gap-1 flex-wrap">
            {stages.filter((s) => s.kind === "active").map((stage, idx, filtered) => {
              const isCurrent = optimisticLead.stage_id === stage.id;
              const currentIdx = filtered.findIndex((s) => s.id === optimisticLead.stage_id);
              const isPassed = currentIdx >= 0 && idx < currentIdx;
              const stageColor = stage.color || "#10b981";

              return (
                <div key={stage.id} className="flex items-center gap-1">
                  <button
                    onClick={() => canEdit && handleStageChange(stage.id)}
                    disabled={pending || !canEdit}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      isCurrent
                        ? "text-white shadow-sm"
                        : isPassed
                        ? "bg-slate-100 text-slate-600"
                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    } ${canEdit ? "cursor-pointer" : "cursor-default"}`}
                    style={isCurrent ? { backgroundColor: stageColor } : {}}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                        isCurrent ? "bg-white/20" : isPassed ? "bg-slate-200" : "bg-slate-200"
                      }`}
                    >
                      {isPassed ? "✓" : idx + 1}
                    </span>
                    {stage.name}
                  </button>
                  {idx < filtered.length - 1 && (
                    <div
                      className={`h-0.5 w-4 ${isPassed ? "bg-slate-300" : "bg-slate-200"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Lost / Junk stages as separate end actions */}
          {stages.filter((s) => s.kind === "lost" || s.kind === "junk").length > 0 && (
            <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-100">
              {stages
                .filter((s) => s.kind === "lost" || s.kind === "junk")
                .map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => canEdit && handleStageChange(stage.id)}
                    disabled={pending || !canEdit}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      optimisticLead.stage_id === stage.id
                        ? "bg-red-100 text-red-700"
                        : "text-red-500 hover:bg-red-50"
                    } ${canEdit ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <XCircle className="h-3 w-3" />
                    {stage.name}
                  </button>
                ))}
            </div>
          )}

          {/* Helper text for current stage */}
          {currentStage?.helper_text && (
            <p className="mt-3 text-xs text-slate-400">{currentStage.helper_text}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: details + edit */}
        <div className="space-y-4 lg:col-span-2">
          {/* Contact info */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Contact Information</h3>
            {editMode ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Phone</Label>
                    <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Interest</Label>
                    <Input value={editForm.interest} onChange={(e) => setEditForm({ ...editForm, interest: e.target.value })} placeholder="e.g. Buy, Rent, Off-Plan..." />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Budget Min (AED)</Label>
                    <Input type="number" value={editForm.budget_min} onChange={(e) => setEditForm({ ...editForm, budget_min: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Budget Max (AED)</Label>
                    <Input type="number" value={editForm.budget_max} onChange={(e) => setEditForm({ ...editForm, budget_max: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Textarea rows={3} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveEdit} disabled={pending}>
                    {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {optimisticLead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <a href={`tel:${optimisticLead.phone}`} className="text-slate-700 hover:text-slate-900">{optimisticLead.phone}</a>
                    {waLink && (
                      <a href={waLink} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                      </a>
                    )}
                  </div>
                )}
                {optimisticLead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <a href={`mailto:${optimisticLead.email}`} className="text-slate-700 hover:text-slate-900">{optimisticLead.email}</a>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <p className="text-xs text-slate-400">Budget</p>
                    <p className="font-medium text-slate-700">
                      {optimisticLead.budget_min || optimisticLead.budget_max
                        ? `${optimisticLead.budget_min ? formatAED(optimisticLead.budget_min) : "?"} – ${optimisticLead.budget_max ? formatAED(optimisticLead.budget_max) : "?"}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Preferred Areas</p>
                    <p className="font-medium text-slate-700">
                      {optimisticLead.preferred_areas && optimisticLead.preferred_areas.length > 0
                        ? optimisticLead.preferred_areas.join(", ")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Bedrooms</p>
                    <p className="font-medium text-slate-700 capitalize">{optimisticLead.bedrooms ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Category</p>
                    <p className="font-medium text-slate-700 capitalize">{optimisticLead.category ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Financing</p>
                    <p className="font-medium text-slate-700 capitalize">{optimisticLead.financing?.replace(/_/g, " ") ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Timeframe</p>
                    <p className="font-medium text-slate-700 capitalize">{optimisticLead.timeframe?.replace(/_/g, " ") ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Purpose</p>
                    <p className="font-medium text-slate-700 capitalize">{optimisticLead.purpose?.replace(/_/g, " ") ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Language</p>
                    <p className="font-medium text-slate-700 uppercase">{optimisticLead.language ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Created</p>
                    <p className="font-medium text-slate-700">{formatDate(optimisticLead.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Created By</p>
                    <p className="font-medium text-slate-700">{optimisticLead.created_by_profile?.full_name ?? "—"}</p>
                  </div>
                </div>
                {optimisticLead.tags && optimisticLead.tags.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs text-slate-400">Tags</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {optimisticLead.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {optimisticLead.notes && (
                  <div className="pt-2">
                    <p className="text-xs text-slate-400">Notes</p>
                    <p className="text-slate-600 mt-1">{optimisticLead.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Activity timeline */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-4">
              <Activity className="h-4 w-4" />
              Activity Timeline
            </h3>

            {/* Quick add activity */}
            {canEdit && (
              <div className="mb-4 flex gap-2">
                <Select value={activityType} onValueChange={(v) => setActivityType(v ?? "note")}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
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
                <p className="text-sm text-slate-400 text-center py-6">No activities yet.</p>
              ) : (
                optimisticActivities.map((a) => {
                  const Icon = ACTIVITY_ICONS[a.type] ?? Activity;
                  return (
                    <div key={a.id} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <Icon className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="flex-1 border-b border-slate-50 pb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-700 capitalize">
                            {a.type.replace(/_/g, " ")}
                            {a.author && (
                              <span className="text-slate-400 font-normal ml-1">· {a.author.full_name}</span>
                            )}
                          </span>
                          <span className="text-xs text-slate-300">{timeAgo(a.occurred_at)}</span>
                        </div>
                        {a.summary && (
                          <p className="text-sm text-slate-600 mt-0.5">{a.summary}</p>
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
          {/* Assignment */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
              <UserCog className="h-4 w-4" />
              Assignment
            </h3>
            {optimisticLead.assigned_to_profile ? (
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={optimisticLead.assigned_to_profile.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                    {optimisticLead.assigned_to_profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-slate-900">{optimisticLead.assigned_to_profile.full_name}</p>
                  <p className="text-xs text-slate-400 capitalize">{optimisticLead.assigned_to_profile.role}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-3">Unassigned</p>
            )}
            {canManage && (
              <Select
                value={optimisticLead.assigned_to ?? "unassigned"}
                onValueChange={(v) => handleAssign(v === "unassigned" ? null : v ?? null)}
              >
                <SelectTrigger>
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

          {/* Follow-up scheduling */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
              <CalendarClock className="h-4 w-4" />
              Follow-up
            </h3>
            {optimisticLead.next_follow_up_at && !followUpDate && (
              <div className="mb-3 rounded-lg bg-amber-50 p-3">
                <p className="text-xs text-amber-600">Next follow-up</p>
                <p className="text-sm font-medium text-amber-900">{formatDate(optimisticLead.next_follow_up_at)}</p>
              </div>
            )}
            {canEdit && (
              <div className="space-y-2">
                <Input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
                <Input
                  placeholder="Notes (optional)"
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                />
                <Button size="sm" className="w-full" onClick={handleScheduleFollowUp} disabled={pending || !followUpDate}>
                  {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Schedule
                </Button>
              </div>
            )}
          </div>

          {/* Convert action */}
          {currentStage?.kind !== "won" && currentStage?.kind !== "lost" && currentStage?.kind !== "junk" && canEdit && (
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
                <UserPlus className="h-4 w-4" />
                Convert
              </h3>
              {converting ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">This will create a prospect customer and a pipeline deal (Inquiry stage).</p>
                  <Button size="sm" className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={() => confirmConvert()} disabled={pending}>
                    {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirm Conversion
                  </Button>
                  <Button size="sm" variant="ghost" className="w-full" onClick={() => setConverting(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={() => setConverting(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Convert to Pipeline Deal
                </Button>
              )}
            </div>
          )}

          {/* Conversion info */}
          {currentStage?.kind === "won" && (
            <div className="rounded-2xl bg-emerald-50 p-5 border border-emerald-200">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-900 mb-3">
                <CheckCircle2 className="h-4 w-4" />
                Converted
              </h3>
              {customer && (
                <Link href={`/customers/${customer.id}`} className="flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800 mb-2">
                  <ExternalLink className="h-3 w-3" />
                  Customer: {customer.name}
                </Link>
              )}
              {deal && (
                <Link href={`/pipeline/${deal.id}`} className="flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800">
                  <Briefcase className="h-3 w-3" />
                  Deal: {deal.title} ({deal.stage})
                </Link>
              )}
            </div>
          )}

          {/* Score info */}
          {optimisticLead.score !== null && (
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
                <TrendingUp className="h-4 w-4" />
                Lead Score
              </h3>
              <div className="text-center">
                <p className={`text-3xl font-bold ${optimisticLead.score >= 70 ? "text-emerald-600" : optimisticLead.score >= 40 ? "text-amber-600" : "text-slate-400"}`}>
                  {optimisticLead.score}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {optimisticLead.score >= 70 ? "Hot lead" : optimisticLead.score >= 40 ? "Warm lead" : "Cold lead"}
                </p>
              </div>
              {optimisticLead.score_reason && (
                <p className="text-xs text-slate-400 mt-2 text-center">{optimisticLead.score_reason}</p>
              )}
            </div>
          )}

          {/* Documents */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
              <FileText className="h-4 w-4" />
              Documents ({documents.length})
            </h3>
            {documents.length === 0 ? (
              <p className="text-sm text-slate-400">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
                  >
                    <FileText className="h-4 w-4 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{doc.file_name}</p>
                      <p className="text-xs text-slate-400">{formatDate(doc.created_at)}</p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
