"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NotificationBell } from "@/components/shared/notification-bell";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TopbarSearch } from "@/components/layout/topbar-search";
import { Suspense } from "react";
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
import { breadcrumbsFor } from "@/lib/nav";
import type { SessionUser } from "@/lib/auth";
import type { UserRole } from "@/lib/permissions";

export function Topbar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const crumbs = breadcrumbsFor(pathname);
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
    <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md lg:px-5">
      <MobileNav role={user.role as UserRole} />

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
        {crumbs.map((crumb, i) => (
          <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground/50">/</span>}
            {crumb.href && i < crumbs.length - 1 ? (
              <Link href={crumb.href} className="truncate text-muted-foreground hover:text-foreground">
                {crumb.label}
              </Link>
            ) : (
              <span className={i === crumbs.length - 1 ? "truncate font-medium text-foreground" : "truncate text-muted-foreground"}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <Suspense fallback={<div className="hidden h-8 w-52 lg:block" />}>
          <TopbarSearch />
        </Suspense>
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted focus:outline-none">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[140px] truncate text-left text-sm font-medium lg:block">{user.full_name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
              <div className="px-2 pb-2 text-sm text-muted-foreground truncate">{user.email}</div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
