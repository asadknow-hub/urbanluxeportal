import type { UserRole } from "@/lib/permissions";

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
  group: string;
};

/** Section headlines always render. Inventory is live; Marketing / Finance / Governance stay empty for now. */
export const NAV_GROUPS = [
  "Workspace",
  "CRM",
  "Marketing",
  "Inventory",
  "Finance",
  "Governance",
  "System",
] as const;

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ["admin", "manager", "reception", "agent", "accountant"], group: "Workspace" },
  { label: "Staff", href: "/team", icon: "UsersRound", roles: ["admin", "manager", "reception"], group: "Workspace" },
  { label: "Lead Settings", href: "/settings/leads", icon: "Settings2", roles: ["admin", "manager", "reception"], group: "CRM" },
  { label: "Leads", href: "/leads", icon: "Users", roles: ["admin", "manager", "reception", "agent", "accountant"], group: "CRM" },
  { label: "Follow-ups", href: "/leads/followups", icon: "CalendarClock", roles: ["admin", "manager", "reception", "agent", "accountant"], group: "CRM" },
  { label: "Viewings", href: "/viewings", icon: "Calendar", roles: ["admin", "manager", "reception", "agent", "accountant"], group: "CRM" },
  { label: "Deals", href: "/pipeline", icon: "KanbanSquare", roles: ["admin", "manager", "reception", "agent", "accountant"], group: "CRM" },
  { label: "Reports", href: "/reports", icon: "BarChart3", roles: ["admin", "manager", "reception", "accountant"], group: "CRM" },
  { label: "People", href: "/customers", icon: "Contact", roles: ["admin", "manager", "reception", "agent", "accountant"], group: "CRM" },
  { label: "Properties", href: "/company-properties", icon: "Home", roles: ["admin", "manager", "reception", "agent", "accountant"], group: "CRM" },
  { label: "Inventory", href: "/inventory", icon: "Building2", roles: ["admin", "manager", "reception", "agent", "accountant"], group: "Inventory" },
  { label: "Settings", href: "/settings", icon: "Settings", roles: ["admin"], group: "System" },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/leads") {
    if (pathname === "/leads") return true;
    if (pathname.startsWith("/leads/followups") || pathname.startsWith("/leads/inflow")) {
      return false;
    }
    return pathname.startsWith("/leads/");
  }
  if (href === "/deals" || href === "/pipeline") {
    return (
      pathname === "/deals" ||
      pathname === "/pipeline" ||
      (pathname.startsWith("/pipeline/") && !pathname.startsWith("/pipeline/completed"))
    );
  }
  if (href === "/company-properties") {
    return pathname === "/company-properties" || pathname.startsWith("/company-properties/");
  }
  if (href === "/inventory") {
    return pathname === "/inventory" || pathname.startsWith("/inventory/");
  }
  if (href === "/settings") {
    return pathname === "/settings" || (pathname.startsWith("/settings/") && !pathname.startsWith("/settings/leads"));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type SectionHeader = {
  title: string;
  /** Tailwind gradient stops after `bg-gradient-to-r` */
  gradient: string;
};

const SECTION_GRADIENT: Record<string, string> = {
  Workspace: "from-[#0b1d3d] via-[#1a4a7a] to-[#2563a8]",
  CRM: "from-[#0b1d3d] via-[#14532d] to-[#1e7a4a]",
  Inventory: "from-[#0b1d3d] via-[#1e3a5f] to-[#0e7490]",
  System: "from-[#1e293b] via-[#334155] to-[#475569]",
};

const SECTION_OVERRIDES: Record<string, SectionHeader> = {
  "/pipeline/completed": {
    title: "Deals Completed",
    gradient: "from-[#064e3b] via-[#047857] to-[#1e7a4a]",
  },
  "/settings/leads": {
    title: "Lead Settings",
    gradient: SECTION_GRADIENT.CRM,
  },
  "/settings/users": {
    title: "Users",
    gradient: SECTION_GRADIENT.System,
  },
  "/settings/email-templates": {
    title: "Email Templates",
    gradient: SECTION_GRADIENT.System,
  },
  "/leads/imports": {
    title: "Lead Imports",
    gradient: SECTION_GRADIENT.CRM,
  },
  "/leads/inflow": {
    title: "Lead Inflow",
    gradient: SECTION_GRADIENT.CRM,
  },
};

function isRecordPathSegment(segment: string) {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
    /^[0-9a-f]{32}$/i.test(segment)
  );
}

/** Every page gets a gradient header — section pages show the section name,
 *  detail pages show the parent category name. */
export function sectionHeaderFor(pathname: string): SectionHeader | null {
  const override = SECTION_OVERRIDES[pathname];
  if (override) return override;

  const navExact = NAV_ITEMS.find((item) => item.href === pathname);
  if (navExact) {
    return {
      title: navExact.label,
      gradient: SECTION_GRADIENT[navExact.group as keyof typeof SECTION_GRADIENT] ?? SECTION_GRADIENT.CRM,
    };
  }

  const parts = pathname.split("/").filter(Boolean);

  // Detail pages (e.g. /leads/[id], /pipeline/[id], /customers/[id], etc.)
  // show the parent section's gradient header.
  if (parts.length >= 2 && isRecordPathSegment(parts[parts.length - 1] ?? "")) {
    const parent = [...NAV_ITEMS]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => pathname.startsWith(`${item.href}/`) || pathname.startsWith(`${item.href}`));
    if (parent) {
      return {
        title: parent.label,
        gradient: SECTION_GRADIENT[parent.group as keyof typeof SECTION_GRADIENT] ?? SECTION_GRADIENT.CRM,
      };
    }
    // Pipeline detail
    if (parts[0] === "pipeline") {
      return {
        title: "Deals",
        gradient: SECTION_GRADIENT.CRM,
      };
    }
  }

  // Sub-routes that are still section screens (not entity detail).
  if (parts.length >= 2 && !isRecordPathSegment(parts[parts.length - 1] ?? "")) {
    // Settings sub-pages
    if (pathname.startsWith("/settings/")) {
      const tail = parts[parts.length - 1] ?? "";
      const label = tail.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        title: label,
        gradient: SECTION_GRADIENT.System,
      };
    }
    // Any other sub-route of a nav item
    const parent = [...NAV_ITEMS]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => pathname.startsWith(`${item.href}/`));
    if (parent) {
      return {
        title: parent.label,
        gradient: SECTION_GRADIENT[parent.group as keyof typeof SECTION_GRADIENT] ?? SECTION_GRADIENT.CRM,
      };
    }
  }

  return null;
}

export function breadcrumbsFor(pathname: string): { label: string; href?: string }[] {
  const exact = NAV_ITEMS.find((item) => item.href === pathname);
  if (exact) {
    return [{ label: exact.group }, { label: exact.label }];
  }

  if (pathname === "/pipeline" || pathname.startsWith("/pipeline/")) {
    const parts = pathname.split("/").filter(Boolean);
    const crumbs: { label: string; href?: string }[] = [
      { label: "CRM" },
      { label: "Pipeline", href: "/pipeline" },
    ];
    if (parts[1] === "completed") {
      crumbs.push({ label: "Completed" });
      return crumbs;
    }
    if (parts.length > 1) crumbs.push({ label: decodeURIComponent(parts[1]) });
    return crumbs;
  }

  const parent = [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname.startsWith(`${item.href}/`) && isNavActive(pathname, item.href));
  if (parent) {
    const tail = pathname.split("/").filter(Boolean).pop() ?? "";
    return [{ label: parent.group }, { label: parent.label, href: parent.href }, { label: decodeURIComponent(tail) }];
  }
  const segments = pathname.split("/").filter(Boolean);
  return segments.length ? segments.map((s) => ({ label: s })) : [{ label: "Dashboard" }];
}
