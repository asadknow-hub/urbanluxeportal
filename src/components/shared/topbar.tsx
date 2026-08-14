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
    <header className="fixed top-4 left-4 right-4 lg:left-auto lg:right-8 z-50 flex items-center justify-between lg:justify-end pointer-events-none">
      {/* Mobile Nav Toggle (Floating on left) */}
      <div className="flex items-center lg:hidden pointer-events-auto rounded-full bg-white/80 backdrop-blur-xl shadow-sm border border-slate-200/60 p-1">
        <MobileNav role={user.role} />
      </div>
    </header>
  );
}
