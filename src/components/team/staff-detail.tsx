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
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateStaffProfile, sendPasswordResetLink, setStaffPassword } from "@/server/team";
import { STAFF_ROLE_OPTIONS, roleLabel } from "@/lib/permissions";
import { createDocument as createDoc, deleteDocument as deleteDoc, getSignedUrl } from "@/server/documents";
import { formatDate } from "@/lib/dates";
import { dealStageLabel } from "@/lib/deal-stages";
import { canonicalDocumentPath, formatDocCategory, normalizeDocCategory } from "@/lib/document-storage";
import { defaultDocCapture, type DocCategoryChoice } from "@/lib/lead-field-options";
import { toast } from "sonner";
import {
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
  Briefcase,
  Users,
  Clock,
  CalendarDays,
  TrendingUp,
  RefreshCw,
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
  notes: string | null;
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
  reception: UserCog,
  agent: User,
  accountant: UserCog,
};

const TABS = [
  { id: "profile", label: "Profile", title: "Profile Details", icon: User },
  { id: "documents", label: "Documents", title: "Documents", icon: FileText },
  { id: "password", label: "Password & Login", title: "Password & Login", icon: KeyRound },
  { id: "portal_activity", label: "Portal Activity", title: "Portal Activity", icon: Clock },
  { id: "activity", label: "Work Activity", title: "Work Activity", icon: TrendingUp },
];

function roleChipClass(role: string) {
  switch (role) {
    case "admin":
      return "bg-[#eeeafa] text-[#5943a4]";
    case "manager":
    case "reception":
      return "bg-[#e8f0fe] text-[#1a73e8]";
    case "agent":
      return "bg-[#eef3ff] text-[#3b5bcc]";
    default:
      return "bg-[#f7e4d9] text-[#9a5a3a]";
  }
}

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
  metrics,
  docCategories = [],
}: {
  staff: Staff;
  leads: Lead[];
  deals: Deal[];
  documents: Doc[];
  activities: Activity[];
  currentUserRole: string;
  sessionStats?: SessionStats;
  metrics?: { leads: number; deals: number; documents: number };
  docCategories?: DocCategoryChoice[];
}) {
  const [activeTab, setActiveTab] = useState("profile");
  const RoleIcon = ROLE_ICONS[staff.role] ?? User;
  const initials = staff.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const leadCount = metrics?.leads ?? leads.length;
  const dealCount = metrics?.deals ?? deals.filter((d) => d.stage !== "closed" && d.stage !== "won" && d.stage !== "lost").length;
  const docCount = metrics?.documents ?? documents.length;

  const activeMeta = TABS.find((t) => t.id === activeTab) ?? TABS[0];
  const firstTabActive = activeTab === TABS[0].id;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
      <section className="flex items-center gap-6 rounded-[14px] border border-border bg-card px-6 py-6 xl:col-span-2">
        <Avatar className="h-20 w-20 border border-border">
          <AvatarImage src={staff.avatar_url ?? undefined} />
          <AvatarFallback className="bg-foreground font-heading text-[26px] font-semibold text-background">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1
            className="font-heading text-[22px] font-normal tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            {staff.full_name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {staff.email}
            </span>
            {staff.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {staff.phone}
              </span>
            )}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-[7px] px-2 py-0.5 text-[11px] font-semibold capitalize",
                roleChipClass(staff.role)
              )}
            >
              <RoleIcon className="h-3 w-3" />
              {roleLabel(staff.role)}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-[11px] font-medium",
                staff.is_active ? "text-muted-foreground" : "text-destructive"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  staff.is_active ? "bg-primary" : "bg-destructive"
                )}
              />
              {staff.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </section>

      <div className="flex min-w-0 flex-col lg:flex-row lg:items-stretch">
        <nav
          aria-label="Staff sections"
          className="relative z-10 flex w-full shrink-0 flex-row gap-1 overflow-x-auto pb-2 lg:w-[13.75rem] lg:flex-col lg:gap-3 lg:overflow-visible lg:pb-0"
        >
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            const isFirst = index === 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative inline-flex cursor-pointer items-center gap-3 whitespace-nowrap px-4 text-left text-sm font-medium transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  active
                    ? cn(
                        "z-20 bg-card text-foreground",
                        "rounded-xl border border-border",
                        "lg:-mr-px lg:rounded-r-none lg:border-r-0",
                        isFirst ? "h-[52px] lg:rounded-tl-[14px] lg:rounded-bl-xl" : "h-11 lg:rounded-l-xl"
                      )
                    : "h-11 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground lg:mr-3"
                )}
              >
                {active ? (
                  <>
                    {isFirst ? (
                      <span className="absolute inset-x-0 top-0 hidden h-0.5 bg-primary lg:block" />
                    ) : (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute top-[-11px] right-[-1px] hidden h-[11px] w-[11px] rounded-br-[11px] shadow-[4px_4px_0_0_var(--card)] lg:block"
                      />
                    )}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute right-[-1px] bottom-[-11px] hidden h-[11px] w-[11px] rounded-tr-[11px] shadow-[4px_-4px_0_0_var(--card)] lg:block"
                    />
                  </>
                ) : null}
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div
          className={cn(
            "relative min-w-0 flex-1 overflow-hidden rounded-[14px] border border-border bg-card",
            firstTabActive && "lg:rounded-tl-none"
          )}
        >
          <div className="h-0.5 bg-primary" />
          <div className="flex h-[50px] items-center border-b border-border px-6">
            <h2 className="text-base font-semibold tracking-tight text-foreground">{activeMeta.title}</h2>
          </div>
          <div className="p-6">
            {activeTab === "profile" && (
              <ProfileTab staff={staff} currentUserRole={currentUserRole} />
            )}
            {activeTab === "documents" && (
              <DocumentsTab staff={staff} documents={documents} categories={docCategories} />
            )}
            {activeTab === "password" && (
              <PasswordTab staff={staff} />
            )}
            {activeTab === "portal_activity" && (
              sessionStats ? <PortalActivityTab stats={sessionStats} /> : (
                <p className="text-sm text-muted-foreground">No portal activity recorded yet.</p>
              )
            )}
            {activeTab === "activity" && (
              <ActivityTab activities={activities} leads={leads} deals={deals} />
            )}
          </div>
        </div>
      </div>

      <aside className="h-fit rounded-[14px] border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">Quick Metrics</h2>
        <div className="mt-2">
          {[
            { icon: Users, value: leadCount, label: "Assigned Leads" },
            { icon: Briefcase, value: dealCount, label: "Active Deals" },
            { icon: FileText, value: docCount, label: "Documents" },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-lg font-bold leading-none text-foreground">{metric.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{metric.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
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
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <p className="text-2xl font-bold text-foreground">{stats.daysLoggedInThisMonth}</p>
          </div>
          <p className="text-xs text-muted-foreground">Days Logged In</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-destructive" />
            <p className="text-2xl font-bold text-foreground">{stats.daysNotLoggedIn}</p>
          </div>
          <p className="text-xs text-muted-foreground">Days Not Logged In</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-2xl font-bold text-foreground">{formatDuration(stats.totalActiveSecondsThisMonth)}</p>
          </div>
          <p className="text-xs text-muted-foreground">Total Active Time</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-2xl font-bold text-foreground">{formatDuration(stats.avgDailyActiveSeconds)}</p>
          </div>
          <p className="text-xs text-muted-foreground">Avg Daily Active</p>
        </div>
      </div>

      {/* Daily activity bar chart */}
      <div className="rounded-[14px] border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Daily Active Time — {monthName}</h3>
        <p className="text-xs text-muted-foreground mb-4">Time spent in portal per day</p>
        {stats.dailyBreakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No activity recorded this month.</p>
        ) : (
          <div className="flex items-end gap-1 h-32 overflow-x-auto">
            {stats.dailyBreakdown.map((d) => {
              const heightPct = (d.active_seconds / maxActive) * 100;
              const dayLabel = new Date(d.date).getDate();
              return (
                <div key={d.date} className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: 28 }}>
                  <div className="flex-1 flex items-end w-full">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-primary to-primary/70 transition-all duration-200 hover:from-primary hover:to-primary/80"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                      title={`${formatDate(d.date)}: ${formatDuration(d.active_seconds)}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{dayLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session log table */}
      <div className="overflow-hidden rounded-[14px] border border-border">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Session Log (Recent 30)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Login Time</th>
                <th className="px-4 py-3">Logout Time</th>
                <th className="px-4 py-3 text-right">Active Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.sessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No sessions recorded.</td>
                </tr>
              ) : (
                stats.sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(s.session_date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(s.login_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.logout_at
                        ? new Date(s.logout_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                        : <span className="text-primary">Active now</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
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
        <p className="text-xs text-muted-foreground text-center">
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
        role: form.role as "admin" | "manager" | "reception" | "agent" | "accountant",
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

  const fieldClass =
    "h-10 rounded-[10px] border-border bg-muted/40 px-3.5 text-[13px] shadow-none focus-visible:ring-ring/30";

  return (
    <form onSubmit={handleSave}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p_name" className="text-xs font-semibold text-foreground">Full Name *</Label>
          <Input id="p_name" className={fieldClass} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p_email" className="text-xs font-semibold text-foreground">Email *</Label>
          <Input id="p_email" type="email" className={fieldClass} value={form.email} onChange={(e) => set("email", e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p_phone" className="text-xs font-semibold text-foreground">Phone</Label>
          <Input id="p_phone" className={fieldClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+971 50 123 4567" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p_brn" className="text-xs font-semibold text-foreground">BRN (Broker Registration No.)</Label>
          <Input id="p_brn" className={fieldClass} value={form.brn} onChange={(e) => set("brn", e.target.value)} placeholder="BRN-12345" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">Role</Label>
          <Select
            value={form.role}
            onValueChange={(v) => set("role", v ?? "agent")}
            disabled={!canEditRole}
          >
            <SelectTrigger className={fieldClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAFF_ROLE_OPTIONS.map((row) => (
                <SelectItem key={row.value} value={row.value}>
                  {row.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!canEditRole && (
            <p className="text-xs text-muted-foreground">Only admins can change roles.</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p_commission" className="text-xs font-semibold text-foreground">Commission Rate (%)</Label>
          <Input
            id="p_commission"
            type="number"
            step="0.1"
            min="0"
            max="100"
            className={fieldClass}
            value={form.commission_rate}
            onChange={(e) => set("commission_rate", e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[13px] font-medium text-foreground">Account Active</span>
        <button
          type="button"
          role="switch"
          aria-checked={form.is_active}
          onClick={() => set("is_active", !form.is_active)}
          className={cn(
            "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200",
            form.is_active ? "bg-primary" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-sm transition-[left] duration-200",
              form.is_active ? "left-[22px]" : "left-0.5"
            )}
          />
        </button>
      </div>

      <div className="mt-5 flex justify-end">
        <Button type="submit" disabled={pending} className="h-10 cursor-pointer px-5 font-semibold">
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}

// ============================================================
// DOCUMENTS TAB
// ============================================================
function DocumentsTab({
  staff,
  documents,
  categories,
}: {
  staff: Staff;
  documents: Doc[];
  categories: DocCategoryChoice[];
}) {
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState("");
  const [docExpiry, setDocExpiry] = useState("");
  const [docNotes, setDocNotes] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ path: string; name: string; mime: string; size: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const categoryItems: DocCategoryChoice[] =
    categories.length > 0
      ? categories
      : ["emirates_id", "passport", "visa", "contract", "permit", "brn", "other"].map((value) => ({
          value,
          label: formatDocCategory(value),
          capture: defaultDocCapture(value),
        }));

  const capture = docCategory
    ? categoryItems.find((c) => c.value === docCategory)?.capture ?? defaultDocCapture(docCategory)
    : null;

  async function handleFileUpload(file: File | null) {
    if (!file) return;
    setUploading(true);

    const supabase = createSupabaseBrowserClient();
    const path = canonicalDocumentPath({
      entityType: "staff",
      entityId: staff.id,
      category: docCategory || "other",
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
    if (!docCategory) {
      toast.error("Choose a document category");
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
        expiry_date: capture === "expiry" ? docExpiry || null : null,
        notes: capture === "note" ? docNotes.trim() || null : null,
      });
      if (result.ok) {
        toast.success("Document saved");
        setUploadedFile(null);
        setDocName("");
        setDocCategory("");
        setDocExpiry("");
        setDocNotes("");
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
      <div className="rounded-[14px] border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Upload Staff Document</h3>
        <form onSubmit={handleSaveDoc} className="space-y-3">
          <div className="rounded-xl border-2 border-dashed border-border p-4 text-center">
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
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/80"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Click to upload"}
            </label>
            <p className="mt-2 text-xs text-muted-foreground">Emirates ID, Passport, Visa, BRN, Contract · PDF, JPG, PNG</p>
          </div>

          {uploadedFile && (
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <FileCheck2 className="h-5 w-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(uploadedFile.size)}</p>
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
              <Select
                value={docCategory || undefined}
                onValueChange={(v) => {
                  setDocCategory(v ?? "");
                  setDocExpiry("");
                  setDocNotes("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {categoryItems.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              {capture === "note" ? (
                <>
                  <Label className="text-xs">Note</Label>
                  <Input value={docNotes} onChange={(e) => setDocNotes(e.target.value)} placeholder="Optional note" />
                </>
              ) : (
                <>
                  <Label className="text-xs">Expiry</Label>
                  <Input
                    type="date"
                    value={docExpiry}
                    onChange={(e) => setDocExpiry(e.target.value)}
                    disabled={capture !== "expiry"}
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={pending || !uploadedFile || !docCategory}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Document
            </Button>
          </div>
        </form>
      </div>

      {/* Documents list */}
      <div className="overflow-hidden rounded-[14px] border border-border">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Staff Documents ({documents.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {documents.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            documents.map((doc) => {
              const mode = categoryItems.find((c) => c.value === doc.category)?.capture ?? defaultDocCapture(doc.category);
              const extra =
                mode === "expiry"
                  ? doc.expiry_date
                    ? `Expires: ${formatDate(doc.expiry_date)}`
                    : null
                  : doc.notes?.trim() || null;
              return (
                <div key={doc.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatDocCategory(doc.category)} · {formatBytes(doc.size_bytes)} · {formatDate(doc.created_at)}
                      {extra ? ` · ${extra}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="sm" variant="ghost" onClick={() => handleView(doc.storage_path)} disabled={pending}>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(doc.id)} disabled={pending}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })
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
      <div className="rounded-[14px] border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground">Set Password Directly</h3>
        <p className="mt-1 text-xs text-muted-foreground">
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
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-xs text-muted-foreground hover:text-foreground"
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
      <div className="rounded-[14px] border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground">Send Password Reset Link</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Generate a secure recovery link that you can share with the user. They'll set their own password.
        </p>
        <div className="mt-4">
          <Button onClick={handleSendReset} disabled={pending} variant="outline">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Generate Reset Link
          </Button>
        </div>

        {resetLink && (
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Recovery Link (share with user):</p>
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
      <div className="overflow-hidden rounded-[14px] border border-border">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
        </div>
        <div className="divide-y divide-border">
          {activities.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            activities.map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium capitalize">{a.action.replace(/_/g, " ")}</span>
                    {" · "}
                    <span className="text-muted-foreground">{a.entity_type}</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assigned leads */}
      <div className="overflow-hidden rounded-[14px] border border-border">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Assigned Leads ({leads.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {leads.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No leads assigned.</p>
          ) : (
            leads.map((l) => (
              <Link key={l.id} href={`/leads/${l.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{l.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{l.source.replace(/_/g, " ")} · {l.status}</p>
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(l.created_at)}</p>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Assigned deals */}
      <div className="overflow-hidden rounded-[14px] border border-border">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Assigned Deals ({deals.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {deals.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No deals assigned.</p>
          ) : (
            deals.map((d) => (
              <Link key={d.id} href={`/pipeline/${d.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{dealStageLabel(d.stage)}</p>
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(d.updated_at)}</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
