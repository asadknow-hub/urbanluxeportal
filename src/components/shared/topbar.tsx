"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { NotificationBell } from "@/components/shared/notification-bell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";

function getBreadcrumb(pathname: string): string[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments.length === 0 ? ["Dashboard"] : segments;
}

export function Topbar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const crumbs = getBreadcrumb(pathname);

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
            <span
              className={
                i === crumbs.length - 1
                  ? "font-medium text-slate-900 capitalize"
                  : "capitalize"
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-1 hover:bg-slate-100">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-medium text-slate-900">{user.full_name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
