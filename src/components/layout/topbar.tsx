"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
import { breadcrumbsFor, sectionHeaderFor } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import type { UserRole } from "@/lib/permissions";

function isRecordId(label: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(label);
}

export function Topbar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const section = sectionHeaderFor(pathname);
  const crumbs = breadcrumbsFor(pathname);
  const backCrumb = (() => {
    for (let i = crumbs.length - 2; i >= 0; i--) {
      if (crumbs[i].href) return crumbs[i];
    }
    return null;
  })();
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

  const utilities = (
    <div className="relative z-10 ml-auto flex shrink-0 items-center gap-2">
      <Suspense fallback={<div className="hidden h-8 w-52 lg:block" />}>
        <TopbarSearch inverted={!!section} />
      </Suspense>
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center gap-2 rounded-lg p-1 focus:outline-none",
            section ? "hover:bg-white/10" : "hover:bg-muted"
          )}
        >
          <Avatar className="h-8 w-8 ring-2 ring-white/20">
            <AvatarImage src={user.avatar_url ?? undefined} />
            <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "hidden max-w-[140px] truncate text-left text-sm font-medium lg:block",
              section ? "text-white/90" : "text-foreground"
            )}
          >
            {user.full_name}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
            <div className="truncate px-2 pb-2 text-sm text-muted-foreground">{user.email}</div>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center gap-3 border-b shadow-sm",
        section
          ? cn("h-14 border-white/10 bg-gradient-to-r px-4 lg:px-5", section.gradient)
          : "h-12 border-border bg-background/90 px-4 backdrop-blur-md lg:px-5"
      )}
    >
      <MobileNav role={user.role as UserRole} inverted={!!section} />

      {/* Back button — always visible on the left */}
      {backCrumb?.href ? (
        <Link
          href={backCrumb.href}
          prefetch
          className={cn(
            "relative z-10 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
            section
              ? "border border-white/20 bg-white/10 text-white hover:bg-white/20"
              : "border border-border bg-muted/50 text-foreground hover:bg-muted"
          )}
          aria-label={`Back to ${backCrumb.label}`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{backCrumb.label}</span>
        </Link>
      ) : null}

      {/* Centered title for section/gradient headers */}
      {section ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-28">
          <h1
            className="truncate text-center font-heading text-lg font-semibold uppercase tracking-[0.22em] text-white drop-shadow-sm lg:text-xl"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            {section.title}
          </h1>
        </div>
      ) : (
        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
          <span className="hidden min-w-0 items-center gap-1.5 md:flex">
            {crumbs.map((crumb, i) => (
              <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground/50">/</span>}
                {crumb.href && i < crumbs.length - 1 ? (
                  <Link href={crumb.href} prefetch className="truncate text-muted-foreground hover:text-foreground">
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      i === crumbs.length - 1
                        ? isRecordId(crumb.label)
                          ? "truncate font-normal text-muted-foreground/55"
                          : "truncate font-medium text-foreground"
                        : "truncate text-muted-foreground"
                    }
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </span>
        </nav>
      )}

      {utilities}
    </header>
  );
}
