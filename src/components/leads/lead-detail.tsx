"use client";

import { useState, useTransition } from "react";
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
import { getStatusColor } from "@/lib/status-colors";
import { whatsappLink } from "@/lib/phone";
import { formatAED } from "@/lib/money";
import { formatDate, timeAgo } from "@/lib/dates";
import {
  assignLead,
  updateLeadStatus,
  scheduleFollowUp,
  addLeadActivity,
  convertLead,
  updateLead,
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
};

type Agent = { id: string; full_name: string; role: string };

const STATUS_FLOW = ["new", "contacted", "qualified", "converted", "unqualified"];

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  unqualified: "Unqualified",
  converted: "Converted",
};

const SOURCE_LABELS: Record<string, string> = {
  website: "Website",
  bayut: "Bayut",
  property_finder: "Property Finder",
  dubizzle: "Dubizzle",
  referral: "Referral",
  walk_in: "Walk-in",
  social: "Social",
  other: "Other",
};

const INTEREST_LABELS: Record<string, string> = {
  buy: "Buy",
  rent: "Rent",
  sell: "Sell",
  off_plan: "Off-Plan",
  commercial: "Commercial",
};

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
  customer,
  deal,
  documents,
  userRole,
  userId,
}: {
  lead: Lead;
  activities: LeadActivity[];
  agents: Agent[];
  customer: { id: string; name: string; phone: string | null; email: string | null } | null;
  deal: { id: string; title: string; stage: string; value: number; deal_type: string } | null;
  documents: { id: string; file_name: string; file_url: string; file_type: string; created_at: string }[];
  userRole: string;
  userId: string;
}) {
  const [pending, startTransition] = useTransition();
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

  const colors = getStatusColor(lead.status);
  const waLink = whatsappLink(lead.phone);
  const canManage = userRole === "admin" || userRole === "manager";
  const canEdit = canManage || lead.assigned_to === userId;
  const initials = lead.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  function handleAssign(agentId: string | null) {
    startTransition(async () => {
      const result = await assignLead(lead.id, agentId);
      if (result.ok) {
        toast.success(agentId ? "Lead assigned" : "Lead unassigned");
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      const result = await updateLeadStatus(lead.id, newStatus);
      if (result.ok) {
        toast.success(`Status changed to ${newStatus}`);
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleAddActivity() {
    if (!activityText.trim()) return;
    startTransition(async () => {
      const result = await addLeadActivity(lead.id, activityType, activityText);
      if (result.ok) {
        toast.success("Activity logged");
        setActivityText("");
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleScheduleFollowUp() {
    if (!followUpDate) return;
    startTransition(async () => {
      const result = await scheduleFollowUp(lead.id, followUpDate, followUpNotes || undefined);
      if (result.ok) {
        toast.success("Follow-up scheduled");
        setFollowUpDate("");
        setFollowUpNotes("");
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleSaveEdit() {
    startTransition(async () => {
      const result = await updateLead(lead.id, {
        name: editForm.name,
        phone: editForm.phone || null,
        email: editForm.email || undefined,
        interest: editForm.interest as any,
        budget_min: editForm.budget_min ? Number(editForm.budget_min) * 100 : null,
        budget_max: editForm.budget_max ? Number(editForm.budget_max) * 100 : null,
        notes: editForm.notes || null,
      } as any);
      if (result.ok) {
        toast.success("Lead updated");
        setEditMode(false);
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function confirmConvert() {
    startTransition(async () => {
      const result = await convertLead(lead.id, {});
      if (result.ok) {
        toast.success("Lead converted to pipeline deal");
        setConverting(false);
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
            <h1 className="text-xl font-bold text-slate-900">{lead.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
                {STATUS_LABELS[lead.status] ?? lead.status}
              </span>
              <span className="capitalize">{SOURCE_LABELS[lead.source] ?? lead.source}</span>
              <span>·</span>
              <span className="capitalize">{INTEREST_LABELS[lead.interest] ?? lead.interest}</span>
              {lead.score !== null && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Score: {lead.score}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {canEdit && !editMode && lead.status !== "converted" && (
          <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
            Edit
          </Button>
        )}
      </div>

      {/* Status pipeline */}
      {lead.status !== "converted" && lead.status !== "unqualified" && (
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Lead Workflow</h3>
          <div className="flex items-center gap-2">
            {STATUS_FLOW.filter((s) => s !== "unqualified").map((status, idx) => {
              const currentIdx = STATUS_FLOW.indexOf(lead.status);
              const isPassed = idx <= currentIdx;
              const isCurrent = status === lead.status;
              return (
                <div key={status} className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => canEdit && handleStatusChange(status)}
                    disabled={pending || !canEdit}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      isCurrent
                        ? "bg-emerald-500 text-white"
                        : isPassed
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    } ${canEdit ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                      isCurrent ? "bg-white/20" : isPassed ? "bg-emerald-200" : "bg-slate-200"
                    }`}>
                      {isPassed ? "✓" : idx + 1}
                    </span>
                    {STATUS_LABELS[status]}
                  </button>
                  {idx < STATUS_FLOW.filter((s) => s !== "unqualified").length - 1 && (
                    <div className={`h-0.5 flex-1 ${isPassed ? "bg-emerald-300" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
          {canEdit && (
            <button
              onClick={() => handleStatusChange("unqualified")}
              disabled={pending}
              className="mt-3 inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
            >
              <XCircle className="h-3 w-3" />
              Mark as Unqualified
            </button>
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
                    <Select value={editForm.interest} onValueChange={(v) => setEditForm({ ...editForm, interest: v ?? "buy" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(INTEREST_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <a href={`tel:${lead.phone}`} className="text-slate-700 hover:text-slate-900">{lead.phone}</a>
                    {waLink && (
                      <a href={waLink} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                      </a>
                    )}
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <a href={`mailto:${lead.email}`} className="text-slate-700 hover:text-slate-900">{lead.email}</a>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <p className="text-xs text-slate-400">Budget</p>
                    <p className="font-medium text-slate-700">
                      {lead.budget_min || lead.budget_max
                        ? `${lead.budget_min ? formatAED(lead.budget_min) : "?"} – ${lead.budget_max ? formatAED(lead.budget_max) : "?"}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Preferred Areas</p>
                    <p className="font-medium text-slate-700">
                      {lead.preferred_areas && lead.preferred_areas.length > 0
                        ? lead.preferred_areas.join(", ")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Created</p>
                    <p className="font-medium text-slate-700">{formatDate(lead.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Created By</p>
                    <p className="font-medium text-slate-700">{lead.created_by_profile?.full_name ?? "—"}</p>
                  </div>
                </div>
                {lead.notes && (
                  <div className="pt-2">
                    <p className="text-xs text-slate-400">Notes</p>
                    <p className="text-slate-600 mt-1">{lead.notes}</p>
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
              {activities.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No activities yet.</p>
              ) : (
                activities.map((a) => {
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
            {lead.assigned_to_profile ? (
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={lead.assigned_to_profile.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                    {lead.assigned_to_profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-slate-900">{lead.assigned_to_profile.full_name}</p>
                  <p className="text-xs text-slate-400 capitalize">{lead.assigned_to_profile.role}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-3">Unassigned</p>
            )}
            {canManage && (
              <Select
                value={lead.assigned_to ?? "unassigned"}
                onValueChange={(v) => handleAssign(v === "unassigned" ? null : v ?? null)}
              >
                <SelectTrigger><SelectValue placeholder="Assign to agent" /></SelectTrigger>
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
            {lead.next_follow_up_at && !followUpDate && (
              <div className="mb-3 rounded-lg bg-amber-50 p-3">
                <p className="text-xs text-amber-600">Next follow-up</p>
                <p className="text-sm font-medium text-amber-900">{formatDate(lead.next_follow_up_at)}</p>
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
          {lead.status !== "converted" && lead.status !== "unqualified" && canEdit && (
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
          {lead.status === "converted" && (
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
          {lead.score !== null && (
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
                <TrendingUp className="h-4 w-4" />
                Lead Score
              </h3>
              <div className="text-center">
                <p className={`text-3xl font-bold ${lead.score >= 70 ? "text-emerald-600" : lead.score >= 40 ? "text-amber-600" : "text-slate-400"}`}>
                  {lead.score}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {lead.score >= 70 ? "Hot lead" : lead.score >= 40 ? "Warm lead" : "Cold lead"}
                </p>
              </div>
              {lead.score_reason && (
                <p className="text-xs text-slate-400 mt-2 text-center">{lead.score_reason}</p>
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
