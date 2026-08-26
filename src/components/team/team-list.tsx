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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/primitives/empty-state";
import { RbacDialog } from "@/components/team/rbac-dialog";
import { createStaff, toggleStaffActive } from "@/server/team";
import { isManagerLike, roleLabel, STAFF_ROLE_OPTIONS } from "@/lib/permissions";
import { toast } from "sonner";
import {
  Search,
  UserPlus,
  Loader2,
  Shield,
  User,
  UserCog,
  Phone,
  ChevronRight,
  MoreHorizontal,
  Power,
  ExternalLink,
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
  team_id?: string | null;
  deskName?: string | null;
};

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  admin: Shield,
  manager: UserCog,
  reception: UserCog,
  agent: User,
  accountant: UserCog,
};

const AVATAR_TONES = [
  "bg-[#f4ecdc] text-[#8a6d2c]",
  "bg-[#e2efee] text-[#2a6f6a]",
  "bg-[#eae5f7] text-[#4f3d8a]",
  "bg-[#f7e4d9] text-[#9a5a3a]",
  "bg-[#f5e9c9] text-[#8a7020]",
];

function roleChipClass(role: string) {
  switch (role) {
    case "admin":
      return "bg-[#eeeafa] text-[#5943a4]";
    case "manager":
    case "reception":
      return "bg-[#f5eddd] text-[#8a6d2c]";
    case "accountant":
      return "bg-[#fff0dc] text-[#b26a15]";
    default:
      return "bg-[#eaf2f9] text-[#21649a]";
  }
}

function conversionPct(won: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((won / total) * 1000) / 10;
}

export function TeamList({
  staff,
  desks = [],
  leadMap,
  dealMap,
  currentFilters,
  currentUserRole,
}: {
  staff: StaffRow[];
  desks?: { id: string; name: string }[];
  leadMap: Record<string, number>;
  dealMap: Record<string, { total: number; won: number }>;
  currentFilters: { q?: string; role?: string };
  currentUserRole: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentFilters.q ?? "");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");
  const [invitePhone, setInvitePhone] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [invitePasswordConfirm, setInvitePasswordConfirm] = useState("");
  const [inviteTeam, setInviteTeam] = useState("none");
  const [pending, startTransition] = useTransition();
  const canManageUsers = currentUserRole === "admin";
  const creatableRoles =
    currentUserRole === "admin"
      ? STAFF_ROLE_OPTIONS
      : STAFF_ROLE_OPTIONS.filter((row) => row.value === "agent" || row.value === "accountant");

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
    if (invitePassword !== invitePasswordConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    startTransition(async () => {
      const result = await createStaff({
        email: inviteEmail,
        fullName: inviteName,
        role: inviteRole,
        phone: invitePhone,
        password: invitePassword,
        teamId: inviteTeam === "none" ? null : inviteTeam,
      });
      if (result.ok) {
        toast.success(`${inviteName} can log in now with that email and password`);
        setInviteOpen(false);
        setInviteEmail("");
        setInviteName("");
        setInviteRole("agent");
        setInvitePhone("");
        setInvitePassword("");
        setInvitePasswordConfirm("");
        setInviteTeam("none");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to create staff");
      }
    });
  }

  function handleToggleActive(s: StaffRow) {
    toast.success(`${s.full_name} ${!s.is_active ? "activated" : "deactivated"}`);
    startTransition(async () => {
      const result = await toggleStaffActive(s.id, s.is_active);
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[17px] border border-[#e9e5dc] bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={handleSearch} className="relative w-full sm:max-w-[330px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-[42px] rounded-[11px] border-[#e9e5dc] pl-10 text-[13px]"
            />
          </form>

          <Select
            value={currentFilters.role ?? "all"}
            onValueChange={(v) => updateFilter("role", v ?? "all")}
          >
            <SelectTrigger className="h-[42px] w-full rounded-[11px] border-[#e9e5dc] text-[13px] sm:w-[185px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {STAFF_ROLE_OPTIONS.map((row) => (
                <SelectItem key={row.value} value={row.value}>
                  {row.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <RbacDialog canManageUsers={canManageUsers} />

          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger
              render={(props) => (
                <Button
                  {...props}
                  className="h-[42px] gap-2 rounded-[11px] bg-[#b78a2c] px-[18px] text-[13px] font-semibold text-white hover:bg-[#a77b22]"
                >
                  <UserPlus className="h-4 w-4" />
                  Add staff
                </Button>
              )}
            />
            <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:max-w-lg">
              <div className="border-b border-border bg-secondary px-5 py-4 text-secondary-foreground">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <UserPlus className="h-4 w-4" />
                    </span>
                    Add staff
                  </DialogTitle>
                </DialogHeader>
                <p className="mt-2 text-sm text-secondary-foreground/70">
                  Create a login they can use immediately. Share the password with them in person or over WhatsApp.
                </p>
              </div>

              <form onSubmit={handleInvite} className="space-y-4 bg-card p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="inv_name" className="text-xs text-muted-foreground">
                      Full name
                    </Label>
                    <Input
                      id="inv_name"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      required
                      placeholder="Ahmed Al Mansoori"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inv_email" className="text-xs text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      id="inv_email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      placeholder="ahmed@urbanluxe.ae"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inv_phone" className="text-xs text-muted-foreground">
                      Phone
                    </Label>
                    <Input
                      id="inv_phone"
                      value={invitePhone}
                      onChange={(e) => setInvitePhone(e.target.value)}
                      placeholder="+971 50 123 4567"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v ?? "agent")}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {creatableRoles.map((row) => (
                          <SelectItem key={row.value} value={row.value}>
                            {row.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Desk</Label>
                    <Select value={inviteTeam} onValueChange={(v) => setInviteTeam(v ?? "none")}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="No desk" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No desk — house pool</SelectItem>
                        {desks.map((desk) => (
                          <SelectItem key={desk.id} value={desk.id}>
                            {desk.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="inv_password" className="text-xs text-muted-foreground">
                      Password
                    </Label>
                    <Input
                      id="inv_password"
                      type="password"
                      value={invitePassword}
                      onChange={(e) => setInvitePassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inv_password2" className="text-xs text-muted-foreground">
                      Confirm password
                    </Label>
                    <Input
                      id="inv_password2"
                      type="password"
                      value={invitePasswordConfirm}
                      onChange={(e) => setInvitePasswordConfirm(e.target.value)}
                      required
                      minLength={8}
                      className="h-9"
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  They sign in at the login page with this email and password. Reception has the same access as Manager.
                </p>

                <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={pending || !inviteEmail || !inviteName || invitePassword.length < 8}>
                    {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Create login
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {staff.length === 0 ? (
        <EmptyState
          title="No staff found"
          description="Try another role filter, clear search, or invite someone to the workspace."
        />
      ) : (
        <div className="rounded-[18px] border border-[#e9e5dc] bg-card p-2.5">
          <div className="mb-1 hidden h-10 grid-cols-[3.1fr_2.3fr_2fr_1.2fr] items-center px-[22px] text-[11px] font-semibold uppercase tracking-wide text-[#8d8982] lg:grid">
            <div>Staff member</div>
            <div>Role & status</div>
            <div>Performance</div>
            <div className="text-right">Actions</div>
          </div>

          <ul className="space-y-1.5">
            {staff.map((s, index) => {
              const RoleIcon = ROLE_ICONS[s.role] ?? User;
              const leads = leadMap[s.id] ?? 0;
              const deals = dealMap[s.id] ?? { total: 0, won: 0 };
              const conv = conversionPct(deals.won, deals.total);
              const initials = s.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              const avatarTone = AVATAR_TONES[index % AVATAR_TONES.length];
              const canToggle = !(isManagerLike(currentUserRole) && s.role === "admin");
              const href = `/team/${s.id}`;

              return (
                <li key={s.id}>
                  <div
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(href)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(href);
                      }
                    }}
                    className={cn(
                      "group grid min-h-[84px] cursor-pointer grid-cols-1 items-center gap-4 rounded-[13px] border border-[#eeeae3] px-4 py-4 transition-all duration-200",
                      "hover:-translate-y-px hover:border-[#ded8ca] hover:shadow-[0_5px_20px_rgba(25,25,25,0.04)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      "lg:grid-cols-[3.1fr_2.3fr_2fr_1.2fr] lg:gap-0 lg:px-3 lg:py-0 lg:pl-4"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={s.avatar_url ?? undefined} className="object-cover" />
                        <AvatarFallback className={cn("text-sm font-medium", avatarTone)}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                          {s.full_name}
                        </p>
                        <p className="mt-1 truncate text-xs text-[#88857f]">{s.email}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#99958e]">
                          {s.phone ? (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {s.phone}
                            </span>
                          ) : null}
                          {s.phone && s.brn ? <span aria-hidden>•</span> : null}
                          {s.brn ? <span>BRN {s.brn}</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1.5 text-xs font-semibold capitalize",
                          roleChipClass(s.role)
                        )}
                      >
                        <RoleIcon className="h-3.5 w-3.5" />
                        {roleLabel(s.role)}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs",
                          s.is_active ? "text-[#77746e]" : "text-destructive"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            s.is_active ? "bg-[#36a25b]" : "bg-destructive"
                          )}
                        />
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                      {s.deskName ? (
                        <span className="text-xs text-[#8d8982]">{s.deskName}</span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-5 sm:gap-7">
                      <div className="min-w-9">
                        <p className="font-[family-name:var(--font-display)] text-[17px] leading-none text-foreground">
                          {leads}
                        </p>
                        <p className="mt-1 text-[10px] text-[#96928b]">Leads</p>
                      </div>
                      <div className="min-w-9">
                        <p className="font-[family-name:var(--font-display)] text-[17px] leading-none text-foreground">
                          {deals.total}
                        </p>
                        <p className="mt-1 text-[10px] text-[#96928b]">Deals</p>
                      </div>
                      <div className="min-w-9">
                        <p className="font-[family-name:var(--font-display)] text-[17px] leading-none text-foreground">
                          {deals.won}
                        </p>
                        <p className="mt-1 text-[10px] text-[#96928b]">Won</p>
                      </div>
                      <div
                        className="relative flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#eeeae3] text-[11px] font-semibold text-foreground"
                        title="Win rate"
                      >
                        <span
                          className="pointer-events-none absolute inset-[-3px] rounded-full border-[3px] border-transparent border-t-[#429a8f]"
                          style={{ transform: `rotate(${Math.min(conv, 100) * 3.6}deg)` }}
                          aria-hidden
                        />
                        {`${conv}%`}
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-start gap-3 lg:justify-end"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={(props) => (
                            <Button
                              {...props}
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-[42px] w-11 rounded-[11px] border-[#e9e5dc]"
                              aria-label="More actions"
                            >
                              <MoreHorizontal className="h-4 w-4 text-[#666]" />
                            </Button>
                          )}
                        />
                        <DropdownMenuContent align="end" className="min-w-44">
                          <DropdownMenuItem onClick={() => router.push(href)}>
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={pending || !canToggle}
                            onClick={() => handleToggleActive(s)}
                          >
                            <Power className="h-3.5 w-3.5" />
                            {s.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Link
                        href={href}
                        prefetch
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-[42px] items-center gap-2 rounded-[11px] bg-[#17202d] px-[17px] text-xs font-semibold text-white transition-colors hover:bg-[#253142]"
                      >
                        Open
                        <ChevronRight className="h-3.5 w-3.5 opacity-80" />
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
