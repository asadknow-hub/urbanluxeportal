# Staff — overrides

## List (`/team`)

- Match `preview.html` layout: Cinzel display title, icon+sparkline stat tiles, bordered toolbar, inset staff tiles.
- Whole staff row is a link to `/team/[id]` (clickable tile). Action menu uses stopPropagation.
- Gold **Invite staff** + outline **RBAC** (permission matrix dialog; Manage users for admins).
- Columns: Staff member · Role & status · Performance (leads/deals/won + win ring) · Actions.
- Role chips: soft tinted pills (admin purple, agent blue, accountant amber). No emerald brand.

## Detail (`/team/[id]`)

Keep the HTML mock **structure** (header card, vertical sections, Quick Metrics). Restyle with Master tokens — not the mock’s teal `#1d353a`, iOS green, or white-on-gold.

- Do **not** rebuild the app topbar.
- Surfaces: `bg-card` + `border-border`. Avatar: ink (`bg-foreground`) + paper initials. Name: Cinzel. Role chips match the list page. Active = gold dot, not mint pill.
- **Bridged tabs:** no gap between the active vertical tab and the panel. Active tab uses the card fill, flush right (`-mr-px`, no right border). First tab shares the panel’s top-left radius and a gold hairline across the join (the redline L). Inner-corner scoops (`box-shadow` in `--card`) on the tab’s trailing edge. Inactive tabs inset (`lg:mr-3`).
- Panel header (“Profile Details”, etc.) sits in that gold-topped bar. Form lives inside the panel — no second floating card.
- Inputs: `bg-muted/40` + `border-border`. Account toggle: gold when on. Save: primary gold with ink text (`Button` default). Lucide, `cursor-pointer`.
