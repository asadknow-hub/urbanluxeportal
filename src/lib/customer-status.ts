export const CUSTOMER_STATUSES = [
  { key: "lead", label: "Lead", hint: "Captured — still on the leads board" },
  { key: "qualified", label: "Qualified", hint: "Open deal in the pipeline" },
  { key: "active", label: "Active", hint: "Won at least one deal" },
  { key: "inactive", label: "Inactive", hint: "Manual archive" },
  { key: "lost", label: "Lost", hint: "Did not proceed / junk" },
] as const;

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number]["key"];

const WORKING_STATUSES = new Set(["lead", "qualified", "prospect"]);

export function isWorkingCustomerStatus(status: string | null | undefined) {
  return WORKING_STATUSES.has(status ?? "");
}

export function customerStatusLabel(status: string | null | undefined) {
  if (!status) return "";
  return CUSTOMER_STATUSES.find((row) => row.key === status)?.label ?? status.replace(/_/g, " ");
}
