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
  { label: "Deals", href: "/deals", icon: "KanbanSquare", roles: ["admin", "manager", "reception", "agent", "accountant"], group: "CRM" },
  { label: "Reports", href: "/reports", icon: "BarChart3", roles: ["admin", "manager", "reception", "accountant"], group: "CRM" },
  { label: "People", href: "/customers", icon: "Contact", roles: ["admin", "manager", "reception", "agent", "accountant"], group: "CRM" },
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
    return pathname === "/deals" || pathname === "/pipeline" || pathname.startsWith("/pipeline/");
  }
  if (href === "/inventory") {
    return pathname === "/inventory" || pathname.startsWith("/inventory/");
  }
  if (href === "/settings") {
    return pathname === "/settings" || (pathname.startsWith("/settings/") && !pathname.startsWith("/settings/leads"));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function breadcrumbsFor(pathname: string): { label: string; href?: string }[] {
  const exact = NAV_ITEMS.find((item) => item.href === pathname);
  if (exact) {
    return [{ label: exact.group }, { label: exact.label }];
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
