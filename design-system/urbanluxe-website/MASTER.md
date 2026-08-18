# UrbanLuxe Website — Design System Master

Generated 2026-08-18 with UI UX Pro Max (`--design-system`, variance 7 / motion 8 / density 3). Catalog matches were **recommendations**; live Urban Luxe tokens stay **LOCKED** where they conflict (catalog teal `#0F766E`, mint backgrounds, HubSpot blue).

When building a page: read this file, then `design-system/urbanluxe-website/pages/<page>.md` if it exists. Page files override Master.

This is the **public marketing site** (urbanluxe.com). The CRM portal design system lives in `design-system/urbanluxe-portal/` and must not leak into these pages.

---

## Step 1 — Product analysis

| Field | Decision |
|---|---|
| **Product** | Public Dubai luxury brokerage website. Listings are mock for client approval — no property tables yet. |
| **Audience** | UHNW / HNW buyers, tenants, off-plan investors, sellers. First-time Dubai and returning clients. |
| **Job** | Inspire, search, enquire. Not a marketplace dump. Quiet private-office tone (haus & haus / Omniyat), not volume brokerage shouting. |
| **Style keywords** | Cinematic, editorial, ink + gold, spacious, photographic, Awwwards |
| **Stack** | Next.js 16 App Router, Tailwind v4, lucide-react. Public routes in `src/app/(web)/`. |
| **Platform** | Desktop + mobile web. Skip native app rules. |
| **Dials** | Variance 7 · Motion 8 (CSS + IntersectionObserver; no GSAP) · Density 3 (spacious) |

---

## Catalog matches (engine)

| Domain | Query | Kept |
|---|---|---|
| Style | cinematic luxury | Dark cinematic hero + glass nav. Interior pages on warm paper. |
| Color | luxury gold real estate | **Rejected** catalog teal. Use portal-locked ink / gold / paper. |
| Type | Cinzel / Josefin Sans | Display Cinzel. Body Josefin Sans (web only; portal keeps Geist). |
| Landing | Marketplace + Hero/testimonials | Hero search is the CTA. Then communities, featured listings, manifesto, proof, enquire. |
| Motion | Scroll reveal / stagger | Fade-up 400–700ms, expo-out cubic-bezier(0.16,1,0.3,1). Hero Ken Burns one-shot. Reduced-motion: no translate. |
| Anti-fits | Cheap visuals, fast animations, emoji icons, fake award walls |

---

## Color tokens — LOCKED

Paper + ink stay locked. **Public accent is teal** (`#2dd4bf`) — requested for the marketing site. Portal CRM keeps gold.

| Token | Hex | Role |
|---|---|---|
| Paper | `#F6F3EE` | Page canvas |
| Ink | `#14110E` | Text, dark bands, footer |
| Accent | `#2DD4BF` | CTA, rules, focus (was gold) |
| On accent | `#14110E` | Text on teal |
| Navy | `#1B2430` | Secondary dark |
| Card | `#FFFCF8` | Surfaces |
| Muted | `#8A8178` | Meta |
| Hairline | `#E4D9C8` | Borders |
| Cream muted | `#EFE8DC` | Chips |

Hero and footer sit on **ink**, type in paper/gold. Interior sections sit on **paper**.

---

## Typography

- **Display:** Cinzel (`--font-display`) — hero, section titles, property names. Tracking tight. Never all-caps paragraphs.
- **Body / UI:** Josefin Sans (`--font-josefin`) — labels, nav, body. 16–18px body, line-height 1.6.
- **Measure:** long copy max ~38rem.
- Labels: 11px, uppercase, tracking `0.28em`, muted or gold.

---

## Motion

- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Reveals: opacity + 16–24px Y, 500–700ms, stagger ≤ 80ms, max ~8 children
- Hover: image scale 1.04, 600ms; buttons 200ms color
- Hero image: Ken Burns scale 1 → 1.08 over ~22s, **forwards** (not infinite)
- Marquee: pause on `prefers-reduced-motion`
- Content must remain visible without JS (reveal starts visible; JS only animates)

---

## Layout

- Max content: 1440px. Horizontal padding 24 / 40 / 64.
- Section padding 96–128px desktop, 64px mobile.
- One gold hairline as decoration — not boxes of boxes.
- Photography is 90% of the page; copy is scarce and large.

---

## Components

- Transparent nav over hero → paper + ink after scroll
- Gold primary CTA (“Enquire”, “View residences”)
- Property cards: photo-led, price + beds as caption, no clutter
- Sticky WhatsApp dock (Dubai convention) — lucide icon, not emoji
- Enquire form: few fields, inline validation

---

## Anti-patterns

- No catalog teal / mint
- No emoji icons
- No fake “as seen in Forbes” strips
- No infinite decorative bounce
- No hover-only primary actions
- Contrast 4.5:1 on paper and on ink
- Visible focus rings in gold
