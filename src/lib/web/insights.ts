import { IMAGES } from "@/lib/web/listings";

export type InsightArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readMins: number;
  image: string;
  panel: string;
  featured?: boolean;
  body: string[];
};

export const INSIGHT_ARTICLES: InsightArticle[] = [
  {
    slug: "downtown-dubai-demand-this-season",
    title: "Downtown Dubai: where demand is concentrating this season",
    excerpt:
      "Fountain-facing stacks and Opera District residences continue to clear first. Here is how pricing, stock, and buyer profiles are shifting — and what that means if you are viewing this quarter.",
    category: "Market",
    date: "Aug 2026",
    readMins: 6,
    image: IMAGES.downtown,
    panel: "bg-[var(--ul-primary)] text-white",
    featured: true,
    body: [
      "Downtown remains the address buyers name first — but not every stack is clearing at the same pace. Fountain and Opera axes still attract end-users who will pay for the view composition; side-street towers with compromised light are sitting longer unless priced with discipline.",
      "This season we are seeing more cash-and-mortgage hybrids among international buyers, and a sharper filter on service charge relative to size. Residences that photograph well and show clean title paperwork are moving inside two weeks of serious viewing.",
      "If you are viewing Downtown this quarter: prioritise orientation, noise from the boulevard, and whether the seller has already tested an unrealistic ask. We would rather show three calibrated options than ten that waste a morning.",
      "For investors, yield is secondary to liquidity in this pocket. The brief should say how long you intend to hold — that changes which floors and finishes we shortlist.",
    ],
  },
  {
    slug: "villa-sales-reach-new-highs",
    title: "Villa sales reach new highs",
    excerpt:
      "Family compounds in Hills and Emirates Hills are trading with shorter negotiation windows. Why listings that photograph well still win.",
    category: "Sales",
    date: "Aug 2026",
    readMins: 4,
    image: IMAGES.penthouse,
    panel: "bg-[var(--ul-primary)] text-white",
    body: [
      "Villa demand in Dubai Hills and Emirates Hills has compressed negotiation windows. Serious buyers arrive briefed — and they walk if the photography, plot story, or access does not match the asking narrative.",
      "Listings that win share three traits: honest plot photos (not only interiors), clarity on garden and privacy, and a seller who has already decided whether they will move for a clean offer.",
      "We advise owners to fix light issues and declutter before the first private viewing. The market is rewarding readiness, not optimism.",
    ],
  },
  {
    slug: "off-plan-launches-this-quarter",
    title: "Off-plan launches this quarter",
    excerpt:
      "Payment plans, handover timing, and which Creek and South launches are worth a private briefing before the brochure hits portals.",
    category: "Off-plan",
    date: "Jul 2026",
    readMins: 5,
    image: IMAGES.creek,
    panel: "bg-[var(--ul-secondary)] text-white",
    body: [
      "Not every launch deserves a queue. We filter by developer track record, payment plan realism, and whether the community already has living infrastructure — or only a render.",
      "Creek Harbour and selected South launches are drawing investor attention; handover timing and service-charge assumptions matter more than the sales gallery coffee.",
      "Ask for a private briefing before the public brochure cycle. Early allocations are rarely about luck — they are about who already knows the unit mix.",
    ],
  },
  {
    slug: "marina-living-yield-vs-lifestyle",
    title: "Marina living: yield vs lifestyle",
    excerpt:
      "A practical split between investor-grade towers and residences that still feel like homes — plus rent comps that matter.",
    category: "Communities",
    date: "Jul 2026",
    readMins: 5,
    image: IMAGES.marina,
    panel: "bg-[var(--ul-tertiary)] text-[var(--ul-primary)]",
    body: [
      "Dubai Marina still works — but the brief has to choose: yield stack or lifestyle stack. Mixing the two usually disappoints both the tenant and the balance sheet.",
      "Investor-grade towers need clean rent comps, parking reality, and honest noise assessment. Lifestyle buys need light, walkability to the water, and a building that does not feel like a hotel corridor.",
      "We shortlist differently for each path. Tell us which one you are actually funding.",
    ],
  },
  {
    slug: "holding-periods-that-actually-pay",
    title: "Holding periods that actually pay",
    excerpt:
      "Appreciation is not uniform. Three hold scenarios we walk clients through before they stretch for a villa plot.",
    category: "Investment",
    date: "Jun 2026",
    readMins: 7,
    image: IMAGES.hills,
    panel: "bg-[var(--ul-primary)] text-white",
    body: [
      "A five-year hold is not the same product as a ten-year family base. We map three scenarios: opportunistic (under five), core living (five to ten), and legacy (ten+).",
      "Villa plots often look expensive until you price the alternative — upgrading later in a hotter market. Apartments can be more liquid but more sensitive to building reputation.",
      "Before stretching for a plot, decide the exit. That single decision changes leverage, community, and how hard we push on price.",
    ],
  },
  {
    slug: "palm-fronds-what-to-check-before-offer",
    title: "Palm fronds: what to check before offer",
    excerpt:
      "Beach access, plot privacy, and service charges — the diligence list we use on Frond viewings.",
    category: "Buying guide",
    date: "Jun 2026",
    readMins: 6,
    image: IMAGES.palm,
    panel: "bg-[var(--ul-secondary)] text-white",
    body: [
      "On the Palm, the photograph lies less about the water than about privacy and access. Walk the beach line. Check who shares your segment. Confirm service charge against comparable fronds.",
      "We also verify parking practicality, construction adjacency, and whether the seller’s timeline matches a clean SPA.",
      "Offer only after those checks. A beautiful render does not survive a noisy neighbour or an unclear beach right.",
    ],
  },
  {
    slug: "furnished-or-vacant-renters-decision-tree",
    title: "Furnished or vacant: a renter’s decision tree",
    excerpt:
      "When furniture saves time, when it costs yield, and how landlords should price either path.",
    category: "Buying guide",
    date: "May 2026",
    readMins: 4,
    image: IMAGES.interior,
    panel: "bg-[var(--ul-tertiary)] text-[var(--ul-primary)]",
    body: [
      "Furnished wins when the tenant needs keys this month and will not fight taste. Vacant wins when the tenant has a household and the landlord wants a cleaner long let.",
      "Landlords often overprice furnished stock that still looks dated. Price the furniture honestly — or remove it.",
      "For renters: decide speed vs control first. That choice filters half the viewings before we book a single one.",
    ],
  },
];

export function insightBySlug(slug: string) {
  return INSIGHT_ARTICLES.find((a) => a.slug === slug) ?? null;
}

export function featuredInsight() {
  return INSIGHT_ARTICLES.find((a) => a.featured) ?? INSIGHT_ARTICLES[0]!;
}

export function latestInsights(excludeSlug?: string) {
  return INSIGHT_ARTICLES.filter((a) => a.slug !== excludeSlug);
}
