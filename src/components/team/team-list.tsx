"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
  admin: "bg-rose-50 text-rose-700 border-rose-200/50",
  manager: "bg-amber-50 text-amber-700 border-amber-200/50",
  agent: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
  accountant: "bg-indigo-50 text-indigo-700 border-indigo-200/50",
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

  return (
    <div className="space-y-6">
      {/* Filters + Invite */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl bg-white p-4 shadow-sm border border-slate-200/60">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search staff..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full sm:w-64 pl-10 bg-slate-50 border-slate-200/60 focus-visible:ring-emerald-500/20 rounded-2xl"
            />
          </form>

          <Select
            value={currentFilters.role ?? "all"}
            onValueChange={(v) => updateFilter("role", v ?? "all")}
          >
            <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200/60 rounded-2xl focus:ring-emerald-500/20">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200/60 shadow-xl">
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
              <Button {...props} className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-sm transition-all hover:shadow-md">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            )}
          />
          <DialogContent className="max-w-md sm:max-w-lg rounded-3xl p-0 overflow-hidden border-slate-200/60 shadow-2xl">
            <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-4 sm:p-5 text-white relative">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-500/20 blur-2xl mix-blend-overlay"></div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3 relative z-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md shadow-inner border border-white/20">
                     <UserPlus className="h-5 w-5 text-emerald-300" />
                  </div>
                  Invite Member
                </DialogTitle>
              </DialogHeader>
              <p className="text-emerald-100/80 text-sm mt-3 relative z-10 max-w-sm">
                Send an invitation email so a new staff member can set up their account and join the workspace.
              </p>
            </div>
            
            <form onSubmit={handleInvite} className="p-4 sm:p-5 space-y-6 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <Label htmlFor="inv_name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name <span className="text-rose-500">*</span></Label>
                  <Input
                    id="inv_name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    required
                    placeholder="Ahmed Al Mansoori"
                    className="bg-slate-50/50 border-slate-200/60 focus-visible:ring-emerald-500/20 rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="inv_email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address <span className="text-rose-500">*</span></Label>
                  <Input
                    id="inv_email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    placeholder="ahmed@urbanluxe.ae"
                    className="bg-slate-50/50 border-slate-200/60 focus-visible:ring-emerald-500/20 rounded-xl h-11"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <Label htmlFor="inv_phone" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</Label>
                  <Input
                    id="inv_phone"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="bg-slate-50/50 border-slate-200/60 focus-visible:ring-emerald-500/20 rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role Assignment</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v ?? "agent")}>
                    <SelectTrigger className="bg-slate-50/50 border-slate-200/60 focus:ring-emerald-500/20 rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200/60 shadow-xl">
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="pt-6 mt-8 flex items-center justify-between border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)} className="rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 h-11 px-6">
                  Cancel
                </Button>
                <Button type="submit" disabled={pending || !inviteEmail || !inviteName} className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-sm h-11 px-5">
                  {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Invitation
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {staff.length === 0 ? (
          <div className="col-span-full rounded-3xl bg-white p-12 text-center shadow-sm border border-slate-200/60">
            <User className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-500">No team members found.</p>
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
                className="group relative overflow-hidden rounded-[1.5rem] bg-white shadow-sm border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Cover Background */}
                <div className={cn(
                  "h-24 w-full",
                  s.role === "admin" ? "bg-gradient-to-br from-rose-400 to-rose-600" :
                  s.role === "manager" ? "bg-gradient-to-br from-amber-400 to-amber-600" :
                  "bg-gradient-to-br from-emerald-400 to-emerald-600"
                )} />

                <div className="px-6 pb-6 pt-0 flex-1 flex flex-col">
                  {/* Floating Avatar & Role */}
                  <div className="flex justify-between items-start -mt-10 mb-4 relative z-10">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-sm bg-white">
                      <AvatarImage src={s.avatar_url ?? undefined} className="object-cover" />
                      <AvatarFallback className="bg-slate-50 text-slate-600 text-xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className={cn(
                      "mt-12 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                      ROLE_COLORS[s.role] ?? "bg-slate-50 text-slate-600 border-slate-200"
                    )}>
                      <RoleIcon className="mr-1 inline h-3 w-3 -mt-0.5" />
                      {s.role}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{s.full_name}</h3>
                    <p className="text-sm font-medium text-slate-500 line-clamp-1">{s.email}</p>
                  </div>

                  <div className="space-y-2 mb-6">
                    {s.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 text-slate-400"><Phone className="h-3 w-3" /></div>
                        <span className="font-medium">{s.phone}</span>
                      </div>
                    )}
                    {(s.brn || s.commission_rate != null) && (
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        {s.brn && <span className="rounded bg-slate-50 px-2 py-1 border border-slate-100">BRN: {s.brn}</span>}
                        {s.commission_rate != null && <span className="rounded bg-slate-50 px-2 py-1 border border-slate-100">Comm: {s.commission_rate}%</span>}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-100/80">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                       <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100/50">
                          <p className="text-lg font-bold text-slate-700">{leads}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Leads</p>
                       </div>
                       <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100/50">
                          <p className="text-lg font-bold text-slate-700">{deals.total}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Deals</p>
                       </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "flex items-center gap-1.5 text-xs font-bold",
                        s.is_active ? "text-emerald-600" : "text-rose-500"
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", s.is_active ? "bg-emerald-500" : "bg-rose-500")} />
                        {s.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleToggleActive(s)}
                          disabled={pending || (currentUserRole === "manager" && s.role === "admin")}
                          className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
                          title={s.is_active ? "Deactivate" : "Activate"}
                        >
                          <Shield className="h-3.5 w-3.5" />
                        </Button>
                        <Link href={`/team/${s.id}`}>
                          <Button size="sm" className="h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs px-4">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </div>
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
