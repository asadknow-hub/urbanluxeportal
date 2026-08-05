"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/dates";
import { inviteStaff, toggleStaffActive } from "@/server/team";
import { toast } from "sonner";
import {
  Search,
  UserPlus,
  Loader2,
  Shield,
  User,
  UserCog,
  Phone,
  Mail,
  ChevronRight,
} from "lucide-react";

export type StaffRow = {
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

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  admin: Shield,
  manager: UserCog,
  agent: User,
  accountant: UserCog,
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-50 text-red-700 border-red-200",
  manager: "bg-blue-50 text-blue-700 border-blue-200",
  agent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  accountant: "bg-purple-50 text-purple-700 border-purple-200",
};

export function TeamList({
  staff,
  leadMap,
  dealMap,
  currentFilters,
  currentUserRole,
}: {
  staff: StaffRow[];
  leadMap: Record<string, number>;
  dealMap: Record<string, { total: number; won: number }>;
  currentFilters: { q?: string; role?: string };
  currentUserRole: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentFilters.q ?? "");

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");
  const [invitePhone, setInvitePhone] = useState("");
  const [pending, startTransition] = useTransition();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/team?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("q", searchValue);
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await inviteStaff(inviteEmail, inviteName, inviteRole, invitePhone);
      if (result.ok) {
        toast.success(`Invitation sent to ${inviteEmail}`);
        setInviteOpen(false);
        setInviteEmail("");
        setInviteName("");
        setInviteRole("agent");
        setInvitePhone("");
      } else {
        toast.error(result.error ?? "Failed to invite");
      }
    });
  }

  function handleToggleActive(s: StaffRow) {
    startTransition(async () => {
      const result = await toggleStaffActive(s.id, s.is_active);
      if (result.ok) {
        toast.success(`${s.full_name} ${!s.is_active ? "activated" : "deactivated"}`);
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  const activeCount = staff.filter((s) => s.is_active).length;
  const agentCount = staff.filter((s) => s.role === "agent").length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-2xl font-bold text-slate-900">{staff.length}</p>
          <p className="text-xs text-slate-400">Total Members</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          <p className="text-xs text-slate-400">Active</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-2xl font-bold text-blue-600">{agentCount}</p>
          <p className="text-xs text-slate-400">Agents</p>
        </div>
      </div>

      {/* Filters + Invite */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search name, email..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-56 pl-9"
            />
          </form>

          <Select
            value={currentFilters.role ?? "all"}
            onValueChange={(v) => updateFilter("role", v ?? "all")}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="accountant">Accountant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger
            render={(props) => (
              <Button {...props} className="bg-emerald-500 hover:bg-emerald-600">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            )}
          />
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inv_name">Full Name *</Label>
                  <Input
                    id="inv_name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    required
                    placeholder="Ahmed Al Mansoori"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv_email">Email *</Label>
                  <Input
                    id="inv_email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    placeholder="ahmed@urbanluxe.ae"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inv_phone">Phone</Label>
                  <Input
                    id="inv_phone"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v ?? "agent")}>
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
                </div>
              </div>
              <p className="text-xs text-slate-400">
                An invitation email will be sent with a link to set their password.
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending || !inviteEmail || !inviteName}>
                  {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Invite
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {staff.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-white p-12 text-center shadow-sm border border-slate-200">
            <User className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-400">No team members found.</p>
          </div>
        ) : (
          staff.map((s) => {
            const RoleIcon = ROLE_ICONS[s.role] ?? User;
            const leads = leadMap[s.id] ?? 0;
            const deals = dealMap[s.id] ?? { total: 0, won: 0 };
            const initials = s.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={s.id}
                className="group rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <Link href={`/team/${s.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={s.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{s.full_name}</p>
                      <p className="text-xs text-slate-400 truncate">{s.email}</p>
                    </div>
                  </Link>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${ROLE_COLORS[s.role] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                    <RoleIcon className="mr-1 inline h-3 w-3" />
                    {s.role}
                  </span>
                </div>

                <div className="mt-3 space-y-1">
                  {s.phone && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone className="h-3 w-3" /> {s.phone}
                    </p>
                  )}
                  {s.brn && (
                    <p className="text-xs text-slate-500">BRN: {s.brn}</p>
                  )}
                  {s.commission_rate != null && (
                    <p className="text-xs text-slate-500">Commission: {s.commission_rate}%</p>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                  <span>{leads} leads</span>
                  <span>{deals.total} deals</span>
                  {deals.won > 0 && <span className="text-emerald-600">{deals.won} won</span>}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}>
                    {s.is_active ? "Active" : "Inactive"}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleActive(s)}
                      disabled={pending || (currentUserRole === "manager" && s.role === "admin")}
                      className="text-xs"
                    >
                      {s.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Link href={`/team/${s.id}`}>
                      <Button size="sm" variant="ghost" className="text-xs">
                        Manage
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
