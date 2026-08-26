export type MatchRequirement = {
  preferred_areas?: string[] | null;
  bedrooms?: string | null;
  category?: string | null;
  interest?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
};

export type MatchUnit = {
  id: string;
  property_code: string;
  community: string | null;
  building_name: string | null;
  unit_number: string | null;
  property_type: string;
  bedrooms: number | null;
  status: string;
  asking_price: number | null;
  listing_type: string | null;
  listing_status: string | null;
};

export type InventoryMatch = MatchUnit & {
  score: number;
  reasons: string[];
};

const DEAD_LISTING = new Set(["sold", "rented", "withdrawn"]);
const DEAD_PROPERTY = new Set(["sold", "rented"]);

function parseBeds(value: string | null | undefined): number | null {
  if (!value) return null;
  const v = value.toLowerCase().replace(/_/g, " ").trim();
  if (v.includes("studio") || v === "0") return 0;
  const n = v.match(/(\d+)/);
  if (!n) return null;
  return Number(n[1]);
}

function listingTypeForInterest(interest: string | null | undefined) {
  if (interest === "rent") return "rent";
  if (interest === "off_plan") return "off_plan";
  return "sale";
}

function areaHit(community: string | null, areas: string[] | null | undefined) {
  if (!community || !areas?.length) return false;
  const hay = community.toLowerCase();
  return areas.some((area) => {
    const needle = area.trim().toLowerCase();
    return needle.length > 1 && (hay.includes(needle) || needle.includes(hay));
  });
}

export function rankInventoryForRequirement(
  requirement: MatchRequirement,
  units: MatchUnit[],
  limit = 5
): InventoryMatch[] {
  const wantBeds = parseBeds(requirement.bedrooms);
  const wantType = requirement.category?.trim().toLowerCase().replace(/ /g, "_") || null;
  const wantListing = listingTypeForInterest(requirement.interest);
  const min = requirement.budget_min ?? null;
  const max = requirement.budget_max ?? null;

  const ranked: InventoryMatch[] = [];
  for (const unit of units) {
    if (DEAD_PROPERTY.has(unit.status)) continue;
    if (unit.listing_status && DEAD_LISTING.has(unit.listing_status)) continue;

    let score = 0;
    const reasons: string[] = [];

    if (areaHit(unit.community, requirement.preferred_areas)) {
      score += 40;
      reasons.push("Area");
    }
    if (wantType && unit.property_type === wantType) {
      score += 20;
      reasons.push("Type");
    }
    if (wantBeds != null && unit.bedrooms != null && unit.bedrooms === wantBeds) {
      score += 20;
      reasons.push("Beds");
    } else if (wantBeds != null && unit.bedrooms != null && Math.abs(unit.bedrooms - wantBeds) === 1) {
      score += 8;
      reasons.push("Near beds");
    }
    if (unit.listing_type === wantListing) {
      score += 10;
      reasons.push("Listing");
    }
    if (unit.asking_price != null && (min != null || max != null)) {
      const lo = min ?? 0;
      const hi = max ?? Number.POSITIVE_INFINITY;
      if (unit.asking_price >= lo && unit.asking_price <= hi) {
        score += 10;
        reasons.push("Budget");
      }
    }

    if (score < 20) continue;
    ranked.push({ ...unit, score, reasons });
  }

  return ranked.sort((a, b) => b.score - a.score).slice(0, limit);
}

export const INVENTORY_MATCH_SELECT =
  "id, property_code, community, building_name, unit_number, property_type, bedrooms, status, listings(asking_price, listing_type, listing_status, deleted_at)";

type InventoryRow = {
  id: string;
  property_code: string;
  community: string | null;
  building_name: string | null;
  unit_number: string | null;
  property_type: string;
  bedrooms: number | null;
  status?: string;
  listings?:
    | { asking_price: number; listing_type: string; listing_status: string; deleted_at?: string | null }[]
    | { asking_price: number; listing_type: string; listing_status: string; deleted_at?: string | null }
    | null;
};

export function unitsFromInventoryRows(rows: InventoryRow[]): MatchUnit[] {
  return rows.map((row) => {
    const listings = (Array.isArray(row.listings) ? row.listings : row.listings ? [row.listings] : []).filter(
      (listing) => !listing.deleted_at
    );
    const listing =
      listings.find((item) => !DEAD_LISTING.has(item.listing_status)) ?? listings[0] ?? null;
    return {
      id: row.id,
      property_code: row.property_code,
      community: row.community,
      building_name: row.building_name,
      unit_number: row.unit_number,
      property_type: row.property_type,
      bedrooms: row.bedrooms,
      status: row.status ?? "available",
      asking_price: listing?.asking_price ?? null,
      listing_type: listing?.listing_type ?? null,
      listing_status: listing?.listing_status ?? null,
    };
  });
}

export function matchesForRequirement(requirement: MatchRequirement, rows: InventoryRow[]) {
  return rankInventoryForRequirement(requirement, unitsFromInventoryRows(rows));
}
