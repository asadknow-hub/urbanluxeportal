# UrbanLuxe Portal — Design System Master

Synthesized from UI UX Pro Max catalogs (product, color, typography, style, reasoning) for a Dubai luxury brokerage CRM/ERP. Python CLI was unavailable at generation time.

## Product

- Mix: CRM & Client Management + Real Estate/Property (luxury) + dense ops dashboard
- Audience: agents, managers, accountants, admin (internal, invite-only)
- Stack: Next.js + Tailwind v4 + shadcn/ui + lucide-react

## Style

- Primary: Soft UI Evolution + Swiss/Minimalism (clarity over decoration)
- Dashboard: Bento Box Grid (asymmetric KPI tiles)
- Login/brand: Hero-centric ink panel + restrained gold line, not a color slab
- Motion: 150–250ms opacity/color/elevation; hover lift 1.01–1.02; honor `prefers-reduced-motion`
- Density: dashboard-tight (8–32px)

## Color tokens

| Token | Hex | Role |
|---|---|---|
| Canvas | `#F6F3EE` | Warm paper background |
| Ink | `#14110E` | Text, dark sidebar |
| Gold | `#B0893A` | Primary CTA, active nav |
| On gold | `#14110E` | Text on gold |
| Navy | `#1B2430` | Secondary / charts |
| Card | `#FFFCF8` | Surfaces |
| Muted | `#8A8178` | Meta text |
| Destructive | `#DC2626` | Errors / overdue |

Pipeline/stage colors are **data**, not brand. Do not use emerald + violet as brand.

## Typography

- Display (login, wordmark only): Cinzel
- UI / tables: Geist Sans
- Mono: Geist Mono (IDs, money when needed)

## Anti-patterns

- No emerald + violet brand pairing
- No emoji as icons
- No ALL CAPS UI copy
- No glassmorphism on data tables
- Text contrast 4.5:1; visible focus rings
- No 3D / heavy shadows on CRM surfaces

## Components

- Dark ink sidebar, gold active pill
- Sticky topbar: breadcrumb, search stub, notifications, user
- PageHeader + FilterBar + StatCard + EmptyState
- Primary button = gold with ink text
