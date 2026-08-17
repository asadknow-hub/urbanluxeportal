# UrbanLuxe Portal — Design System Master

Generated 2026-08-17 with [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (`--design-system`, variance 4 / motion 3 / density 8). Catalog matches were **recommendations**; live Urban Luxe tokens stay **LOCKED** where they conflict (teal real-estate palette, HubSpot blue + deal green, skeuomorphism, Fira Code).

When building a page: read this file, then `design-system/urbanluxe-portal/pages/<page>.md` if it exists. Page files override Master.

---

## Step 1 — Product analysis

| Field | Decision |
|---|---|
| **Product** | Internal CRM for a Dubai luxury brokerage (leads, deals, customers, staff). ERP modules (properties, invoices, cheques) are parked. |
| **Audience** | Agents, managers, accountants, admin. Invite-only. Work context, all day, desktop-first, tablet ok. |
| **Job** | Fast lead handling, pipeline, follow-ups — not a marketing site. |
| **Style keywords** | Luxury, ink + gold, quiet, dense dashboard, Swiss clarity, soft depth |
| **Stack** | Next.js 16 App Router, Tailwind v4, shadcn/ui, lucide-react, Recharts |
| **Platform** | Desktop web (Vercel). Not native. Skip safe-areas, haptics, bottom-nav. |
| **Dials** | Variance 4 (balanced) · Motion 3 (subtle) · Density 8 (dashboard-tight) |

---

## Catalog matches (engine)

Used, not dumped raw:

| Domain | Query | Kept |
|---|---|---|
| Product | `CRM client management dashboard` | CRM & Client Management → Flat + Minimalism, Soft UI Evolution, Sales Intelligence dashboard |
| Style | `minimal swiss dashboard professional` | Soft UI Evolution (primary) + Swiss Modernism 2.0 / Minimalism (clarity) |
| Color | `luxury gold real estate professional` | Luxury/Premium + E-commerce Luxury (ink + gold). **Rejected** Real Estate/Property teal `#0F766E` |
| Type | luxury real estate vs dashboard | Cinzel for display only. **Rejected** Fira Code for UI; keep Geist Sans for tables |
| Pattern | CRM retry | Enterprise Gateway is for marketing sites — **do not** apply section list to the logged-in app |

Rejected anti-fits: Skeuomorphism, 3D/texture, emerald + violet brand, glassmorphism on tables.

---

## Style

- **Primary:** Soft UI Evolution — soft depth, real contrast, WCAG AA+
- **Structure:** Swiss / Minimalism — 8px grid, one accent (gold), no decoration for its own sake
- **Dashboard:** Bento / executive KPI tiles (few large numbers, not a uniform 8-up)
- **Login:** Hero-centric ink panel + warm paper form (see `pages/login.md`)
- **Motion:** 150–250ms opacity / color / elevation; hover lift 1.01–1.02; `prefers-reduced-motion: reduce` → no translate
- **Density:** 8–32px spacing; table row ~36–40px; sidebar compact

---

## Color tokens — LOCKED (live in `src/app/globals.css`)

Do not replace with catalog teal or CRM blue.

| Token | Hex | Role |
|---|---|---|
| Canvas | `#F6F3EE` | Warm paper background |
| Ink | `#14110E` | Text, dark sidebar |
| Gold | `#B0893A` | Primary CTA, active nav, rings |
| On gold | `#14110E` | Text on gold |
| Navy | `#1B2430` | Secondary / charts |
| Card | `#FFFCF8` | Surfaces |
| Muted | `#8A8178` | Meta text |
| Muted fill | `#EFE8DC` | Chips, accents |
| Border | `#E4D9C8` | Hairlines, inputs |
| Destructive | `#DC2626` | Errors / overdue |

Pipeline / stage / role colors are **data**, not brand. No emerald + violet as brand.

---

## Typography — LOCKED

- **Display** (login wordmark, rare page titles): Cinzel — catalog luxury real-estate pairing
- **UI / tables / forms:** Geist Sans — readable at 13–14px density
- **Mono:** Geist Mono — IDs, fils, timestamps
- **Body size:** 14–16px, line-height 1.5. Do not use body text under 12px.

---

## Effects

- Soft card shadow, not skeuomorphic texture
- Gold hairline or 1px border `#E4D9C8`, not glass blur on data
- Clickable: `cursor-pointer`, visible focus ring (`--ring: #B0893A`)
- Icons: lucide-react SVG only — never emoji as icons

---

## Components

- Dark ink sidebar, gold active pill
- Sticky topbar: breadcrumb, search, notifications, user
- PageHeader + FilterBar + StatCard + EmptyState
- Primary button = gold with ink text
- Destructive = red, never gold

---

## Anti-patterns

- No emerald + violet (or HubSpot blue + deal green) as brand
- No catalog teal `#0F766E` / mint backgrounds
- No emoji as icons
- No ALL CAPS UI copy
- No glassmorphism on data tables
- No 3D / heavy shadows on CRM surfaces
- Text contrast 4.5:1; visible focus rings
- Chips wrap or `+n`; do not clip labels

---

## Pre-delivery checklist

- [ ] Lucide (or SVG) icons, not emoji
- [ ] `cursor-pointer` on clickable elements
- [ ] Hover 150–250ms; reduced-motion honored
- [ ] Light mode contrast 4.5:1
- [ ] Focus rings visible
- [ ] Text/chips reflow at 375 / 768 / 1024 / 1440
- [ ] Tokens from this file / `globals.css`, not raw one-off hex in new components

---

## Page overrides

| Page | File |
|---|---|
| Login | `pages/login.md` |
| Dashboard | `pages/dashboard.md` |
| Leads | `pages/leads.md` |
| Staff | `pages/staff.md` |

Steps 3 (domain searches) and 4 (Next.js / shadcn stack searches) are deferred until UI implementation work.
