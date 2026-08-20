/**
 * Brochure listings for the public site.
 * Placeholder only — swap for the portal inventory feed later. No database tables.
 */

export type ListingKind = "sale" | "rent" | "offplan";
export type PropertyType = "apartment" | "villa" | "penthouse" | "townhouse";

export type Community = {
  slug: string;
  name: string;
  region: string;
  blurb: string;
  image: string;
};

export type Listing = {
  slug: string;
  title: string;
  subtitle: string;
  community: string;
  communitySlug: string;
  kind: ListingKind;
  type: PropertyType;
  priceAed: number;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
  gallery: string[];
  featured?: boolean;
  ref: string;
  description: string;
  amenities: string[];
  status: "ready" | "offplan";
  handover?: string;
  developer?: string;
  exclusive?: boolean;
  monthlyAed?: number;
  downPaymentAed?: number;
  paymentPlan?: { label: string; pct: number }[];
};

const u = (id: string, w = 1800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMAGES = {
  hero: u("photo-1582672060674-bc2bd808a8b5", 2560),
  palm: u("photo-1582672060674-bc2bd808a8b5", 2000),
  downtown: u("photo-1518684079-3c830dcef090", 2000),
  marina: u("photo-1486406146926-c627a92ad1ab", 2000),
  villa: u("photo-1613490493576-7fde63acd811", 2000),
  interior: u("photo-1600596542815-ffad4c1539a9", 2000),
  living: u("photo-1600607687939-ce8a6c25118c", 2000),
  house: u("photo-1600585154340-be6161a56a0c", 2000),
  pool: u("photo-1600047509807-ba8d5268f0dc", 2000),
  kitchen: u("photo-1600566753190-17f0baa2a6c3", 2000),
  night: u("photo-1546412414-8035e1776c9a", 2000),
  hills: u("photo-1564013799919-ab600027ffc6", 2000),
  creek: u("photo-1496568816309-51d7c20e3b21", 2000),
  water: u("photo-1571896349842-33c89424de2d", 2000),
  penthouse: u("photo-1600607687644-c7171b42498f", 2000),
  terrace: u("photo-1600210492493-0946911123ea", 2000),
  heroRefined: u("photo-1600210492493-0946911123ea", 2560),
  bedroom: u("photo-1616594039964-aac4c3eac7f4", 1800),
  about: u("photo-1600585154526-990dced4db0d", 2000),
};

export const COMMUNITIES: Community[] = [
  {
    slug: "palm-jumeirah",
    name: "Palm Jumeirah",
    region: "Coast",
    blurb: "The frond. Private beaches, still water, and villas that face the Gulf.",
    image: IMAGES.palm,
  },
  {
    slug: "downtown-dubai",
    name: "Downtown Dubai",
    region: "City",
    blurb: "The address the skyline was built around. Burj Khalifa at the window.",
    image: IMAGES.downtown,
  },
  {
    slug: "dubai-marina",
    name: "Dubai Marina",
    region: "Waterfront",
    blurb: "A city on the water. High-rise living with yacht-club cadence.",
    image: IMAGES.marina,
  },
  {
    slug: "emirates-hills",
    name: "Emirates Hills",
    region: "Golf",
    blurb: "Gated, green, and unhurried. Dubai’s most private villa enclave.",
    image: IMAGES.hills,
  },
  {
    slug: "dubai-hills-estate",
    name: "Dubai Hills Estate",
    region: "Family",
    blurb: "Parkland, schools, and houses that still feel like houses.",
    image: IMAGES.house,
  },
  {
    slug: "dubai-creek-harbour",
    name: "Dubai Creek Harbour",
    region: "Waterfront",
    blurb: "The next skyline. Creek light, tower living, a longer view.",
    image: IMAGES.creek,
  },
  {
    slug: "bluewaters",
    name: "Bluewaters Island",
    region: "Island",
    blurb: "A short bridge from JBR. Sea air, Ain Dubai, and branded residences.",
    image: IMAGES.water,
  },
  {
    slug: "tilal-al-ghaf",
    name: "Tilal Al Ghaf",
    region: "South",
    blurb: "Lagoons and low-rise living — a softer Dubai, still new.",
    image: IMAGES.pool,
  },
];

export const LISTINGS: Listing[] = [
  {
    slug: "palm-frond-g-signature-villa",
    title: "Signature villa on Frond G",
    subtitle: "Private beach · seven bedrooms · west-facing Gulf",
    community: "Palm Jumeirah",
    communitySlug: "palm-jumeirah",
    kind: "sale",
    type: "villa",
    priceAed: 48500000,
    beds: 7,
    baths: 8,
    sqft: 12500,
    image: IMAGES.villa,
    gallery: [IMAGES.villa, IMAGES.pool, IMAGES.interior, IMAGES.living, IMAGES.palm],
    featured: true,
    exclusive: true,
    ref: "UL-P-1042",
    description:
      "A quiet plot on Frond G, set back from the spine, with a private beach that does not share its horizon. The house is arranged for living, not display: a double-height salon to the water, a kitchen that can disappear, and a garden that runs to the sand without a fence in the photograph. Staff quarters, a cinema, and a garage for four sit below the line of sight.",
    amenities: ["Private beach", "Infinity pool", "Cinema", "Staff quarters", "Smart home", "Garage ×4"],
    status: "ready",
  },
  {
    slug: "downtown-opera-grand-penthouse",
    title: "Penthouse, Opera Grand",
    subtitle: "Full Burj and fountain composition",
    community: "Downtown Dubai",
    communitySlug: "downtown-dubai",
    kind: "sale",
    type: "penthouse",
    priceAed: 31200000,
    beds: 4,
    baths: 5,
    sqft: 6800,
    image: IMAGES.penthouse,
    gallery: [IMAGES.penthouse, IMAGES.downtown, IMAGES.living, IMAGES.terrace, IMAGES.kitchen],
    featured: true,
    ref: "UL-D-0881",
    description:
      "The last full-floor residence we will show on this stack. The terrace wraps the fountain axis; interiors are stone and quiet timber, not gold leaf. A private lift lobby, a dining room that seats twelve, and a principal suite that wakes to the Burj without another tower in frame.",
    amenities: ["Private elevator", "Wrap terrace", "Fountain view", "Maid’s room", "Storage", "Valet"],
    status: "ready",
  },
  {
    slug: "emirates-hills-golf-estate",
    title: "Golf-front estate, Sector 3",
    subtitle: "Half-acre, lagoon, and a house that recedes",
    community: "Emirates Hills",
    communitySlug: "emirates-hills",
    kind: "sale",
    type: "villa",
    priceAed: 62000000,
    beds: 6,
    baths: 8,
    sqft: 14800,
    image: IMAGES.hills,
    gallery: [IMAGES.hills, IMAGES.house, IMAGES.interior, IMAGES.pool, IMAGES.kitchen],
    featured: true,
    ref: "UL-EH-0217",
    description:
      "One of the quieter plots in Sector 3 — the fairway is a neighbour, not a spectacle. The architecture is contemporary, low, and deliberately unbranded. Indoor–outdoor rooms, a lagoon pool, and a guest wing that can close entirely from the principal house.",
    amenities: ["Golf frontage", "Lagoon pool", "Guest wing", "Wine room", "Gym", "Driver’s room"],
    status: "ready",
  },
  {
    slug: "marina-gate-sky-residence",
    title: "Sky residence, Marina Gate",
    subtitle: "Corner, high, and still",
    community: "Dubai Marina",
    communitySlug: "dubai-marina",
    kind: "sale",
    type: "apartment",
    priceAed: 6900000,
    beds: 3,
    baths: 4,
    sqft: 2450,
    image: IMAGES.marina,
    gallery: [IMAGES.marina, IMAGES.living, IMAGES.kitchen, IMAGES.terrace],
    featured: true,
    ref: "UL-M-3310",
    description:
      "A high corner in Marina Gate with the water on two sides and the walk below as a distant line. Recently released by a private client. Fitted kitchen, winter garden, and a view that does not look into another living room.",
    amenities: ["Marina view", "Winter garden", "Concierge", "Pool", "Gym", "Covered parking ×2"],
    status: "ready",
  },
  {
    slug: "hills-park-family-villa",
    title: "Park villa, Dubai Hills",
    subtitle: "Garden, school run, and a proper kitchen",
    community: "Dubai Hills Estate",
    communitySlug: "dubai-hills-estate",
    kind: "sale",
    type: "villa",
    priceAed: 9800000,
    beds: 5,
    baths: 6,
    sqft: 5200,
    image: IMAGES.house,
    gallery: [IMAGES.house, IMAGES.interior, IMAGES.kitchen, IMAGES.pool],
    featured: true,
    ref: "UL-DH-1544",
    description:
      "A family house that behaves like one. Park at the end of the street, the club a bicycle away, and a layout that does not force guests through the children’s rooms. Upgraded kitchen, shaded terrace, and a garden with room for a pool if you want one later.",
    amenities: ["Park access", "Upgraded kitchen", "Maid’s room", "Covered parking", "Community pool", "Schools nearby"],
    status: "ready",
  },
  {
    slug: "bluewaters-seafront-apartment",
    title: "Seafront apartment, Bluewaters",
    subtitle: "The island, without the noise of the promenade",
    community: "Bluewaters Island",
    communitySlug: "bluewaters",
    kind: "sale",
    type: "apartment",
    priceAed: 7400000,
    beds: 2,
    baths: 3,
    sqft: 1680,
    image: IMAGES.water,
    gallery: [IMAGES.water, IMAGES.living, IMAGES.terrace, IMAGES.kitchen],
    featured: true,
    ref: "UL-BW-0772",
    description:
      "A two-bedroom facing open water rather than the wheel. Branded residence services, a kitchen that is actually used, and a terrace wide enough for a table that stays out all year.",
    amenities: ["Sea view", "Branded residence", "Beach access", "Concierge", "Gym", "Parking"],
    status: "ready",
  },
  {
    slug: "creek-harbour-tower-residence",
    title: "Creek Harbour tower residence",
    subtitle: "The water, the park, the next chapter",
    community: "Dubai Creek Harbour",
    communitySlug: "dubai-creek-harbour",
    kind: "offplan",
    type: "apartment",
    priceAed: 2850000,
    beds: 2,
    baths: 2,
    sqft: 1210,
    image: IMAGES.creek,
    gallery: [IMAGES.creek, IMAGES.night, IMAGES.living],
    featured: true,
    ref: "UL-CH-4091",
    description:
      "A two-bedroom in a tower that still has a view of the creek rather than of itself. Payment plan on enquiry. Handover scheduled, finishes specified, and a park at the door that will actually be a park.",
    amenities: ["Creek view", "Payment plan", "Park access", "Retail below", "Pool", "Gym"],
    status: "offplan",
    handover: "Q4 2027",
    developer: "Emaar",
    monthlyAed: 25000,
    downPaymentAed: 285000,
    paymentPlan: [
      { label: "Booking", pct: 10 },
      { label: "Construction", pct: 40 },
      { label: "Handover", pct: 30 },
      { label: "Post", pct: 20 },
    ],
  },
  {
    slug: "tilal-lagoon-townhouse",
    title: "Lagoon townhouse, Tilal Al Ghaf",
    subtitle: "Water at the garden wall",
    community: "Tilal Al Ghaf",
    communitySlug: "tilal-al-ghaf",
    kind: "offplan",
    type: "townhouse",
    priceAed: 4200000,
    beds: 4,
    baths: 4,
    sqft: 2800,
    image: IMAGES.pool,
    gallery: [IMAGES.pool, IMAGES.house, IMAGES.interior],
    featured: true,
    ref: "UL-TG-1180",
    description:
      "A four-bedroom townhouse on the lagoon edge — the kind of water you can hear at night. Low-rise, landscaped, and far enough from the highway that the weekend feels like a weekend.",
    amenities: ["Lagoon frontage", "Private garden", "Community beach", "Schools planned", "Payment plan"],
    status: "offplan",
    handover: "Q2 2028",
    developer: "Majid Al Futtaim",
    monthlyAed: 32000,
    downPaymentAed: 420000,
    paymentPlan: [
      { label: "Booking", pct: 10 },
      { label: "Every 4 months", pct: 40 },
      { label: "Handover", pct: 30 },
      { label: "Post", pct: 20 },
    ],
  },
  {
    slug: "address-residences-downtown",
    title: "Address Residences Downtown",
    subtitle: "Branded living on the fountain axis",
    community: "Downtown Dubai",
    communitySlug: "downtown-dubai",
    kind: "offplan",
    type: "apartment",
    priceAed: 2100000,
    beds: 1,
    baths: 2,
    sqft: 890,
    image: IMAGES.downtown,
    gallery: [IMAGES.downtown, IMAGES.penthouse, IMAGES.living],
    featured: true,
    ref: "UL-CH-5102",
    description:
      "A one-bedroom in a branded Downtown stack, with a payment plan that does not ask for the building on day one. Fountain light, hotel service, and a handover that is still a date you can write down.",
    amenities: ["Branded residence", "Fountain view", "Payment plan", "Concierge", "Pool", "Gym"],
    status: "offplan",
    handover: "Q3 2027",
    developer: "Emaar",
    monthlyAed: 22000,
    downPaymentAed: 210000,
    paymentPlan: [
      { label: "Booking", pct: 10 },
      { label: "Construction", pct: 50 },
      { label: "Handover", pct: 40 },
    ],
  },
  {
    slug: "sobha-hartland-creek",
    title: "Sobha Hartland II",
    subtitle: "Low-rise on the creek park",
    community: "Dubai Creek Harbour",
    communitySlug: "dubai-creek-harbour",
    kind: "offplan",
    type: "apartment",
    priceAed: 1750000,
    beds: 1,
    baths: 1,
    sqft: 760,
    image: IMAGES.creek,
    gallery: [IMAGES.creek, IMAGES.interior, IMAGES.kitchen],
    featured: true,
    ref: "UL-CH-6110",
    description:
      "A quieter off-plan than the towers: park, creek, and a developer that finishes what it starts. Studio-to-one-bed inventory with a monthly that still looks like rent.",
    amenities: ["Park", "Creek", "Payment plan", "Community retail", "Pool"],
    status: "offplan",
    handover: "Q1 2028",
    developer: "Sobha",
    monthlyAed: 18000,
    downPaymentAed: 175000,
    paymentPlan: [
      { label: "Booking", pct: 20 },
      { label: "Construction", pct: 40 },
      { label: "Handover", pct: 40 },
    ],
  },
  {
    slug: "nakheel-palm-east",
    title: "Palm East waterfront",
    subtitle: "A new line on the trunk",
    community: "Palm Jumeirah",
    communitySlug: "palm-jumeirah",
    kind: "offplan",
    type: "apartment",
    priceAed: 3900000,
    beds: 2,
    baths: 3,
    sqft: 1450,
    image: IMAGES.palm,
    gallery: [IMAGES.palm, IMAGES.water, IMAGES.terrace],
    featured: true,
    ref: "UL-P-7204",
    description:
      "East-facing water on the Palm, still on a plan. Two bedrooms, a proper terrace, and a construction schedule you can actually read.",
    amenities: ["Palm waterfront", "Payment plan", "Beach access", "Gym", "Parking"],
    status: "offplan",
    handover: "Q4 2028",
    developer: "Nakheel",
    monthlyAed: 35000,
    downPaymentAed: 390000,
    paymentPlan: [
      { label: "Booking", pct: 10 },
      { label: "Construction", pct: 40 },
      { label: "Handover", pct: 50 },
    ],
  },
  {
    slug: "damac-lagoons-morocco",
    title: "Morocco by Damac Lagoons",
    subtitle: "Townhouse, lagoon, vacant on paper",
    community: "Tilal Al Ghaf",
    communitySlug: "tilal-al-ghaf",
    kind: "offplan",
    type: "townhouse",
    priceAed: 5000000,
    beds: 3,
    baths: 4,
    sqft: 3100,
    image: IMAGES.house,
    gallery: [IMAGES.house, IMAGES.pool, IMAGES.interior, IMAGES.living],
    featured: true,
    exclusive: true,
    ref: "UL-TG-8301",
    description:
      "A three-bedroom corner townhouse on the lagoon cluster — maid’s, vacant on handover, and a plan that front-loads less than you expect.",
    amenities: ["Lagoon", "Maid’s room", "Garden", "Community beach", "Payment plan"],
    status: "offplan",
    handover: "Q2 2027",
    developer: "Damac",
    monthlyAed: 30000,
    downPaymentAed: 100000,
    paymentPlan: [
      { label: "Booking", pct: 10 },
      { label: "Every 4 months", pct: 30 },
      { label: "Construction", pct: 40 },
      { label: "Handover", pct: 20 },
    ],
  },
  {
    slug: "downtown-boulevard-two-bed",
    title: "Boulevard two-bedroom",
    subtitle: "The walk, the fountains, the city at street level",
    community: "Downtown Dubai",
    communitySlug: "downtown-dubai",
    kind: "rent",
    type: "apartment",
    priceAed: 280000,
    beds: 2,
    baths: 3,
    sqft: 1420,
    image: IMAGES.downtown,
    gallery: [IMAGES.downtown, IMAGES.living, IMAGES.kitchen],
    featured: true,
    ref: "UL-D-5520",
    description:
      "A furnished two-bedroom a short walk from the fountains, available immediately. High floor, quiet stack, and a living room that does not require a designer to finish it.",
    amenities: ["Furnished", "High floor", "Boulevard view", "Gym", "Pool", "Parking"],
    status: "ready",
  },
  {
    slug: "marina-walk-one-bed",
    title: "Marina Walk one-bedroom",
    subtitle: "The promenade as a neighbour",
    community: "Dubai Marina",
    communitySlug: "dubai-marina",
    kind: "rent",
    type: "apartment",
    priceAed: 145000,
    beds: 1,
    baths: 2,
    sqft: 890,
    image: IMAGES.living,
    gallery: [IMAGES.living, IMAGES.marina, IMAGES.kitchen],
    ref: "UL-M-6612",
    description:
      "A bright one-bedroom above the walk — restaurants downstairs, the water across the road. Ideal for a first year in the city, or a pied-à-terre that is actually lived in.",
    amenities: ["Marina Walk", "Furnished", "Pool", "Gym", "Concierge"],
    status: "ready",
  },
  {
    slug: "hills-golf-apartment",
    title: "Golf-view apartment, Dubai Hills",
    subtitle: "Green, not glass",
    community: "Dubai Hills Estate",
    communitySlug: "dubai-hills-estate",
    kind: "rent",
    type: "apartment",
    priceAed: 165000,
    beds: 2,
    baths: 2,
    sqft: 1180,
    image: IMAGES.interior,
    gallery: [IMAGES.interior, IMAGES.house, IMAGES.kitchen],
    ref: "UL-DH-7741",
    description:
      "Unfurnished two-bedroom overlooking the golf. A calmer rental than the marina towers, with the mall and the park both a short drive.",
    amenities: ["Golf view", "Unfurnished", "Community mall", "Park", "Parking ×2"],
    status: "ready",
  },
  {
    slug: "palm-west-beach-apartment",
    title: "West Beach apartment, Palm",
    subtitle: "Sunset side of the trunk",
    community: "Palm Jumeirah",
    communitySlug: "palm-jumeirah",
    kind: "rent",
    type: "apartment",
    priceAed: 420000,
    beds: 3,
    baths: 4,
    sqft: 2100,
    image: IMAGES.palm,
    gallery: [IMAGES.palm, IMAGES.terrace, IMAGES.living, IMAGES.pool],
    featured: true,
    ref: "UL-P-8903",
    description:
      "A three-bedroom on the west of the trunk, furnished to a standard you will not replace. Beach club access, a terrace that takes the evening, and parking that is actually assigned.",
    amenities: ["Beach access", "Furnished", "Sunset terrace", "Gym", "Pool", "Parking ×2"],
    status: "ready",
  },
];

export function formatAed(value: number, kind: ListingKind) {
  const formatted = new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value);
  if (kind === "rent") return `${formatted} / year`;
  return formatted;
}

export function formatAedPlain(value: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value);
}

export function monthlyFor(listing: Listing) {
  if (listing.monthlyAed) return listing.monthlyAed;
  if (listing.kind === "offplan") return Math.round(listing.priceAed / 48);
  return null;
}

export function listingBySlug(slug: string) {
  return LISTINGS.find((l) => l.slug === slug) ?? null;
}

export function communityBySlug(slug: string) {
  return COMMUNITIES.find((c) => c.slug === slug) ?? null;
}

export function listingsFor(kind?: ListingKind, communitySlug?: string) {
  return LISTINGS.filter((l) => {
    if (kind && l.kind !== kind) return false;
    if (communitySlug && l.communitySlug !== communitySlug) return false;
    return true;
  });
}

export function featuredListings() {
  return LISTINGS.filter((l) => l.featured);
}

export function similarListings(listing: Listing, take = 3) {
  return LISTINGS.filter(
    (l) => l.slug !== listing.slug && (l.communitySlug === listing.communitySlug || l.kind === listing.kind)
  ).slice(0, take);
}

export const KIND_META: Record<ListingKind, { title: string; path: string; eyebrow: string; lede: string }> = {
  sale: {
    title: "Residences for sale",
    path: "/buy",
    eyebrow: "Acquire",
    lede: "Villas, penthouses, and apartments released quietly — not poured into a portal.",
  },
  rent: {
    title: "Residences to let",
    path: "/rent",
    eyebrow: "Reside",
    lede: "Annual homes in the city’s better buildings, furnished or left in peace.",
  },
  offplan: {
    title: "Off-plan",
    path: "/off-plan",
    eyebrow: "Forthcoming",
    lede: "Allocations in towers and lagoons still taking shape — payment plans on enquiry.",
  },
};
