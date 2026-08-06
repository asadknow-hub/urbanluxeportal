"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/permissions";
import type { UserRole } from "@/lib/permissions";
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
} from "lucide-react";
import { useState } from "react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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
};

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const groups = [...new Set(items.map((i) => i.group))];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-slate-200 bg-white transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
        {!collapsed && (
          <span className="text-lg font-bold text-slate-900">UrbanLuxe</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </div>

      <nav className="flex flex-col gap-1 overflow-y-auto p-2 pt-4">
        {groups.map((group) => (
          <div key={group} className="mb-2">
            {!collapsed && (
              <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                {group}
              </p>
            )}
            {items
              .filter((i) => i.group === group)
              .map((item) => {
                const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
