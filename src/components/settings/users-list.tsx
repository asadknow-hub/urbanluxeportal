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
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/dates";
import { toast } from "sonner";
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
  agent: User,
  accountant: UserCog,
};

export function UsersList({ users }: { users: UserRow[] }) {
  const [pending, startTransition] = useTransition();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        toast.error(`Invite failed: ${error.message}`);
        return;
      }

      // Create profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        email: inviteEmail,
        full_name: inviteName,
        role: inviteRole,
        is_active: true,
      }, { onConflict: "email" });

      if (profileError) {
        toast.error(`Profile creation failed: ${profileError.message}`);
        return;
      }

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("agent");
    });
  }

  async function toggleActive(user: UserRow) {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !user.is_active })
        .eq("id", user.id);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`${user.full_name} ${!user.is_active ? "activated" : "deactivated"}`);
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
                Invite User
              </Button>
            )}
          />
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
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
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                        <span className="capitalize text-slate-600">{u.role}</span>
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
