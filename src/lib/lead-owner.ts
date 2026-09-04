/** Heuristic: person existed before this lead (linked owner), not created with it. */
const PERSON_PREEXISTS_MS = 15_000;

export function isExistingOwnerPerson(args: {
  leadCreatedAt: string;
  personCreatedAt: string | null | undefined;
  siblingLeadCount: number;
}): boolean {
  if (args.siblingLeadCount > 0) return true;
  if (
    args.personCreatedAt &&
    Date.parse(args.leadCreatedAt) - Date.parse(args.personCreatedAt) > PERSON_PREEXISTS_MS
  ) {
    return true;
  }
  return false;
}

/** Contact fields owned by the customer record — locked on linked-owner leads. */
export const OWNER_LOCKED_LEAD_FIELDS = ["name", "phone", "email", "nationality"] as const;

export type OwnerLockedLeadField = (typeof OWNER_LOCKED_LEAD_FIELDS)[number];

export function ownerLockedFieldsInPatch(patch: Record<string, unknown>): OwnerLockedLeadField[] {
  return OWNER_LOCKED_LEAD_FIELDS.filter((key) => Object.prototype.hasOwnProperty.call(patch, key));
}
