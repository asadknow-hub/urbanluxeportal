import type { UserRole } from "@/lib/permissions";

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
  group: string;
};

export const NAV_GROUPS = [
  "Workspace",
  "CRM",
  "Marketing",
  "Inventory",
  "Finance",
  "People",
  "Governance",
  "System",
] as const;

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ["admin", "manager", "agent", "accountant"], group: "Workspace" },
  { label: "Leads", href: "/leads", icon: "Users", roles: ["admin", "manager", "agent", "accountant"], group: "CRM" },
  { label: "Follow-ups", href: "/leads/followups", icon: "CalendarClock", roles: ["admin", "manager", "agent", "accountant"], group: "CRM" },
  { label: "Deals", href: "/deals", icon: "KanbanSquare", roles: ["admin", "manager", "agent", "accountant"], group: "CRM" },
  { label: "Customers", href: "/customers", icon: "Contact", roles: ["admin", "manager", "agent", "accountant"], group: "CRM" },
  { label: "Campaigns", href: "/leads/campaigns", icon: "Megaphone", roles: ["admin", "manager", "accountant"], group: "Marketing" },
  { label: "Properties", href: "/properties", icon: "Building2", roles: ["admin", "manager", "agent", "accountant"], group: "Inventory" },
  { label: "Owners", href: "/properties/owners", icon: "UserCog", roles: ["admin", "manager", "agent", "accountant"], group: "Inventory" },
  { label: "Quotations", href: "/quotations", icon: "FileText", roles: ["admin", "manager", "agent", "accountant"], group: "Finance" },
  { label: "Invoices", href: "/invoices", icon: "ReceiptText", roles: ["admin", "manager", "accountant"], group: "Finance" },
  { label: "Payments", href: "/payments", icon: "CreditCard", roles: ["admin", "manager", "accountant"], group: "Finance" },
  { label: "Expenses", href: "/expenses", icon: "Wallet", roles: ["admin", "manager", "accountant"], group: "Finance" },
  { label: "Team", href: "/team", icon: "UsersRound", roles: ["admin", "manager"], group: "People" },
  { label: "Documents", href: "/documents", icon: "FolderOpen", roles: ["admin", "manager", "agent", "accountant"], group: "Governance" },
  { label: "Approvals", href: "/approvals", icon: "CheckCircle2", roles: ["admin", "manager", "agent"], group: "Governance" },
  { label: "Reports", href: "/reports", icon: "BarChart3", roles: ["admin", "manager", "agent", "accountant"], group: "Governance" },
  { label: "Lead inflow", href: "/settings/leads", icon: "Settings2", roles: ["admin", "manager"], group: "System" },
  { label: "Settings", href: "/settings", icon: "Settings", roles: ["admin"], group: "System" },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/leads") {
    if (pathname === "/leads") return true;
    if (
      pathname.startsWith("/leads/followups") ||
      pathname.startsWith("/leads/campaigns") ||
      pathname.startsWith("/leads/inflow")
    ) {
      return false;
    }
    return pathname.startsWith("/leads/");
  }
  if (href === "/deals" || href === "/pipeline") {
    return pathname === "/deals" || pathname === "/pipeline" || pathname.startsWith("/pipeline/");
  }
  if (href === "/properties") {
    return pathname === "/properties" || (pathname.startsWith("/properties/") && !pathname.startsWith("/properties/owners"));
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
