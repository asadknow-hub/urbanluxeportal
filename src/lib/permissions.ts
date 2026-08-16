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

/** Parked while CRM + org structure are finalized (code remains, nav + access blocked). */
const PARKED_ROUTE_PREFIXES = [
  "/leads/campaigns",
  "/properties",
  "/quotations",
  "/invoices",
  "/payments",
  "/expenses",
  "/documents",
  "/approvals",
  "/reports",
] as const;

function isParkedRoute(path: string): boolean {
  return PARKED_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export function canAccessRoute(role: UserRole | null | undefined, path: string): boolean {
  if (!role) return false;
  if (isParkedRoute(path)) return false;

  if (path.startsWith("/settings/leads")) {
    return role === "admin" || role === "manager";
  }
  if (path.startsWith("/settings")) {
    return can(role, "settings") || can(role, "user_management");
  }
  if (path.startsWith("/team")) {
    return role === "admin" || role === "manager";
  }
  if (path.startsWith("/leads/inflow")) {
    return role === "admin" || role === "manager";
  }
  return true;
}

export { NAV_ITEMS } from "@/lib/nav";
