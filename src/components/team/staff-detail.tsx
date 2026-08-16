"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateStaffProfile, sendPasswordResetLink, setStaffPassword } from "@/server/team";
import { createDocument as createDoc, deleteDocument as deleteDoc, getSignedUrl } from "@/server/documents";
import { formatDate } from "@/lib/dates";
import { canonicalDocumentPath, normalizeDocCategory } from "@/lib/document-storage";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Loader2,
  Mail,
  Phone,
  Shield,
  User,
  UserCog,
  KeyRound,
  Send,
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  FileCheck2,
  X,
  Activity as ActivityIcon,
  Briefcase,
  Users,
  Clock,
  CalendarDays,
  TrendingUp,
} from "lucide-react";

type Staff = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  commission_rate: number | null;
  brn: string | null;
  is_active: boolean;
  created_at: string;
};

type Lead = { id: string; name: string; source: string; status: string; created_at: string };
type Deal = { id: string; title: string; stage: string; value: number; updated_at: string };
type Doc = {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  category: string;
  expiry_date: string | null;
  created_at: string;
};
type Activity = { action: string; entity_type: string; entity_id: string; created_at: string };

type SessionStats = {
  daysLoggedInThisMonth: number;
  daysNotLoggedIn: number;
  totalActiveSecondsThisMonth: number;
  avgDailyActiveSeconds: number;
  lastLoginAt: string | null;
  sessions: Array<{
    id: string;
    session_date: string;
    login_at: string;
    logout_at: string | null;
    total_active_seconds: number;
  }>;
  dailyBreakdown: Array<{ date: string; active_seconds: number; sessions: number }>;
};

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  admin: Shield,
  manager: UserCog,
  agent: User,
  accountant: UserCog,
};

const TABS = [
  { id: "profile", label: "Profile", icon: UserCog },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "password", label: "Password & Login", icon: KeyRound },
  { id: "portal_activity", label: "Portal Activity", icon: Clock },
  { id: "activity", label: "Work Activity", icon: ActivityIcon },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StaffDetail({
  staff,
  leads,
  deals,
  documents,
  activities,
  currentUserRole,
  sessionStats,
}: {
  staff: Staff;
  leads: Lead[];
  deals: Deal[];
  documents: Doc[];
  activities: Activity[];
  currentUserRole: string;
  sessionStats?: SessionStats;
}) {
  const [activeTab, setActiveTab] = useState("profile");
  const RoleIcon = ROLE_ICONS[staff.role] ?? User;
  const initials = staff.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/team" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Back to Staff
      </Link>

      {/* Header card */}
      <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
        <Avatar className="h-16 w-16">
          <AvatarImage src={staff.avatar_url ?? undefined} />
          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{staff.full_name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> {staff.email}
            </span>
            {staff.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {staff.phone}
              </span>
            )}
            <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
              staff.role === "admin" ? "bg-red-50 text-red-700 border-red-200" :
              staff.role === "manager" ? "bg-blue-50 text-blue-700 border-blue-200" :
              staff.role === "agent" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              "bg-purple-50 text-purple-700 border-purple-200"
            }`}>
              <RoleIcon className="h-3 w-3" />
              {staff.role}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              staff.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}>
              {staff.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <p className="text-2xl font-bold text-slate-900">{leads.length}</p>
          </div>
          <p className="text-xs text-slate-400">Assigned Leads</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-slate-400" />
            <p className="text-2xl font-bold text-slate-900">{deals.length}</p>
          </div>
          <p className="text-xs text-slate-400">Active Deals</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <p className="text-2xl font-bold text-slate-900">{documents.length}</p>
          </div>
          <p className="text-xs text-slate-400">Documents</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "profile" && (
        <ProfileTab staff={staff} currentUserRole={currentUserRole} />
      )}
      {activeTab === "documents" && (
        <DocumentsTab staff={staff} documents={documents} />
      )}
      {activeTab === "password" && (
        <PasswordTab staff={staff} />
      )}
      {activeTab === "portal_activity" && sessionStats && (
        <PortalActivityTab stats={sessionStats} />
      )}
      {activeTab === "activity" && (
        <ActivityTab
          activities={activities}
          leads={leads}
          deals={deals}
        />
      )}
    </div>
  );
}

// ============================================================
// PORTAL ACTIVITY TAB
// ============================================================
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ${seconds % 60}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function PortalActivityTab({ stats }: { stats: SessionStats }) {
  const maxActive = Math.max(...stats.dailyBreakdown.map((d) => d.active_seconds), 1);
  const monthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-emerald-500" />
            <p className="text-2xl font-bold text-slate-900">{stats.daysLoggedInThisMonth}</p>
          </div>
          <p className="text-xs text-slate-400">Days Logged In</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-red-400" />
            <p className="text-2xl font-bold text-slate-900">{stats.daysNotLoggedIn}</p>
          </div>
          <p className="text-xs text-slate-400">Days Not Logged In</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <p className="text-2xl font-bold text-slate-900">{formatDuration(stats.totalActiveSecondsThisMonth)}</p>
          </div>
          <p className="text-xs text-slate-400">Total Active Time</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <p className="text-2xl font-bold text-slate-900">{formatDuration(stats.avgDailyActiveSeconds)}</p>
          </div>
          <p className="text-xs text-slate-400">Avg Daily Active</p>
        </div>
      </div>

      {/* Daily activity bar chart */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Daily Active Time — {monthName}</h3>
        <p className="text-xs text-slate-400 mb-4">Time spent in portal per day</p>
        {stats.dailyBreakdown.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No activity recorded this month.</p>
        ) : (
          <div className="flex items-end gap-1 h-32 overflow-x-auto">
            {stats.dailyBreakdown.map((d) => {
              const heightPct = (d.active_seconds / maxActive) * 100;
              const dayLabel = new Date(d.date).getDate();
              return (
                <div key={d.date} className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: 28 }}>
                  <div className="flex-1 flex items-end w-full">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-emerald-400 to-emerald-300 transition-all hover:from-emerald-500 hover:to-emerald-400"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                      title={`${formatDate(d.date)}: ${formatDuration(d.active_seconds)}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">{dayLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session log table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Session Log (Recent 30)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Login Time</th>
                <th className="px-4 py-3">Logout Time</th>
                <th className="px-4 py-3 text-right">Active Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.sessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No sessions recorded.</td>
                </tr>
              ) : (
                stats.sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{formatDate(s.session_date)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(s.login_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {s.logout_at
                        ? new Date(s.logout_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                        : <span className="text-emerald-500">Active now</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {formatDuration(s.total_active_seconds)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {stats.lastLoginAt && (
        <p className="text-xs text-slate-400 text-center">
          Last login: {formatDate(stats.lastLoginAt)} at {" "}
          {new Date(stats.lastLoginAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </div>
  );
}

// ============================================================
// PROFILE TAB
// ============================================================
function ProfileTab({ staff, currentUserRole }: { staff: Staff; currentUserRole: string }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    full_name: staff.full_name,
    email: staff.email,
    phone: staff.phone ?? "",
    role: staff.role,
    brn: staff.brn ?? "",
    commission_rate: staff.commission_rate?.toString() ?? "",
    is_active: staff.is_active,
  });

  function set<K extends keyof typeof form>(key: K, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateStaffProfile({
        id: staff.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        role: form.role as "admin" | "manager" | "agent" | "accountant",
        brn: form.brn || null,
        commission_rate: form.commission_rate ? parseFloat(form.commission_rate) : null,
        is_active: form.is_active,
        avatar_url: staff.avatar_url,
      });
      if (result.ok) {
        toast.success("Profile updated");
      } else {
        toast.error(result.error ?? "Failed to update");
      }
    });
  }

  const canEditRole = currentUserRole === "admin";

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="p_name">Full Name *</Label>
          <Input id="p_name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p_email">Email *</Label>
          <Input id="p_email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p_phone">Phone</Label>
          <Input id="p_phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+971 50 123 4567" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p_brn">BRN (Broker Registration No.)</Label>
          <Input id="p_brn" value={form.brn} onChange={(e) => set("brn", e.target.value)} placeholder="BRN-12345" />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={form.role}
            onValueChange={(v) => set("role", v ?? "agent")}
            disabled={!canEditRole}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="accountant">Accountant</SelectItem>
            </SelectContent>
          </Select>
          {!canEditRole && (
            <p className="text-xs text-slate-400">Only admins can change roles.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="p_commission">Commission Rate (%)</Label>
          <Input
            id="p_commission"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={form.commission_rate}
            onChange={(e) => set("commission_rate", e.target.value)}
            placeholder="2.0"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Label htmlFor="p_active">Account Active</Label>
        <button
          type="button"
          role="switch"
          aria-checked={form.is_active}
          onClick={() => set("is_active", !form.is_active)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            form.is_active ? "bg-emerald-500" : "bg-slate-200"
          }`}
        >
          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
            form.is_active ? "translate-x-5" : "translate-x-0"
          }`} />
        </button>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}

// ============================================================
// DOCUMENTS TAB
// ============================================================
function DocumentsTab({ staff, documents }: { staff: Staff; documents: Doc[] }) {
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState("other");
  const [docExpiry, setDocExpiry] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ path: string; name: string; mime: string; size: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const DOC_CATEGORIES = ["emirates_id", "passport", "visa", "contract", "permit", "brn", "other"];

  async function handleFileUpload(file: File | null) {
    if (!file) return;
    setUploading(true);

    const supabase = createSupabaseBrowserClient();
    const path = canonicalDocumentPath({
      entityType: "staff",
      entityId: staff.id,
      category: docCategory,
      originalName: file.name,
    });

    const { error } = await supabase.storage
      .from("documents")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      toast.error(`Upload failed: ${error.message}`);
    } else {
      setUploadedFile({ path, name: file.name, mime: file.type || "application/octet-stream", size: file.size });
      if (!docName) setDocName(file.name.replace(/\.[^.]+$/, ""));
      toast.success("File uploaded");
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSaveDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadedFile) {
      toast.error("Upload a file first");
      return;
    }
    startTransition(async () => {
      const result = await createDoc({
        name: docName || uploadedFile.name,
        storage_path: uploadedFile.path,
        mime_type: uploadedFile.mime,
        size_bytes: uploadedFile.size,
        category: normalizeDocCategory(docCategory),
        entity_type: "staff",
        entity_id: staff.id,
        expiry_date: docExpiry || null,
      });
      if (result.ok) {
        toast.success("Document saved");
        setUploadedFile(null);
        setDocName("");
        setDocCategory("other");
        setDocExpiry("");
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleView(path: string) {
    startTransition(async () => {
      const result = await getSignedUrl(path);
      if (result.ok && result.data) {
        window.open(result.data.url, "_blank");
      } else {
        toast.error(result.error ?? "Failed to get URL");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteDoc(id);
      if (result.ok) {
        toast.success("Document deleted");
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Upload form */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Upload Staff Document</h3>
        <form onSubmit={handleSaveDoc} className="space-y-3">
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center">
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf,.docx"
              onChange={(e) => handleFileUpload(e.target.files?.[0] ?? null)}
              className="hidden"
              id="staff-doc-upload"
            />
            <label
              htmlFor="staff-doc-upload"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Click to upload"}
            </label>
            <p className="mt-2 text-xs text-slate-400">Emirates ID, Passport, Visa, BRN, Contract · PDF, JPG, PNG</p>
          </div>

          {uploadedFile && (
            <div className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
              <FileCheck2 className="h-5 w-5 text-emerald-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{uploadedFile.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(uploadedFile.size)}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setUploadedFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Doc name" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={docCategory} onValueChange={(v) => setDocCategory(v ?? "other")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Expiry</Label>
              <Input type="date" value={docExpiry} onChange={(e) => setDocExpiry(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={pending || !uploadedFile}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Document
            </Button>
          </div>
        </form>
      </div>

      {/* Documents list */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Staff Documents ({documents.length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {documents.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">No documents uploaded yet.</p>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <FileText className="h-5 w-5 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                  <p className="text-xs text-slate-400">
                    {doc.category.replace(/_/g, " ")} · {formatBytes(doc.size_bytes)} · {formatDate(doc.created_at)}
                    {doc.expiry_date && ` · Expires: ${formatDate(doc.expiry_date)}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="sm" variant="ghost" onClick={() => handleView(doc.storage_path)} disabled={pending}>
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(doc.id)} disabled={pending}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PASSWORD TAB
// ============================================================
function PasswordTab({ staff }: { staff: Staff }) {
  const [pending, startTransition] = useTransition();
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetLink, setResetLink] = useState("");

  function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await setStaffPassword(staff.id, newPassword);
      if (result.ok) {
        toast.success("Password set successfully");
        setNewPassword("");
        setShowPassword(false);
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleSendReset() {
    startTransition(async () => {
      const result = await sendPasswordResetLink(staff.id, staff.email);
      if (result.ok) {
        toast.success("Password reset link generated");
        setResetLink(result.data?.link ?? "");
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  return (
    <div className="max-w-lg space-y-4">
      {/* Set password directly */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Set Password Directly</h3>
        <p className="mt-1 text-xs text-slate-400">
          Set a new password for this user. They can use it to log in immediately.
        </p>
        <form onSubmit={handleSetPassword} className="mt-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="new_pwd">New Password</Label>
            <div className="relative">
              <Input
                id="new_pwd"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending || newPassword.length < 8}>
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Set Password
            </Button>
          </div>
        </form>
      </div>

      {/* Send reset link */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Send Password Reset Link</h3>
        <p className="mt-1 text-xs text-slate-400">
          Generate a secure recovery link that you can share with the user. They'll set their own password.
        </p>
        <div className="mt-4">
          <Button onClick={handleSendReset} disabled={pending} variant="outline">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Generate Reset Link
          </Button>
        </div>

        {resetLink && (
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-600 mb-1">Recovery Link (share with user):</p>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={resetLink}
                className="text-xs font-mono"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(resetLink);
                  toast.success("Link copied to clipboard");
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ACTIVITY TAB
// ============================================================
function ActivityTab({
  activities,
  leads,
  deals,
}: {
  activities: Activity[];
  leads: Lead[];
  deals: Deal[];
}) {
  return (
    <div className="space-y-4">
      {/* Recent activity */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {activities.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">No recent activity.</p>
          ) : (
            activities.map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium capitalize">{a.action.replace(/_/g, " ")}</span>
                    {" · "}
                    <span className="text-slate-400">{a.entity_type}</span>
                  </p>
                </div>
                <p className="text-xs text-slate-300">{formatDate(a.created_at)}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assigned leads */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Assigned Leads ({leads.length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {leads.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">No leads assigned.</p>
          ) : (
            leads.map((l) => (
              <Link key={l.id} href={`/leads/${l.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-900">{l.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{l.source.replace(/_/g, " ")} · {l.status}</p>
                </div>
                <p className="text-xs text-slate-300">{formatDate(l.created_at)}</p>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Assigned deals */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Assigned Deals ({deals.length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {deals.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">No deals assigned.</p>
          ) : (
            deals.map((d) => (
              <Link key={d.id} href={`/pipeline`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-900">{d.title}</p>
                  <p className="text-xs text-slate-400 capitalize">{d.stage.replace(/_/g, " ")}</p>
                </div>
                <p className="text-xs text-slate-300">{formatDate(d.updated_at)}</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
