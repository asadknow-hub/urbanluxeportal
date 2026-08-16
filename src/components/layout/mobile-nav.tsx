"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, NAV_ITEMS, isNavActive } from "@/lib/nav";
import type { UserRole } from "@/lib/permissions";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BrandMark } from "@/components/layout/brand-mark";
import { NAV_ICON_MAP } from "@/components/layout/nav-icons";

export function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const groups = [...NAV_GROUPS];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </SheetTrigger>
      <SheetContent side="left" className="flex h-full w-[300px] flex-col border-0 bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="h-16 shrink-0 justify-center border-b border-sidebar-border px-4">
          <SheetTitle className="text-left">
            <BrandMark />
          </SheetTitle>
        </SheetHeader>
        <nav className="scrollbar-gold flex-1 overflow-y-auto p-3">
          {groups.map((group) => (
            <div key={group} className="mb-5">
              <p className="mb-1.5 px-3 text-[10px] font-medium tracking-[0.16em] text-sidebar-foreground/40">
                {group}
              </p>
              <div className="space-y-0.5">
                {items
                  .filter((i) => i.group === group)
                  .map((item) => {
                    const Icon = NAV_ICON_MAP[item.icon] ?? LayoutDashboard;
                    const active = isNavActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                          active
                            ? "bg-sidebar-primary/15 text-sidebar-primary"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent"
                        )}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
