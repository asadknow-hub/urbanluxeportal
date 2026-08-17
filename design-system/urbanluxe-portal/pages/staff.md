# Staff — overrides

## List (`/team`)

- Match `preview.html` layout: Cinzel display title, icon+sparkline stat tiles, bordered toolbar, inset staff tiles.
- Whole staff row is a link to `/team/[id]` (clickable tile). Action menu uses stopPropagation.
- Gold **Invite staff** + outline **RBAC** (permission matrix dialog; Manage users for admins).
- Columns: Staff member · Role & status · Performance (leads/deals/won + win ring) · Actions.
- Role chips: soft tinted pills (admin purple, agent blue, accountant amber). No emerald brand.

## Detail (`/team/[id]`)

Match the Gemini staff-profile HTML mock (not the old horizontal-tab screenshot):

- Do **not** rebuild the app topbar (breadcrumb / search / user already exist).
- Full-width header card: 80px avatar `#1d353a` / `#e0f2fe` initials, 22px name, email + phone, role pill (`admin` = `#ffe5e5`/`#d93838`), Active `#e6f4ea`/`#1e8e3e`.
- Below: ~2fr + 1fr. Left = 220px vertical nav (`#1d353a` white when active, hover `#eae9e1`) + form card. Right = stacked Quick Metrics (36px `#f2f2f7` icon, value, label).
- Nav items: Profile, Documents, Password & Login, Portal Activity, Work Activity. Lucide icons, `cursor-pointer`.
- Profile form: title “Profile Details”, 2-col grid, inputs `#fafafa` / `#e5e5ea` / 10px radius. Account Active toggle `#34c759`. Save: gold `#b58d3d`, white text, RefreshCw icon.
