"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, NAV_ITEMS, isNavActive } from "@/lib/nav";
import type { UserRole } from "@/lib/permissions";
import type { SessionUser } from "@/lib/auth";
import { BrandMark } from "@/components/layout/brand-mark";
import { NAV_ICON_MAP } from "@/components/layout/nav-icons";

const COLLAPSE_KEY = "ul-sidebar-collapsed";

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_KEY);
    if (stored === "1") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role as UserRole));
  const groups = [...NAV_GROUPS];

  return (
    <aside
      className={cn(
        "sticky top-0 z-40 hidden h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex",
        collapsed ? "w-[72px]" : "w-56"
      )}
    >
      <div className="flex h-12 items-center border-b border-sidebar-border px-3">
        <BrandMark compact={collapsed} />
      </div>

      <nav className="scrollbar-gold flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) => (
          <div key={group} className="mb-3">
            {!collapsed && (
              <p className="mb-1 px-2.5 text-[10px] font-medium tracking-[0.16em] text-sidebar-foreground/40">
                {group}
              </p>
            )}
            <div className="space-y-px">
              {items
                .filter((i) => i.group === group)
                .map((item) => {
                  const Icon = NAV_ICON_MAP[item.icon] ?? LayoutDashboard;
                  const active = isNavActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-200",
                        active
                          ? "bg-sidebar-primary/15 text-sidebar-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-2 py-2">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-sidebar-foreground/60 transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            collapsed && "justify-center px-0"
          )}
        >
          <ChevronLeft className={cn("h-4 w-4 shrink-0 transition-transform duration-200", collapsed && "rotate-180")} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
