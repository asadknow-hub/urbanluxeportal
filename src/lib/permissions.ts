export type UserRole = "admin" | "manager" | "reception" | "agent" | "accountant";

export type Capability =
  | "dashboard_full"
  | "leads_all"
  | "pipeline_all"
  | "user_management"
  | "settings"
  | "delete_any";

export const USER_ROLES: UserRole[] = ["admin", "manager", "reception", "agent", "accountant"];

export const STAFF_ROLE_OPTIONS: { value: UserRole; label: string; hint: string }[] = [
  { value: "admin", label: "Admin", hint: "Full access, including settings and staff" },
  { value: "manager", label: "Manager", hint: "All leads, deals, customers, and lead settings" },
  { value: "reception", label: "Reception", hint: "Same access as Manager — front desk" },
  { value: "agent", label: "Agent", hint: "Own leads and deals" },
  { value: "accountant", label: "Accountant", hint: "Dashboard and CRM visibility" },
];

/** Staff who can be assigned leads and deals. */
export const ASSIGNABLE_ROLES: UserRole[] = ["admin", "manager", "reception", "agent"];

export function roleLabel(role: string | null | undefined) {
  if (!role) return "";
  return STAFF_ROLE_OPTIONS.find((row) => row.value === role)?.label ?? role.replace(/_/g, " ");
}

export function isManagerLike(role: string | null | undefined) {
  return role === "manager" || role === "reception";
}

/** Admin, manager, and reception — CRM management (not system settings). */
export function canManageCrm(role: string | null | undefined) {
  return role === "admin" || isManagerLike(role);
}

/** If a check includes manager, reception inherits it. */
export function withInheritedRoles<T extends string>(roles: T[]): T[] {
  const next = new Set(roles);
  if (next.has("manager" as T)) next.add("reception" as T);
  return [...next];
}

export const CAPABILITY_META: { key: Capability; label: string; description: string }[] = [
  { key: "dashboard_full", label: "Full dashboard", description: "See agency-wide KPIs" },
  { key: "leads_all", label: "All leads", description: "View and edit every lead" },
  { key: "pipeline_all", label: "All deals", description: "View and edit every deal" },
  { key: "user_management", label: "User management", description: "Invite, roles, activate staff" },
  { key: "settings", label: "System settings", description: "Company profile and templates" },
  { key: "delete_any", label: "Hard delete", description: "Permanently remove records" },
];

const MANAGER_CAPABILITIES: Record<Capability, boolean> = {
  dashboard_full: true,
  leads_all: true,
  pipeline_all: true,
  user_management: false,
  settings: false,
  delete_any: false,
};

export const PERMISSION_MATRIX: Record<UserRole, Record<Capability, boolean>> = {
  admin: {
    dashboard_full: true,
    leads_all: true,
    pipeline_all: true,
    user_management: true,
    settings: true,
    delete_any: true,
  },
  manager: MANAGER_CAPABILITIES,
  reception: { ...MANAGER_CAPABILITIES },
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
    return canManageCrm(role);
  }
  if (path.startsWith("/settings")) {
    return can(role, "settings") || can(role, "user_management");
  }
  if (path.startsWith("/team")) {
    return canManageCrm(role);
  }
  if (path.startsWith("/leads/inflow")) {
    return canManageCrm(role);
  }
  return true;
}

export { NAV_ITEMS } from "@/lib/nav";
