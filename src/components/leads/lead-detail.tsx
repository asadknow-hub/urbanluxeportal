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
  fieldDefs,
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
  stages: { id: string; name: string; color: string; kind: string; sort: number; helper_text: string | null }[];
  fieldDefs: FieldDef[];
  customer: { id: string; name: string; phone: string | null; email: string | null } | null;
  deal: { id: string; title: string; stage: string; value: number; deal_type: string } | null;
  documents: { id: string; file_name: string; file_url: string; file_type: string; created_at: string }[];
  lostReasons: Record<string, string[]>;
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
  const [editForm, setEditForm] = useState<Record<string, string>>({
    name: lead.name,
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    interest: lead.interest,
    budget_min: lead.budget_min ? String(lead.budget_min / 100) : "",
    budget_max: lead.budget_max ? String(lead.budget_max / 100) : "",
    notes: lead.notes ?? "",
    preferred_areas: lead.preferred_areas?.join(", ") ?? "",
    language: lead.language ?? "",
    financing: lead.financing ?? "",
    timeframe: lead.timeframe ?? "",
    purpose: lead.purpose ?? "",
    bedrooms: lead.bedrooms ?? "",
    category: lead.category ?? "",
    tags: lead.tags?.join(", ") ?? "",
  });
  // Custom field values in the edit form (keyed by field def key)
  const [editCustom, setEditCustom] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const def of fieldDefs) {
      const val = lead.custom?.[def.key];
      if (val !== undefined && val !== null) {
        initial[def.key] = Array.isArray(val) ? val.join(", ") : String(val);
      } else {
        initial[def.key] = "";
      }
    }
    return initial;
  });
  const [converting, setConverting] = useState(false);
  const [reasonDialog, setReasonDialog] = useState<{ stageId: string; stageName: string; kind: string } | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  function handleSaveEdit() {
    // Build custom object from editCustom state
    const customData: Record<string, unknown> = {};
    for (const def of fieldDefs) {
      const raw = editCustom[def.key];
      if (raw === undefined || raw === "") continue;
      if (def.type === "multiselect") {
        customData[def.key] = raw.split(",").map((s) => s.trim()).filter(Boolean);
      } else if (def.type === "number" || def.type === "money") {
        customData[def.key] = def.type === "money" ? Number(raw) * 100 : Number(raw);
      } else if (def.type === "checkbox") {
        customData[def.key] = raw === "true" || raw === "1";
      } else {
        customData[def.key] = raw;
      }
    }

    const updatePayload: Record<string, unknown> = {
      name: editForm.name,
      phone: editForm.phone || null,
      email: editForm.email || undefined,
      interest: editForm.interest,
      budget_min: editForm.budget_min ? Number(editForm.budget_min) * 100 : null,
      budget_max: editForm.budget_max ? Number(editForm.budget_max) * 100 : null,
      notes: editForm.notes || null,
      preferred_areas: editForm.preferred_areas ? editForm.preferred_areas.split(",").map((s) => s.trim()).filter(Boolean) : [],
      language: editForm.language || null,
      financing: editForm.financing || null,
      timeframe: editForm.timeframe || null,
      purpose: editForm.purpose || null,
      bedrooms: editForm.bedrooms || null,
      category: editForm.category || null,
      tags: editForm.tags ? editForm.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
      custom: customData,
    };

    startTransition(async () => {
      const result = await updateLead(optimisticLead.id, updatePayload as any);
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
          preferred_areas: editForm.preferred_areas ? editForm.preferred_areas.split(",").map((s) => s.trim()).filter(Boolean) : [],
          language: editForm.language || null,
          financing: editForm.financing || null,
          timeframe: editForm.timeframe || null,
          purpose: editForm.purpose || null,
          bedrooms: editForm.bedrooms || null,
          category: editForm.category || null,
          tags: editForm.tags ? editForm.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
          custom: customData,
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
        <div className="flex items-center gap-2">
          {!optimisticLead.assigned_to && canEdit && (
            <Button size="sm" variant="outline" onClick={handleClaim} disabled={pending}>
              <UserPlus className="mr-2 h-4 w-4" />
              Claim
            </Button>
          )}
          {canEdit && !editMode && currentStage?.kind !== "won" && (
            <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
              Edit
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

      {/* Stage workflow — thin inline step bar, fully dynamic from lead_stages table */}
      {stages.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-0 flex-wrap">
            {stages.filter((s) => s.kind === "open" || s.kind === "active" || s.kind === "won").map((stage, idx, filtered) => {
              const isCurrent = optimisticLead.stage_id === stage.id;
              const currentIdx = filtered.findIndex((s) => s.id === optimisticLead.stage_id);
              const isPassed = currentIdx >= 0 && idx < currentIdx;
              const isLast = idx === filtered.length - 1;
              const stageColor = stage.color || "#10b981";

              return (
                <div key={stage.id} className="flex items-center shrink-0">
                  <button
                    onClick={() => canEdit && handleStageChange(stage.id)}
                    disabled={pending || !canEdit}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      isCurrent
                        ? "text-white"
                        : isPassed
                        ? "text-slate-700 hover:bg-slate-100"
                        : "text-slate-400 hover:bg-slate-100"
                    } ${canEdit ? "cursor-pointer" : "cursor-default"}`}
                    style={isCurrent ? { backgroundColor: stageColor } : isPassed ? { backgroundColor: `${stageColor}20`, border: `1px solid ${stageColor}40` } : {}}
                  >
                    {isPassed && (
                      <CheckCircle2 className="h-3 w-3" style={{ color: stageColor }} />
                    )}
                    {stage.name}
                  </button>
                  {!isLast && (
                    <div
                      className="h-0.5 w-5 rounded-full transition-colors"
                      style={{ backgroundColor: isPassed ? stageColor : "#e2e8f0" }}
                    />
                  )}
                </div>
              );
            })}

            {/* Lost / Junk as small end actions */}
            {stages.filter((s) => s.kind === "lost" || s.kind === "junk").length > 0 && (
              <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200">
                {stages
                  .filter((s) => s.kind === "lost" || s.kind === "junk")
                  .map((stage) => (
                    <button
                      key={stage.id}
                      onClick={() => canEdit && handleStageChange(stage.id)}
                      disabled={pending || !canEdit}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                        optimisticLead.stage_id === stage.id
                          ? "bg-red-100 text-red-600"
                          : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                      } ${canEdit ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <XCircle className="h-3 w-3" />
                      {stage.name}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {currentStage?.helper_text && (
            <p className="mt-2 text-xs text-slate-400">{currentStage.helper_text}</p>
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
              <div className="space-y-4">
                {/* Standard fields */}
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
                  <div className="space-y-1">
                    <Label className="text-xs">Preferred Areas (comma-separated)</Label>
                    <Input value={editForm.preferred_areas} onChange={(e) => setEditForm({ ...editForm, preferred_areas: e.target.value })} placeholder="e.g. Dubai Marina, JLT" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Language</Label>
                    <Input value={editForm.language} onChange={(e) => setEditForm({ ...editForm, language: e.target.value })} placeholder="e.g. en, ar, fr" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Financing</Label>
                    <Input value={editForm.financing} onChange={(e) => setEditForm({ ...editForm, financing: e.target.value })} placeholder="e.g. Cash, Mortgage" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Timeframe</Label>
                    <Input value={editForm.timeframe} onChange={(e) => setEditForm({ ...editForm, timeframe: e.target.value })} placeholder="e.g. 1-3 months" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Purpose</Label>
                    <Input value={editForm.purpose} onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })} placeholder="e.g. Investment, End Use" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Bedrooms</Label>
                    <Input value={editForm.bedrooms} onChange={(e) => setEditForm({ ...editForm, bedrooms: e.target.value })} placeholder="e.g. Studio, 1BR, 2BR" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Category</Label>
                    <Input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} placeholder="e.g. Apartment, Villa" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tags (comma-separated)</Label>
                    <Input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="e.g. hot, vip, investor" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Textarea rows={3} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                </div>

                {/* Custom fields — dynamically rendered from fieldDefs */}
                {fieldDefs.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Custom Fields</p>
                    <div className="grid grid-cols-2 gap-3">
                      {fieldDefs.map((def) => {
                        const val = editCustom[def.key] ?? "";
                        return (
                          <div key={def.id} className="space-y-1">
                            <Label className="text-xs">
                              {def.label}
                              {def.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            {def.type === "textarea" ? (
                              <Textarea
                                rows={2}
                                value={val}
                                onChange={(e) => setEditCustom({ ...editCustom, [def.key]: e.target.value })}
                              />
                            ) : def.type === "select" && def.options ? (
                              <Select value={val} onValueChange={(v) => setEditCustom({ ...editCustom, [def.key]: v ?? "" })}>
                                <SelectTrigger><SelectValue placeholder={`Select ${def.label}`} /></SelectTrigger>
                                <SelectContent>
                                  {def.options.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : def.type === "multiselect" && def.options ? (
                              <Select value={val ? val.split(", ")[0] : undefined} onValueChange={(v) => setEditCustom({ ...editCustom, [def.key]: v ?? "" })}>
                                <SelectTrigger><SelectValue placeholder={`Select ${def.label}`} /></SelectTrigger>
                                <SelectContent>
                                  {def.options.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : def.type === "checkbox" ? (
                              <Select value={val || "false"} onValueChange={(v) => setEditCustom({ ...editCustom, [def.key]: v ?? "false" })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Yes</SelectItem>
                                  <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type={def.type === "number" || def.type === "money" ? "number" : def.type === "date" ? "date" : def.type === "phone" ? "tel" : def.type === "url" ? "url" : "text"}
                                value={val}
                                onChange={(e) => setEditCustom({ ...editCustom, [def.key]: e.target.value })}
                                placeholder={def.type === "money" ? "Amount in AED" : `Enter ${def.label}`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                {/* Detail fields — grid showing all fields including empty ones */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 text-sm">
                  <div>
                    <span className="text-xs text-slate-400">Budget</span>
                    <p className="font-medium text-slate-700">
                      {optimisticLead.budget_min || optimisticLead.budget_max
                        ? `${optimisticLead.budget_min ? formatAED(optimisticLead.budget_min) : "?"} – ${optimisticLead.budget_max ? formatAED(optimisticLead.budget_max) : "?"}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Preferred Areas</span>
                    <p className="font-medium text-slate-700">
                      {optimisticLead.preferred_areas && optimisticLead.preferred_areas.length > 0
                        ? optimisticLead.preferred_areas.join(", ")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Bedrooms</span>
                    <p className="font-medium text-slate-700 capitalize">{optimisticLead.bedrooms ? formatLabel(optimisticLead.bedrooms) : "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Category</span>
                    <p className="font-medium text-slate-700 capitalize">{optimisticLead.category ? formatLabel(optimisticLead.category) : "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Financing</span>
                    <p className="font-medium text-slate-700 capitalize">{optimisticLead.financing ? formatLabel(optimisticLead.financing) : "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Timeframe</span>
                    <p className="font-medium text-slate-700 capitalize">{optimisticLead.timeframe ? formatLabel(optimisticLead.timeframe) : "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Purpose</span>
                    <p className="font-medium text-slate-700 capitalize">{optimisticLead.purpose ? formatLabel(optimisticLead.purpose) : "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Language</span>
                    <p className="font-medium text-slate-700 uppercase">{optimisticLead.language ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Created</span>
                    <p className="font-medium text-slate-700">{formatDate(optimisticLead.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Created By</span>
                    <p className="font-medium text-slate-700">{optimisticLead.created_by_profile?.full_name ?? "—"}</p>
                  </div>
                  {fieldDefs.map((def) => {
                    const rawVal = optimisticLead.custom?.[def.key];
                    let displayVal: string;
                    if (rawVal === undefined || rawVal === null || rawVal === "") {
                      displayVal = "—";
                    } else if (Array.isArray(rawVal)) {
                      displayVal = rawVal.join(", ");
                    } else if (def.type === "money") {
                      displayVal = formatAED(Number(rawVal));
                    } else if (def.type === "checkbox") {
                      displayVal = rawVal ? "Yes" : "No";
                    } else if (def.type === "date") {
                      displayVal = formatDate(String(rawVal));
                    } else {
                      displayVal = String(rawVal);
                    }
                    if (def.type === "select" && def.options && rawVal) {
                      displayVal = def.options.find((o) => o.value === rawVal)?.label ?? displayVal;
                    }
                    return (
                      <div key={def.id}>
                        <span className="text-xs text-slate-400">{def.label}</span>
                        <p className="font-medium text-slate-700 capitalize">{displayVal}</p>
                      </div>
                    );
                  })}
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
