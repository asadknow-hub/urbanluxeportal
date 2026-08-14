"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/permissions";
import type { UserRole } from "@/lib/permissions";
import { ICON_MAP } from "./sidebar";
import { LayoutDashboard, Building2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

export function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const groups = [...new Set(items.map((i) => i.group))];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 lg:hidden transition-colors mr-2">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle mobile menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0 border-r-0 flex flex-col h-full bg-white/95 backdrop-blur-xl">
        <SheetHeader className="h-20 flex flex-row items-center justify-start border-b border-slate-100/80 px-6 shrink-0 mt-0">
          <SheetTitle className="flex items-center gap-2.5 mt-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">UrbanLuxe</span>
          </SheetTitle>
        </SheetHeader>
        
        <nav className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          {groups.map((group) => (
            <div key={group} className="mb-6">
              <p className="mb-2.5 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {group}
              </p>
              <div className="space-y-1">
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
                        onClick={() => setOpen(false)}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-emerald-50 text-emerald-700 font-bold"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <Icon className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-transform duration-200",
                          isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600",
                          !isActive && "group-hover:scale-110"
                        )} />
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
