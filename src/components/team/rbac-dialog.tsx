"use client";

import Link from "next/link";
import { ShieldCheck, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CAPABILITY_META,
  PERMISSION_MATRIX,
  USER_ROLES,
  type UserRole,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";

function roleLabel(role: UserRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function RbacDialog({ canManageUsers }: { canManageUsers: boolean }) {
  return (
    <Dialog>
      <DialogTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="outline"
            size="sm"
            className="h-10 gap-1.5 rounded-[11px] border-[#e9e5dc] bg-card px-4 text-[13px] font-semibold"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            RBAC
          </Button>
        )}
      />
      <DialogContent className="max-h-[90vh] max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="border-b border-border bg-secondary px-5 py-4 text-secondary-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </span>
              Role-based access
            </DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-sm text-secondary-foreground/70">
            Capabilities granted by role across the CRM. Assign roles when creating staff from the Staff page.
          </p>
        </div>

        <div className="overflow-x-auto bg-card p-4">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Capability
                </th>
                {USER_ROLES.map((role) => (
                  <th
                    key={role}
                    className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {roleLabel(role)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAPABILITY_META.map((cap) => (
                <tr key={cap.key} className="border-b border-border/70 last:border-0">
                  <td className="px-3 py-3 align-top">
                    <p className="font-medium text-foreground">{cap.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{cap.description}</p>
                  </td>
                  {USER_ROLES.map((role) => {
                    const allowed = PERMISSION_MATRIX[role][cap.key];
                    return (
                      <td key={role} className="px-2 py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-full",
                            allowed ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground/50"
                          )}
                          title={allowed ? "Allowed" : "Denied"}
                        >
                          {allowed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {canManageUsers ? (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-3">
            <p className="text-xs text-muted-foreground">Change a person&apos;s role from their profile or Users.</p>
            <Link
              href="/settings/users"
              className="inline-flex h-9 items-center rounded-[11px] bg-secondary px-4 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
            >
              Manage users
            </Link>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
