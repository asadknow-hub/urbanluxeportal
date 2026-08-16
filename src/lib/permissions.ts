export type UserRole = "admin" | "manager" | "agent" | "accountant";

export type Capability =
  | "dashboard_full"
  | "leads_all"
  | "pipeline_all"
  | "user_management"
  | "settings"
  | "delete_any";

const PERMISSION_MATRIX: Record<UserRole, Record<Capability, boolean>> = {
  admin: {
    dashboard_full: true,
    leads_all: true,
    pipeline_all: true,
    user_management: true,
    settings: true,
    delete_any: true,
  },
  manager: {
    dashboard_full: true,
    leads_all: true,
    pipeline_all: true,
    user_management: false,
    settings: false,
    delete_any: false,
  },
  agent: {
    dashboard_full: false,
    leads_all: false,
    pipeline_all: false,
    user_management: false,
    settings: false,
    delete_any: false,
  },
  accountant: {
    dashboard_full: true,
    leads_all: false,
    pipeline_all: false,
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

/** Routes removed while CRM + org structure are finalized. */
const REMOVED_ROUTE_PREFIXES = [
  "/leads/campaigns",
  "/properties",
  "/quotations",
  "/invoices",
  "/payments",
  "/expenses",
  "/documents",
  "/approvals",
  "/reports",
  "/settings/automations",
] as const;

function isRemovedRoute(path: string): boolean {
  return REMOVED_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export function canAccessRoute(role: UserRole | null | undefined, path: string): boolean {
  if (!role) return false;
  if (isRemovedRoute(path)) return false;

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
