"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/permissions";
import type { UserRole } from "@/lib/permissions";
import type { SessionUser } from "@/lib/auth";
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
import {
  LayoutDashboard,
  Users,
  Contact,
  KanbanSquare,
  Building2,
  FileText,
  ReceiptText,
  CreditCard,
  FolderOpen,
  CheckCircle2,
  BarChart3,
  Settings,
  ChevronLeft,
  UserCog,
  CalendarClock,
  Megaphone,
  Settings2,
} from "lucide-react";
import { useState } from "react";

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Contact,
  KanbanSquare,
  Building2,
  FileText,
  ReceiptText,
  CreditCard,
  FolderOpen,
  CheckCircle2,
  BarChart3,
  Settings,
  UserCog,
  CalendarClock,
  Megaphone,
  Settings2,
};

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const role = user.role;
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role as UserRole));
  const groups = [...new Set(items.map((i) => i.group))];

  return (
    <aside
      className={cn(
        "sticky top-0 z-40 h-screen shrink-0 hidden lg:flex flex-col border-r border-slate-200/60 bg-white/95 backdrop-blur-xl transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.01)]",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-100/80 px-4 relative">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm">
                <Building2 className="h-4 w-4" />
             </div>
             <span className="text-lg font-bold tracking-tight text-slate-900 truncate">UrbanLuxe</span>
          </div>
        ) : (
          <div className="flex w-full items-center justify-center">
             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm">
                <Building2 className="h-4 w-4" />
             </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute -right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm hover:text-slate-600 hover:border-slate-300 transition-all hover:scale-110",
            collapsed && "rotate-180"
          )}
        >
          <ChevronLeft className="h-3 w-3" />
        </button>
      </div>

      <nav className="flex flex-col gap-1 overflow-y-auto p-3 pt-5 scrollbar-hide">
        {groups.map((group) => (
          <div key={group} className="mb-5">
            {!collapsed && (
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {group}
              </p>
            )}
            <div className="space-y-0.5">
              {items
                .filter((i) => i.group === group)
                .map((item) => {
                  const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
                  const isActive =
                    item.href === "/leads"
                      ? pathname === "/leads"
                      : item.href === "/leads/inflow"
                        ? pathname === "/leads/inflow"
                        : item.href === "/deals"
                          ? pathname === "/deals" || pathname === "/pipeline"
                          : item.href === "/pipeline"
                            ? pathname === "/pipeline" || pathname === "/deals"
                            : pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                        collapsed && "justify-center px-0 py-3"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-transform duration-200",
                        isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600",
                        !isActive && "group-hover:scale-110"
                      )} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-100/80 p-3 pb-4">
        <div className="flex items-center justify-between gap-2 px-1">
          <DropdownMenu>
            <DropdownMenuTrigger className="group flex flex-1 items-center gap-3 rounded-full bg-transparent p-1 transition-all hover:bg-slate-100/50 focus:outline-none text-left">
              <Avatar className="h-9 w-9 border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800 text-xs font-bold">
                  {user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 group-hover:text-emerald-700 transition-colors leading-none mb-1 truncate">{user.full_name}</p>
                  <p className="text-[11px] font-semibold tracking-wide text-slate-400 capitalize truncate">{user.role}</p>
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-xl border-slate-200/60 p-2 shadow-xl mb-2 ml-2">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-1.5 text-[10px] text-slate-400 font-bold tracking-wider uppercase">Signed in as</DropdownMenuLabel>
                <div className="px-2 pb-2 text-sm font-bold text-slate-700 truncate">{user.email}</div>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem 
                onClick={async () => {
                  const supabase = createSupabaseBrowserClient();
                  await supabase.auth.signOut();
                  router.push("/login");
                  router.refresh();
                }} 
                className="rounded-lg text-rose-600 font-medium focus:bg-rose-50 focus:text-rose-700 cursor-pointer mt-1"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {!collapsed && (
            <div className="shrink-0 flex items-center justify-center">
              <NotificationBell />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
