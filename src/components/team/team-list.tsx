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
import { FilterBar } from "@/components/primitives/filter-bar";
import { EmptyState } from "@/components/primitives/empty-state";
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
  ChevronRight,
  Power,
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

function roleChipClass(role: string) {
  switch (role) {
    case "admin":
      return "bg-secondary/10 text-secondary ring-secondary/20";
    case "manager":
      return "bg-primary/10 text-foreground ring-primary/25";
    case "accountant":
      return "bg-muted text-muted-foreground ring-border";
    default:
      return "bg-card text-foreground ring-border";
  }
}

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
    <div className="space-y-4">
      <FilterBar className="justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <form onSubmit={handleSearch} className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name or email"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </form>

          <Select
            value={currentFilters.role ?? "all"}
            onValueChange={(v) => updateFilter("role", v ?? "all")}
          >
            <SelectTrigger className="h-8 w-[140px] text-sm">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
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
              <Button {...props} size="sm" className="h-8 gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                Invite
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
                  Invite staff
                </DialogTitle>
              </DialogHeader>
              <p className="mt-2 text-sm text-secondary-foreground/70">
                Send an invite so they can set a password and join the workspace.
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
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="ghost" size="sm" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={pending || !inviteEmail || !inviteName}>
                  {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Send invitation
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </FilterBar>

      {staff.length === 0 ? (
        <EmptyState
          title="No staff found"
          description="Try another role filter, clear search, or invite someone to the workspace."
        />
      ) : (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border">
          <ul className="divide-y divide-border">
            {staff.map((s) => {
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
                <li
                  key={s.id}
                  className="group flex flex-col gap-3 px-4 py-3 transition-colors duration-200 hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border">
                      <AvatarImage src={s.avatar_url ?? undefined} className="object-cover" />
                      <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{s.full_name}</p>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium capitalize ring-1",
                            roleChipClass(s.role)
                          )}
                        >
                          <RoleIcon className="h-3 w-3" />
                          {s.role}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-medium",
                            s.is_active ? "text-foreground/70" : "text-destructive"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              s.is_active ? "bg-primary" : "bg-destructive"
                            )}
                          />
                          {s.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.email}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        {s.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {s.phone}
                          </span>
                        ) : null}
                        {s.brn ? <span>BRN {s.brn}</span> : null}
                        {s.commission_rate != null ? <span>Comm {s.commission_rate}%</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-4 sm:gap-6">
                    <div className="flex gap-4 text-center">
                      <div>
                        <p className="text-sm font-semibold tabular-nums text-foreground">{leads}</p>
                        <p className="text-[10px] text-muted-foreground">Leads</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold tabular-nums text-foreground">{deals.total}</p>
                        <p className="text-[10px] text-muted-foreground">Deals</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold tabular-nums text-foreground">{deals.won}</p>
                        <p className="text-[10px] text-muted-foreground">Won</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleActive(s)}
                        disabled={pending || (currentUserRole === "manager" && s.role === "admin")}
                        className="h-8 w-8 text-muted-foreground"
                        title={s.is_active ? "Deactivate" : "Activate"}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                      <Link
                        href={`/team/${s.id}`}
                        className={cn(
                          "inline-flex h-8 items-center gap-1 rounded-md bg-secondary px-3 text-xs font-medium text-secondary-foreground transition-colors duration-200 hover:bg-secondary/90"
                        )}
                      >
                        Open
                        <ChevronRight className="h-3.5 w-3.5 opacity-70" />
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
