"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { updateDealStage, addDealActivity, assignDeal, updateDeal } from "@/server/deals";
import { toast } from "sonner";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  UserCog,
  Activity,
  Loader2,
  ExternalLink,
  Briefcase,
  Home,
  Tag,
  Calendar,
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
  User,
  Building2,
} from "lucide-react";

const STAGES = [
  { key: "inquiry", label: "Inquiry", color: "bg-blue-500" },
  { key: "viewing", label: "Viewing", color: "bg-cyan-500" },
  { key: "negotiation", label: "Negotiation", color: "bg-amber-500" },
  { key: "offer", label: "Offer", color: "bg-purple-500" },
  { key: "contract", label: "Contract", color: "bg-indigo-500" },
  { key: "won", label: "Won", color: "bg-emerald-500" },
  { key: "lost", label: "Lost", color: "bg-red-500" },
] as const;

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
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
  lost: XCircle,
};

type Deal = {
  id: string;
  title: string;
  customer_id: string;
  property_id: string | null;
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
  invoices,
  userRole,
  userId,
}: {
  deal: Deal;
  activities: DealActivity[];
  agents: { id: string; full_name: string; role: string }[];
  documents: { id: string; file_name: string; file_url: string; file_type: string; created_at: string }[];
  invoices: { id: string; invoice_number: string | null; status: string; total: number; issue_date: string }[];
  userRole: string;
  userId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [activityText, setActivityText] = useState("");
  const [activityType, setActivityType] = useState("note");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    title: deal.title,
    value: deal.value ? String(deal.value / 100) : "",
    expected_close_date: deal.expected_close_date ?? "",
    commission_rate: deal.commission_rate ? String(deal.commission_rate) : "",
  });

  const colors = getStatusColor(deal.stage);
  const waLink = whatsappLink(deal.customer?.phone ?? null);
  const canManage = userRole === "admin" || userRole === "manager";
  const canEdit = canManage || deal.assigned_to === userId;
  const currentStageIdx = STAGES.findIndex((s) => s.key === deal.stage);

  function handleStageChange(newStage: string) {
    if (newStage === deal.stage) return;
    startTransition(async () => {
      const result = await updateDealStage({ id: deal.id, stage: newStage as any });
      if (result.ok) {
        toast.success(`Deal moved to ${STAGES.find((s) => s.key === newStage)?.label}`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleAssign(agentId: string | null) {
    startTransition(async () => {
      const result = await assignDeal(deal.id, agentId);
      if (result.ok) {
        toast.success(agentId ? "Deal assigned" : "Deal unassigned");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleAddActivity() {
    if (!activityText.trim()) return;
    startTransition(async () => {
      const result = await addDealActivity(deal.id, activityType, activityText);
      if (result.ok) {
        setActivityText("");
        toast.success("Activity logged");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleSaveEdit() {
    startTransition(async () => {
      const result = await updateDeal(deal.id, {
        title: editForm.title,
        value: editForm.value ? Number(editForm.value) : undefined,
        expected_close_date: editForm.expected_close_date || null,
        commission_rate: editForm.commission_rate ? Number(editForm.commission_rate) : null,
      });
      if (result.ok) {
        toast.success("Deal updated");
        setEditMode(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/pipeline" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Back to Pipeline
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
            <Briefcase className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{deal.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colors.bg} ${colors.text}`}>
                {deal.stage}
              </span>
              <span className="text-xs text-slate-400 capitalize">{deal.deal_type.replace(/_/g, " ")}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400">{formatAED(deal.value)}</span>
            </div>
          </div>
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
            {editMode ? "Cancel" : "Edit"}
          </Button>
        )}
      </div>

      {/* Stage pipeline bar */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Deal Stage</h3>
          {deal.stage_changed_at && (
            <span className="text-xs text-slate-400">Changed {timeAgo(deal.stage_changed_at)}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {STAGES.filter((s) => s.key !== "lost").map((stage, idx) => {
            const stageIdx = STAGES.findIndex((s) => s.key === stage.key);
            const isPast = stageIdx < currentStageIdx;
            const isCurrent = stage.key === deal.stage;
            const isLost = deal.stage === "lost";
            return (
              <div key={stage.key} className="flex items-center flex-1">
                <button
                  onClick={() => canEdit && handleStageChange(stage.key)}
                  disabled={!canEdit || pending}
                  className={`flex flex-col items-center gap-1 flex-1 ${canEdit ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className={`h-2.5 w-full rounded-full transition-colors ${
                    isLost ? "bg-slate-200" :
                    isCurrent ? stage.color :
                    isPast ? stage.color : "bg-slate-200"
                  } ${isCurrent ? "ring-2 ring-offset-1 ring-slate-300" : ""}`} />
                  <span className={`text-xs ${isCurrent ? "font-semibold text-slate-700" : "text-slate-400"}`}>
                    {stage.label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
        {deal.stage === "lost" && deal.lost_reason && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <strong>Lost:</strong> {deal.lost_reason}
          </div>
        )}
        {canEdit && deal.stage !== "won" && deal.stage !== "lost" && (
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleStageChange("won")} disabled={pending}>
              <CheckCircle2 className="mr-1 h-4 w-4" /> Mark Won
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStageChange("lost")} disabled={pending}>
              <XCircle className="mr-1 h-4 w-4" /> Mark Lost
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Deal info + edit */}
        <div className="space-y-6">
          {/* Deal details */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Deal Details</h2>
            {editMode ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Value (AED)</Label>
                  <Input type="number" value={editForm.value} onChange={(e) => setEditForm({ ...editForm, value: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Expected Close Date</Label>
                  <Input type="date" value={editForm.expected_close_date} onChange={(e) => setEditForm({ ...editForm, expected_close_date: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Commission Rate (%)</Label>
                  <Input type="number" value={editForm.commission_rate} onChange={(e) => setEditForm({ ...editForm, commission_rate: e.target.value })} />
                </div>
                <Button size="sm" className="w-full" onClick={handleSaveEdit} disabled={pending}>
                  {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Value</span>
                  <span className="font-medium text-slate-700">{formatAED(deal.value)}</span>
                </div>
                {deal.commission_amount && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Commission</span>
                    <span className="font-medium text-emerald-600">{formatAED(deal.commission_amount)}</span>
                  </div>
                )}
                {deal.commission_rate && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Commission Rate</span>
                    <span className="font-medium text-slate-700">{deal.commission_rate}%</span>
                  </div>
                )}
                {deal.expected_close_date && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expected Close</span>
                    <span className="font-medium text-slate-700">{formatDate(deal.expected_close_date)}</span>
                  </div>
                )}
                {deal.ejari_no && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ejari No</span>
                    <span className="font-medium text-slate-700">{deal.ejari_no}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Created</span>
                  <span className="font-medium text-slate-700">{formatDate(deal.created_at)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Assignment */}
          {canManage && (
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
              <h2 className="mb-4 text-sm font-semibold text-slate-700">Assignment</h2>
              <Select
                value={deal.assigned_to ?? "unassigned"}
                onValueChange={(v) => handleAssign(v === "unassigned" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.full_name} ({a.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Documents */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Documents ({documents.length})</h2>
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

        {/* Right: Customer, Lead, Activity timeline */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer info */}
          {deal.customer && (
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700">Customer</h2>
                <Link href={`/customers/${deal.customer.id}`} className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700">
                  View Profile <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{deal.customer.name}</p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    deal.customer.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {deal.customer.status}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {deal.customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <a href={`tel:${deal.customer.phone}`} className="text-slate-700 hover:text-slate-900">{deal.customer.phone}</a>
                    {waLink && (
                      <a href={waLink} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                      </a>
                    )}
                  </div>
                )}
                {deal.customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <a href={`mailto:${deal.customer.email}`} className="text-slate-700 hover:text-slate-900">{deal.customer.email}</a>
                  </div>
                )}
                {deal.customer.nationality && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700">{deal.customer.nationality}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Originating lead */}
          {deal.lead && (
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700">Originating Lead</h2>
                <Link href={`/leads/${deal.lead.id}`} className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700">
                  View Lead <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Name</p>
                  <p className="font-medium text-slate-700">{deal.lead.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Source</p>
                  <p className="font-medium text-slate-700 capitalize">{deal.lead.source.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Interest</p>
                  <p className="font-medium text-slate-700 capitalize">{deal.lead.interest.replace(/_/g, " ")}</p>
                </div>
                {deal.lead.score !== null && (
                  <div>
                    <p className="text-xs text-slate-400">Lead Score</p>
                    <p className={`font-bold ${deal.lead.score >= 70 ? "text-emerald-600" : deal.lead.score >= 40 ? "text-amber-600" : "text-slate-400"}`}>
                      {deal.lead.score}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invoices (if won) */}
          {deal.stage === "won" && invoices.length > 0 && (
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
              <h2 className="mb-4 text-sm font-semibold text-slate-700">Invoices ({invoices.length})</h2>
              <div className="space-y-2">
                {invoices.map((inv) => {
                  const invColors = getStatusColor(inv.status);
                  return (
                    <div key={inv.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{inv.invoice_number ?? inv.id.slice(0, 8)}</p>
                          <p className="text-xs text-slate-400">{formatDate(inv.issue_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-700">{formatAED(inv.total)}</span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${invColors.bg} ${invColors.text}`}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity timeline */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Activity Timeline</h2>

            {/* Quick add */}
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
                <p className="text-sm text-slate-400">No activity yet.</p>
              ) : (
                activities.map((act) => {
                  const Icon = ACTIVITY_ICONS[act.type] ?? Activity;
                  return (
                    <div key={act.id} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <Icon className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-700">{act.summary}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
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
      </div>
    </div>
  );
}
