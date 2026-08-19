"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createStaff, toggleStaffActive } from "@/server/team";
import { roleLabel, STAFF_ROLE_OPTIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/dates";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, Shield, User, UserCog } from "lucide-react";

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  brn: string | null;
  commission_rate: number | null;
  created_at: string;
};

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  admin: Shield,
  manager: UserCog,
  reception: UserCog,
  agent: User,
  accountant: UserCog,
};

export function UsersList({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");
  const [invitePassword, setInvitePassword] = useState("");

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createStaff({
        email: inviteEmail,
        fullName: inviteName,
        role: inviteRole,
        password: invitePassword,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not create staff");
        return;
      }
      toast.success(`${inviteName} can log in now`);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("agent");
      setInvitePassword("");
      router.refresh();
    });
  }

  async function toggleActive(user: UserRow) {
    startTransition(async () => {
      const result = await toggleStaffActive(user.id, user.is_active);
      if (!result.ok) toast.error(result.error ?? "Failed");
      else {
        toast.success(`${user.full_name} ${!user.is_active ? "activated" : "deactivated"}`);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger
            render={(props) => (
              <Button {...props} className="bg-emerald-500 hover:bg-emerald-600">
                <UserPlus className="mr-2 h-4 w-4" />
                Add staff
              </Button>
            )}
          />
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add staff login</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite_email">Email *</Label>
                <Input
                  id="invite_email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  placeholder="user@urbanluxe.ae"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite_name">Full Name *</Label>
                <Input
                  id="invite_name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                  placeholder="Ahmed Al Mansoori"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v ?? "agent")}>
                  <SelectTrigger>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite_password">Password *</Label>
                <Input
                  id="invite_password"
                  type="password"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending || !inviteEmail || !inviteName || invitePassword.length < 8}>
                  {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create login
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">BRN</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const RoleIcon = ROLE_ICONS[u.role] ?? User;
                return (
                  <tr key={u.id} className="group hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.full_name}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <RoleIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-slate-600">{roleLabel(u.role)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.brn ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {u.commission_rate != null ? `${u.commission_rate}%` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleActive(u)}
                        disabled={pending}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
