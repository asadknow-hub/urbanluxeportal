export type UserRole = "admin" | "manager" | "agent" | "accountant";

export type Capability =
  | "dashboard_full"
  | "leads_all"
  | "pipeline_all"
  | "properties_create"
  | "quotations_create"
  | "invoices_create"
  | "invoices_void"
  | "payments_view"
  | "payments_manage"
  | "approvals_approve"
  | "approvals_request"
  | "reports_all"
  | "reports_own"
  | "reports_financial"
  | "user_management"
  | "settings"
  | "delete_any";

const PERMISSION_MATRIX: Record<UserRole, Record<Capability, boolean>> = {
  admin: {
    dashboard_full: true,
    leads_all: true,
    pipeline_all: true,
    properties_create: true,
    quotations_create: true,
    invoices_create: true,
    invoices_void: true,
    payments_view: true,
    payments_manage: true,
    approvals_approve: true,
    approvals_request: true,
    reports_all: true,
    reports_own: true,
    reports_financial: true,
    user_management: true,
    settings: true,
    delete_any: true,
  },
  manager: {
    dashboard_full: true,
    leads_all: true,
    pipeline_all: true,
    properties_create: true,
    quotations_create: true,
    invoices_create: true,
    invoices_void: true,
    payments_view: true,
    payments_manage: false,
    approvals_approve: true,
    approvals_request: true,
    reports_all: true,
    reports_own: true,
    reports_financial: true,
    user_management: false,
    settings: false,
    delete_any: false,
  },
  agent: {
    dashboard_full: false,
    leads_all: false,
    pipeline_all: false,
    properties_create: true,
    quotations_create: true,
    invoices_create: false,
    invoices_void: false,
    payments_view: false,
    payments_manage: false,
    approvals_approve: false,
    approvals_request: true,
    reports_all: false,
    reports_own: true,
    reports_financial: false,
    user_management: false,
    settings: false,
    delete_any: false,
  },
  accountant: {
    dashboard_full: true,
    leads_all: false,
    pipeline_all: false,
    properties_create: false,
    quotations_create: true,
    invoices_create: true,
    invoices_void: true,
    payments_view: true,
    payments_manage: true,
    approvals_approve: false,
    approvals_request: false,
    reports_all: false,
    reports_own: false,
    reports_financial: true,
    user_management: false,
    settings: false,
    delete_any: false,
  },
};

export function can(
  role: UserRole | null | undefined,
  capability: Capability
): boolean {
  if (!role) return false;
  return PERMISSION_MATRIX[role]?.[capability] ?? false;
}

export function canAccessRoute(role: UserRole | null | undefined, path: string): boolean {
  if (!role) return false;
  if (path.startsWith("/settings")) {
    return can(role, "settings") || can(role, "user_management");
  }
  if (path.startsWith("/payments")) {
    return can(role, "payments_view") || can(role, "payments_manage");
  }
  if (path.startsWith("/invoices")) {
    return can(role, "invoices_create") || can(role, "invoices_void") || role === "manager" || role === "admin";
  }
  if (path.startsWith("/reports")) {
    return can(role, "reports_all") || can(role, "reports_own") || can(role, "reports_financial");
  }
  if (path.startsWith("/approvals")) {
    return can(role, "approvals_approve") || can(role, "approvals_request");
  }
  return true;
}

export const NAV_ITEMS: {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
  group: string;
}[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ["admin", "manager", "agent", "accountant"], group: "Main" },
  { label: "Leads", href: "/leads", icon: "Users", roles: ["admin", "manager", "agent", "accountant"], group: "CRM" },
  { label: "Customers", href: "/customers", icon: "Contact", roles: ["admin", "manager", "agent", "accountant"], group: "CRM" },
  { label: "Pipeline", href: "/pipeline", icon: "KanbanSquare", roles: ["admin", "manager", "agent", "accountant"], group: "CRM" },
  { label: "Properties", href: "/properties", icon: "Building2", roles: ["admin", "manager", "agent", "accountant"], group: "Inventory" },
  { label: "Quotations", href: "/quotations", icon: "FileText", roles: ["admin", "manager", "agent", "accountant"], group: "Commercial" },
  { label: "Invoices", href: "/invoices", icon: "ReceiptText", roles: ["admin", "manager", "accountant"], group: "Commercial" },
  { label: "Payments", href: "/payments", icon: "CreditCard", roles: ["admin", "manager", "accountant"], group: "Commercial" },
  { label: "Expenses", href: "/expenses", icon: "ReceiptText", roles: ["admin", "manager", "accountant"], group: "Commercial" },
  { label: "Documents", href: "/documents", icon: "FolderOpen", roles: ["admin", "manager", "agent", "accountant"], group: "Governance" },
  { label: "Approvals", href: "/approvals", icon: "CheckCircle2", roles: ["admin", "manager", "agent"], group: "Governance" },
  { label: "Reports", href: "/reports", icon: "BarChart3", roles: ["admin", "manager", "agent", "accountant"], group: "Governance" },
  { label: "Settings", href: "/settings", icon: "Settings", roles: ["admin"], group: "System" },
];
