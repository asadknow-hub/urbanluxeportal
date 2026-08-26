export const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "plot", label: "Plot" },
  { value: "office", label: "Office" },
  { value: "retail", label: "Retail" },
  { value: "warehouse", label: "Warehouse" },
  { value: "building", label: "Building" },
] as const;

export const PROPERTY_STATUSES = [
  { value: "available", label: "Available" },
  { value: "off_plan", label: "Off-plan" },
  { value: "under_construction", label: "Under construction" },
  { value: "ready", label: "Ready" },
  { value: "sold", label: "Sold" },
  { value: "rented", label: "Rented" },
] as const;

export const LISTING_TYPES = [
  { value: "sale", label: "Sale" },
  { value: "rent", label: "Rent" },
  { value: "off_plan", label: "Off-plan" },
] as const;

export const LISTING_STATUSES = [
  { value: "available", label: "Available" },
  { value: "draft", label: "Draft" },
  { value: "reserved", label: "Reserved" },
  { value: "under_offer", label: "Under offer" },
  { value: "sold", label: "Sold" },
  { value: "rented", label: "Rented" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

export const MATCH_ROLES = [
  { value: "suggested", label: "Suggested" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "viewed", label: "Viewed" },
  { value: "offered", label: "Offered" },
  { value: "requirement", label: "Requirement" },
] as const;

export const VIEWING_STATUSES = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No-show" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const VIEWING_OUTCOMES = [
  { value: "interested", label: "Interested" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "follow_up", label: "Follow up" },
] as const;

export const FURNISHING = [
  { value: "furnished", label: "Furnished" },
  { value: "semi", label: "Semi" },
  { value: "unfurnished", label: "Unfurnished" },
] as const;

export function formatPropertyType(value: string | null | undefined) {
  return PROPERTY_TYPES.find((row) => row.value === value)?.label ?? (value ?? "").replace(/_/g, " ");
}

export function propertyLabel(input: {
  property_code?: string | null;
  community?: string | null;
  building_name?: string | null;
  unit_number?: string | null;
  property_type?: string | null;
  bedrooms?: number | null;
}) {
  const place = [input.community, input.building_name, input.unit_number].filter(Boolean).join(" · ");
  const beds = input.bedrooms != null ? `${input.bedrooms} bed` : null;
  const type = formatPropertyType(input.property_type);
  const bits = [place || null, beds, type].filter(Boolean);
  const line = bits.join(" · ");
  return input.property_code ? `${input.property_code}${line ? ` · ${line}` : ""}` : line || "Property";
}
