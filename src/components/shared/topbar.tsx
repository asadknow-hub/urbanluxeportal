"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { MobileNav } from "@/components/shared/mobile-nav";
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
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/60 bg-white/80 backdrop-blur-xl px-4 lg:px-8 shadow-[0_4px_24px_rgba(0,0,0,0.01)] transition-all">
      <div className="flex items-center gap-2">
        <MobileNav role={user.role} />
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-slate-100/50 px-4 py-2 shadow-inner border border-slate-200/50">
          <div className="flex items-center gap-2 text-sm">
            {crumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                <span
                  className={
                    i === crumbs.length - 1
                      ? "font-bold text-slate-800 tracking-wide capitalize"
                      : "font-semibold text-slate-500 hover:text-slate-700 transition-colors tracking-wide capitalize cursor-default"
                  }
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <NotificationBell />

        <div className="h-8 w-[1px] bg-slate-200/60" />

        <DropdownMenu>
          <DropdownMenuTrigger className="group flex items-center gap-3 rounded-full border border-slate-200/60 bg-white p-1.5 pr-4 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
            <Avatar className="h-9 w-9 border-2 border-white shadow-sm transition-transform group-hover:scale-105">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800 text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-bold text-slate-700 group-hover:text-emerald-700 transition-colors leading-none mb-1">{user.full_name}</p>
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 capitalize">{user.role}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200/60 p-2 shadow-xl">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1.5 text-[10px] text-slate-400 font-bold tracking-wider uppercase">Signed in as</DropdownMenuLabel>
              <div className="px-2 pb-2 text-sm font-bold text-slate-700 truncate">{user.email}</div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem onClick={handleSignOut} className="rounded-lg text-rose-600 font-medium focus:bg-rose-50 focus:text-rose-700 cursor-pointer mt-1">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
