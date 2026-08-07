# LEADS MODULE — DEEP SPECIFICATION
## End-to-End Lead System for a Dubai Real Estate CRM (Bitrix24-inspired)

> **Audience:** AI coding agent (Devin / GLM 5.2). This document extends `MASTER_CRM_ERP_SPEC.md` and **replaces its §6.2** with a far deeper build. Everything here inherits the master spec's stack (Next.js 15 App Router + TypeScript + Supabase + Vercel), conventions (§3), roles (§4), and design system (§9). Where this file conflicts with the master spec, **this file wins for the Leads module**.
>
> Reference UI: Bitrix24's Deals kanban (colored stage columns with per-column count + money total, Quick Add card at top of first column, view tabs Kanban/List/Activities/Calendar, filter bar with saved filter chips, an "Automation rules" button top-right). We replicate that *shape*, restyled to our design system — we are NOT cloning Bitrix visuals (no background art, light theme per master §9).

---

## 0. The Philosophy (read before coding)

A real estate lead is not a row — it is a **person with money, a deadline, and 10 other agents from competing brokerages calling them**. The entire module is designed around three truths:

1. **Speed-to-first-touch wins deals.** Research consistently shows contacting a lead in the first minutes multiplies conversion. So the system is built around SLA timers, instant notifications, and a "pool" that reclaims neglected leads and re-circulates them (§7).
2. **Every lead has a requirement, not just contact info.** Budget, purpose (buy/rent/off-plan), communities, beds, urgency, financing. The requirement is what lets us match properties and personalize follow-ups (§4.4).
3. **Configuration drives everything.** Stages, sources, custom fields, document requirements, and routing rules are *data*, not code. Admins change them in `/settings/leads` without a deploy. Every hardcoded list in this module is a bug (§8–§11).

---

## 1. Information Architecture & Navigation

Sidebar gets a **Leads** group (replacing the single item):

```
Leads
 ├── Board            /leads              (kanban, default view)
 ├── All Leads        /leads/list         (table view, same data)
 ├── Follow-ups       /leads/followups    (today/overdue task-style view)
 ├── Campaigns        /leads/campaigns
 ├── Imports          /leads/imports      (CSV import wizard + history)
 └── Lead Settings    /settings/leads     (admin/manager only — the configuration hub)
```

`/settings/leads` is a tabbed page: **Sources · Stages · Custom Fields · Routing & SLA · Documents · Scoring · Junk Rules**. Each tab is specified in §8–§11.

Deep-link rule: every lead has a canonical URL `/leads/[id]`. The kanban opens it as an **intercepted route** (Next.js parallel + intercepting routes): clicking a card opens a full-height slide-over on top of the board (board stays mounted, no refetch); a hard refresh or shared link renders the same content as a standalone full page. This is the single biggest "feels instant" trick in the module — build it exactly this way.

---

## 2. Kanban Board (`/leads`)

### 2.1 Layout (mirror the Bitrix reference, restyled)
- **Header row:** page title "Leads", primary green **+ Create** split-button (Create Lead / Quick Lead / Import CSV), pipeline selector (Phase 2 of this module — single pipeline first, selector hidden until >1 exists), search input, saved-filter chips, view tabs (Kanban · List · Follow-ups · Calendar), and right-aligned **Automation rules** button (deep-links to `/settings/leads?tab=routing`).
- **Columns:** one per active stage from `lead_stages` config (§9), in `sort_order`. Column header = stage color bar with name + count; directly under it a **money pill** showing the sum of `budget_max` (fallback `budget_min`) of leads in that column, formatted `AED 4.2M` (compact). Both values come from one aggregated query, not from summing loaded cards (§14.4).
- **First column extras:** "+ Quick Lead" inline card (name + phone only, submits on Enter, creates with defaults, appears optimistically at top).
- **Cards** show: name (bold), phone with WhatsApp icon (wa.me deep link, `stopPropagation` so it doesn't open the lead), interest badge (Buy/Rent/Off-plan color-coded), budget range compact (`800K–1.2M`), source icon (website/whatsapp/meta/tiktok/google/referral/walk-in/import/manual — icon map in `/lib/source-icons.ts`), assignee avatar (or amber "Unassigned" chip), **SLA ring**: a small colored dot — green = touched within SLA, amber = first-response timer past 50%, red = SLA breached (computed client-side from `first_response_due_at`, ticks every 30s), days-in-stage chip when > stage's `stale_after_days`, and a paperclip+count if documents exist.
- **Drag & drop:** `@dnd-kit` — optimistic move, server action persists `stage_id` + writes `lead_events`, toast+revert on failure. Dropping into a stage with `required_fields` unmet (§9) opens a small dialog asking only for the missing fields ("To move to *Viewing Scheduled*, set: Viewing date"). Dropping into **Lost/Junk** requires reason (select from configured reasons + optional note).
- **Column paging:** load 30 cards/column initially, "Load more" at column bottom (keyset pagination §14.3). Never fetch the whole table for the board.
- **Realtime:** subscribe to Supabase Realtime on `leads` (INSERT/UPDATE); patch cards in place. Two agents watching the board see moves within ~1s. Debounce bursts (100ms) to avoid layout thrash.

### 2.2 Filters & saved views
Filter drawer: stage(s), source(s), campaign, assignee (multi), interest, budget range, community, created date range, SLA breached (bool), has upcoming viewing, unassigned only, score range, tag(s). Filters serialize to URL search params (shareable). "Save current filter" stores `{name, params}` per user in `saved_filters` table; chips render like Bitrix's "Deals in progress" chip with an ✕.

### 2.3 List view (`/leads/list`)
TanStack Table, server-paginated (50/row pages), same filter engine (shared `parseLeadFilters()` helper → one SQL builder used by board, list, and exports). Columns configurable per user (show/hide, order → persisted in `user_preferences.lead_list_columns jsonb`). Custom fields marked `show_in_list` (§10) appear as columns. Bulk actions on checkbox selection: Assign to…, Change stage, Add tag, Export CSV, Mark Junk. Bulk actions run in one server action with a single `UPDATE ... WHERE id = ANY($1)`.

### 2.4 Follow-ups view (`/leads/followups`)
Task-style triage list grouped **Overdue / Today / Tomorrow / This week**, driven by `next_follow_up_at` + scheduled viewings. Each row: lead, action chip (Call / WhatsApp / Viewing), snooze menu (1h/3h/tomorrow 10am), Done button (logs an activity + prompts "set next follow-up?" — never let a lead leave without a next step; if the agent declines, auto-set +3 days and note it).

### 2.5 Calendar view
Month/week grid of viewings + follow-ups (read-only events, click → lead slide-over). Use a lightweight custom grid, not a heavy calendar lib.

---

## 3. Lead Lifecycle — Default Stage Roadmap (seeded, admin-editable)

Seed `lead_stages` with the real-estate journey below. These are DATA (§9), not enums — the enum `lead_status` from the master spec is dropped in favor of `stage_id` + a fixed `stage_kind` discriminator (`open | won | lost | junk`) so reporting stays stable while names/colors/order are editable.

| # | Stage | Kind | Color | Purpose / exit criteria | Required to enter | SLA |
|---|---|---|---|---|---|---|
| 1 | **New** | open | blue | Untouched. Exit = any logged contact attempt | — | First response: 15 min (configurable/source) |
| 2 | **Contacted** | open | cyan | Spoke or messaged; qualifying | activity of type call/whatsapp/email logged (auto-checked) | Next touch ≤ 24h |
| 3 | **Qualified** | open | teal | Requirement captured; genuine intent | budget_min OR budget_max, interest, ≥1 preferred community | — |
| 4 | **Viewing Scheduled** | open | purple | Viewing booked | viewing datetime + property link | Reminder T-3h |
| 5 | **Viewing Done / Offer** | open | indigo | Attended; negotiating | viewing outcome logged | Follow-up ≤ 24h |
| 6 | **Converted** | won | green | Handed to Deal (master spec pipeline) | auto via Convert flow only — cannot drag here | — |
| 7 | **Lost** | lost | slate | Genuine lead, didn't proceed | lost_reason | — |
| 8 | **Junk** | junk | gray | Spam/wrong number/duplicate | junk_reason | excluded from all conversion metrics |

**No-show handling:** a viewing has `outcome: attended | no_show | cancelled`. On `no_show`, lead stays in *Viewing Scheduled*, gets an automatic `no_show_count += 1`, a red "No-show ×n" chip on the card, and a task "Reschedule or requalify" for the agent; 2+ no-shows → routing engine may notify the manager (default rule seeded). This mirrors how brokerages actually chase flaky viewers.

**Convert flow** (button on lead page, enabled from Qualified onward): dialog creating `customers` (prefilled, dedupe-checked) + `deals` (title auto "{interest} — {name}", value from budget, property prefilled if a viewing property exists) → lead `stage → Converted`, links stored both ways, slide-over swaps to a success panel with "Open deal →". Idempotent: converting twice is impossible (guard on `converted_deal_id IS NULL`).

---

## 4. Lead Detail Page (`/leads/[id]`) — the heart of the module

Full-height slide-over from the board (intercepted route) / standalone page on direct load. Three-zone layout: **left rail (identity & requirement) · center (timeline & work) · right rail (context & insights)**. On mobile: stacked with sticky action bar.

### 4.1 Header (always visible, sticky)
Name + score chip (0–100, colored) + stage pill (click = dropdown to move stage, same required-field guards as drag) + SLA dot. Action buttons: **Call** (tel:), **WhatsApp** (wa.me with a pre-filled template picker — templates from `email_templates` table extended with `channel: whatsapp`), **Email**, **Log activity**, **Schedule viewing**, **Convert**, kebab (Assign, Add tag, Merge duplicate, Mark Junk, Delete[admin]). Every outbound action ALSO logs an activity automatically.

### 4.2 Left rail — Identity & Requirement
- **Contact block:** name, phones (multiple, E.164, primary star), email, nationality, language preference (drives routing §7), how they heard of us.
- **Requirement block (real-estate core):** interest (buy/rent/off-plan/commercial/sell — *sell/landlord leads flip the copy*: instead of budget → expected price; instead of preferred areas → property location), budget min/max (AED, compact inputs), preferred communities (multi-select tag input backed by a `communities` reference table seeded with ~60 Dubai communities — Dubai Marina, JVC, Downtown, Business Bay, Palm Jumeirah, Arabian Ranches…), bedrooms (studio–7+), property category, move-in / purchase timeframe (ASAP / 1–3m / 3–6m / exploring), financing (cash / mortgage / undecided; mortgage → pre-approved? bool), purpose (end-use / investment).
- **Custom fields section:** renders every active `custom_field_defs` for entity `lead` (§10) in configured order/groups. This section is 100% config-driven — zero hardcoded fields here.
- **Source block:** source, campaign (link), UTM params (collapsed), original form payload (collapsed JSON viewer for website leads), created date, first-response time (actual, once responded).

### 4.3 Center — Timeline & Work (tabs)
- **Timeline (default):** unified reverse-chron feed from `lead_events` + `lead_activities`: stage moves, assignments, calls (with duration + outcome select: answered/no answer/busy/wrong number), WhatsApp/email logs, notes (rich-ish text: bold/italic/lists only), viewings with outcomes, document uploads, automation actions ("System: reassigned to pool — SLA breach"), AI actions. Composer at top: segmented control [Note · Call · WhatsApp · Email · Meeting] + text + optional datetime (backdating allowed, flagged). @mention a teammate → notifies them. Timeline paginates (20/pg, keyset) — never load 500 events at once.
- **Viewings tab:** list + "Schedule viewing" (property picker searching `properties` by community/beds/price fit, datetime, agent, note). Creates notification + calendar entry + optional WhatsApp confirmation draft to the client (§AI). Outcome capture UI appears automatically once the time passes.
- **Documents tab:** §11 — checklist-driven.
- **Tasks tab:** simple per-lead todos (title, due, assignee) feeding the Follow-ups view.

### 4.4 Right rail — Context & Insights
- **Matched properties (killer feature):** top 6 available properties scored by requirement fit (same community +40, beds exact +20/±1 +10, price within budget +30 / within 10% +15, purpose match required). Pure SQL scoring view — no AI needed. Each: thumbnail, ref, price, "Send on WhatsApp" (drafts a message with property details + placeholder for brochure link) and "Schedule viewing" shortcuts. Refreshes when requirement changes.
- **AI insight panel** (master spec §8.2/8.3 surfaces here): score + reason, suggested next action, "Draft follow-up" button.
- **Duplicates panel:** possible duplicates by normalized phone/email (§12) with Merge button.
- **Related:** converted customer/deal links, campaign, assignment history (who held this lead and for how long — full audit from `lead_assignments`).

---

## 5. Lead Capture — Sources & the Configuration Hub (`/settings/leads?tab=sources`)

The Sources tab lists all capture channels as cards with an enabled toggle, a status line (e.g. "Webhook live · last lead 2h ago"), and a Configure button. Every captured lead, regardless of channel, funnels through **one server-side function**: `ingestLead(payload, source_ctx)` → normalize → dedupe-check (§12) → create lead → route/assign (§7) → notify → log `lead_events(kind:'ingested')`. Never write channel-specific insert logic twice.

### 5.1 Website forms (build fully)
- **Form definitions:** admin creates named forms ("Homepage Contact", "Palm Landing Page"). Each form = selected fields (from base + custom fields, mark required), success message/redirect URL, target campaign (optional), hidden defaults (e.g. interest=off_plan), and a generated **public token**.
- **Two integration modes, both generated on the config page with copy buttons:**
  1. **POST endpoint:** `POST /api/ingest/form/{token}` — JSON or form-encoded. Shown with a ready cURL example and the exact field names. For the client's web developer.
  2. **Embed snippet:** a ~3 KB vanilla-JS script tag that renders the form styled minimally, posts to the same endpoint, handles success state. (Iframe fallback link too.)
- **Protection:** per-token rate limit (10/min/IP, sliding window in a `rate_limits` table or Upstash — AGENT DISCRETION), honeypot field, optional Cloudflare Turnstile site key field in config, payload size cap 20 KB, server-side Zod validation against the form definition, junk rules (§9) applied at ingest.
- Raw submission stored in `form_submissions` (immutable) with a FK from the created lead — so nothing is ever lost even if mapping fails; failed mappings land in an "Unprocessed" list on the Imports page with a "fix & re-process" flow.
- **UTM capture:** the embed script forwards `utm_source/medium/campaign/term/content` + `page_url` + `referrer`; endpoint accepts them; auto-links to a Campaign when `utm_campaign` matches a campaign's tracking code (§6).

### 5.2 WhatsApp (pragmatic MVP — no WABA API)
Full WhatsApp Business API is **out of scope** (master §12) but the design must not paint us into a corner:
- **Click-to-chat generator:** config page generates `wa.me/<company number>?text=<prefilled>` links per campaign/property with a tracking code embedded in the prefilled text ("Hi! I'm interested in [PALM-CAMP-07]…"). Marketing puts these on Instagram bios, QR codes on signboards, etc.
- **One-tap logging:** a global "+ WhatsApp Lead" quick action (sidebar button + board header) opening a 5-field sheet: phone (paste from WhatsApp), name, interest, community, campaign/tracking code. 10 seconds to log while chatting. This is the honest MVP for WhatsApp.
- **Forward-compatible:** `lead_sources.kind = 'whatsapp'` and `leads.external_ref text` (WA message id later); an `POST /api/ingest/whatsapp` webhook route is stubbed (validates a shared secret, maps a documented JSON shape through `ingestLead`) so a WABA provider (360dialog/Twilio) can be wired later without schema change.

### 5.3 Social & ad platforms (webhook-first)
- **Generic webhook per source:** config creates a source of kind `meta | tiktok | google | other_webhook`, generating `POST /api/ingest/webhook/{token}` + shared-secret header. Documented JSON contract (name, phone, email, fields{}, campaign_code). This works TODAY with Zapier/Make/n8n bridging Meta Lead Ads → our webhook — write that in the config page's help text with a 4-step Make.com recipe.
- **Native Meta Lead Ads integration** (verify token + page subscription + form field mapping UI) is **Phase L4** — spec the mapping table now (`source_field → lead_field/custom_field`), build later.
- Every webhook source shows: last 10 received payloads (raw, for debugging), success/fail counts, and a "send test payload" button.

### 5.4 Manual import (`/leads/imports`)
CSV wizard, 4 steps: **Upload** (drag-drop, ≤5k rows, parse client-side with PapaParse) → **Map columns** (auto-match by header name; map to base + custom fields; unmapped columns can be dumped into a note or a chosen text custom field; save mapping as a template per source) → **Preview & validate** (first 50 rows rendered, per-row errors — bad phone, missing name; duplicate column shows match type: "phone matches existing lead #…" with per-row action New/Skip/Update) → **Import** (server action processes in batches of 200 inside a transaction per batch; progress bar via polling an `import_batches` row; result: created/updated/skipped/failed with downloadable error CSV). Every imported lead: `source = import`, `import_batch_id` set, routing rules applied with a config toggle "assign imported leads via routing? (default: leave unassigned in pool)".

### 5.5 Manual & walk-in
Standard "+ Create" full form (all base + custom fields, everything optional except name+phone) and the Quick Lead card (§2.1). Source auto = `manual` / selectable `walk_in`, `referral` (referral shows "referred by" contact picker).

---

## 6. Campaigns (`/leads/campaigns`)

A campaign is anything marketing spends money or effort on: a Meta ad set, a Google campaign, a signboard QR, an open-house event, a WhatsApp blast.

- Fields: name, channel (meta/google/tiktok/whatsapp/email/outdoor/event/portal/other), **tracking_code** (short unique slug, auto e.g. `PALM-07`, used in UTMs, wa.me prefills, and webhook payloads), budget (AED), spend_to_date (manual entry — no ad-platform cost APIs), start/end dates, target (interest/community), status (draft/active/paused/ended), notes.
- Detail page: KPI strip — leads captured, qualified %, viewings, conversions, **CPL** (spend ÷ leads), **cost per qualified**, revenue attributed (sum of won deal commissions from converted leads), simple ROI; leads-over-time sparkline; table of its leads (links into filtered board).
- Attribution: first-touch only for MVP — `leads.campaign_id` set at ingest via tracking code / UTM match / manual pick; changing it later requires manager role and logs an event.
- Board & list can filter/group by campaign; the Sources config page cross-links here.

---

## 7. Routing, Assignment & Circulation Engine (`/settings/leads?tab=routing`)

This is where the module earns its keep. Model: **pool + rules + SLA reclaim** (the "shark tank" pattern — Bitrix/close-style).

### 7.1 Concepts
- **Pool:** unassigned leads visible (per master §4) to all agents; any agent can hit **Claim** (first click wins — enforced with a conditional update `WHERE assigned_to IS NULL`, loser gets a "already claimed by Sara" toast).
- **Assignment:** exactly one owner (`assigned_to`). Full history in `lead_assignments` (lead_id, from_user, to_user, reason: manual|rule|round_robin|claim|sla_reclaim|redistribute, at). The lead page shows this trail.
- **Routing rules (ordered list, first match wins):** condition rows over source, campaign, interest, budget range, community, language, day/time window → action: assign to specific agent | round-robin within a **team** (named agent group with member list + per-agent daily cap) | leave in pool. Ships with one seeded rule: "everything → round-robin: All Agents, cap 15/day". UI = simple rows, NOT a visual flow builder.
- **Round-robin details:** rotation pointer per team stored in DB (`teams.rr_cursor`), skips inactive/at-cap/off-hours agents (working hours per profile, default 9–18 Asia/Dubai), wraps; if nobody eligible → pool + notify manager.

### 7.2 SLA & circulation (the anti-lethargy machine for humans)
Configurable per source (defaults in parentheses):
- **First-response SLA** (15 min web/whatsapp/social, 24h import/manual): timer starts at assignment. Card dot amber at 50%, red past due. At breach: notify agent + manager. At **breach × 2** (30 min): **auto-reclaim** — lead returns to pool (or next round-robin agent — config choice), reason logged, both notified. Nothing burns a hot lead like sitting in a napper's queue.
- **Stale-lead rotation:** open lead with no activity for N days (default 5) → nudge agent; at N+2 → manager digest "12 stale leads" with one-click Redistribute (bulk round-robin among team, excluding current holder).
- **Vacation/deactivation:** deactivating a user or toggling "away" in their profile prompts "Redistribute their open leads?" (bulk action, logged).
- Implementation: one scheduled sweep every 5 min (Vercel cron `/api/cron/lead-sla`) doing set-based SQL updates (no per-lead loops), plus event-driven checks inside relevant server actions. All reclaim actions create `lead_events` + notifications.

---

## 8–9. Stage Configuration (`?tab=stages`)

CRUD over `lead_stages`: name, color (from a fixed 12-color palette), `kind` (open/won/lost/junk — won/lost/junk are singletons, undeletable, rename-only), sort order (drag), `stale_after_days`, **required fields to enter** (multi-select over base + custom fields + special requirements `viewing_scheduled`, `activity_logged`), and per-stage checklist text (shown as helper on the column header ⓘ). Deleting a stage with leads → dialog forces choosing a migration target stage. Stage changes are versioned in `lead_events` so history remains readable after renames (store stage name snapshot in the event).

Also on this tab: **Lost reasons** and **Junk reasons** managed lists (seed: price, chose competitor, financing failed, unresponsive, postponed / spam, wrong number, duplicate, agent test).

**Junk rules (auto):** simple admin toggles — auto-junk if phone invalid after normalization; if email domain in blocklist (editable); if honeypot tripped (never even created — counted on source stats); if same phone submitted >3 forms in 24h → flag "possible spam" tag instead of junk.

---

## 10. Custom Fields (`?tab=custom-fields`) — config-driven, zero-migration

- `custom_field_defs`: entity (`lead` now; built generic for reuse), key (slug, immutable), label, type (`text | textarea | number | money | select | multiselect | date | checkbox | phone | url`), options jsonb (for selects, each {value,label,color?}), required bool, `show_on_card` (kanban card chip — max 2 enforced), `show_in_list`, group/section name, sort, active.
- Values live in **`leads.custom jsonb NOT NULL DEFAULT '{}'`** — one column, no EAV table (§14 explains why + indexing). Server actions validate values against defs with a dynamically built Zod schema (`buildCustomSchema(defs)` — write once in `/lib/custom-fields.ts`, reuse in forms, imports, ingest endpoints).
- Renderer component `<CustomFieldsForm defs values onChange/>` used identically in: lead page, create form, import mapping, web-form builder, filters (select/number/date customs are filterable — map to jsonb operators).
- Deactivating a field hides it but preserves data; reactivating restores. Changing type is forbidden (create a new field).
- Seed 3 examples so the client sees the pattern: "Visa status" (select), "Referred by" (text), "Pre-approval amount" (money).

---

## 11. Documents on Leads (`?tab=documents`) — checklist + pairs

Real-estate KYC comes in **pairs and sets** (Emirates ID front & back; passport photo page & visa page; cheque copy & signed booking form). Model this explicitly:

- `lead_doc_requirements` (config): name ("Emirates ID"), **slots** jsonb — ordered list like `[{key:'front',label:'Front side'},{key:'back',label:'Back side'}]` (a single-slot requirement is just one slot), applies_when (always | interest in [...] | stage ≥ X), required bool, allow file types, max size.
- Lead **Documents tab** renders a **checklist**: each requirement as a card with its slots as labeled drop-zones; empty slot = dashed box, filled = thumbnail + filename + uploaded-by/at + view (signed URL) + replace + soft-delete. A requirement turns green only when ALL its slots are filled. Progress chip "KYC 2/4" appears in the lead header and (if any requirement is `required`) as a paperclip badge on the kanban card.
- Extra ad-hoc uploads allowed under an "Other documents" section (goes to master `documents` table with entity_type='lead', category picker).
- Storage path `leads/{lead_id}/{requirement_key}/{slot}-{uuid}.{ext}`, private bucket, signed URLs (60 min), client-side image compression (per master §6.5), 20 MB cap.
- AI hook: the master spec's §8.1 "Scan with AI" button appears per uploaded ID/passport slot; on a lead it offers "Apply name / nationality / ID number to this lead".
- On **Convert**, all lead documents re-link (copy rows, same storage objects) to the created customer so KYC never gets re-uploaded.
- Seed requirements: Emirates ID (front/back, buyers & tenants), Passport (photo page + visa, required for rentals), Proof of funds / pre-approval (single slot, when financing=mortgage or budget > 3M), Signed booking form (single, stage ≥ Viewing Done).

---

## 12. Duplicates & Merge

- **Normalization at ingest:** phones → E.164 (strip spaces/dashes, `0091…`/`0…` UAE heuristics: leading 0 + 9 digits → +971), emails lowercased. Store normalized in generated columns `phone_norm`, `email_norm` (indexed).
- **Detection:** on create/ingest — exact `phone_norm` or `email_norm` match against leads AND customers. Website/webhook ingest with a match does NOT create a new lead: it appends a `lead_events(kind:'reinquiry')` + activity ("Submitted Palm form again") on the existing lead, bumps it (updates `last_inquiry_at`, notifies owner) — re-inquiries are buying signals, not duplicates. Manual/import creates show the non-blocking warning (per master) with per-row choice.
- **Merge UI:** from duplicates panel — side-by-side field diff, radio-pick per conflicting field, activities/documents/events union, loser soft-deleted with `merged_into_id`, redirect from old URL. Manager+ only. One transaction.

---

## 13. Insights & Analytics

- **Per-lead:** header shows response-time badge and touch count; right rail (§4.4).
- **Module dashboard (`/leads` header "Insights" popover + full block on Reports):** new leads this week vs last (sparkline), avg first-response time by agent (the accountability chart — minutes, colored vs SLA), funnel (stage → stage conversion %), source & campaign leaderboard (leads → qualified% → conversions → CPL), lost-reason breakdown, pool health (unassigned count + oldest age).
- All from `/server/metrics.ts` additions; every number clickable → filtered list view.

---

## 14. PERFORMANCE — how this stays instant (mandatory engineering practices)

Target feel: board paints < 1s, card click → slide-over content < 300ms, search-as-you-type < 150ms/keystroke. Techniques, in priority order:

### 14.1 Rendering architecture
1. **Server Components + streaming:** the board route is an RSC that kicks off ALL queries in parallel (`Promise.all`: stages, first page per column, column aggregates, saved filters) and streams with `<Suspense>` boundaries per region — header paints immediately, columns hydrate as data lands. No client-side "fetch on mount" waterfalls anywhere in this module.
2. **Intercepted-route slide-over (§1):** board never unmounts or refetches when opening a lead. Back = instant.
3. **Hover prefetch:** on card `onMouseEnter`, `router.prefetch('/leads/'+id)` AND fire the lead-detail query into TanStack Query cache (`staleTime: 30s`). By click time, data is usually already local → the 300ms target is really ~0ms.
4. **Optimistic everything:** drag-drop, quick-lead create, note post, assign, snooze — update UI first, reconcile on server response, revert+toast on error. Users must never wait for the network to see their own action.
5. **Virtualize long lists:** list view + timeline use `@tanstack/react-virtual` beyond 100 rendered rows. Kanban columns don't need it at 30/page.
6. **Memoized cards:** `LeadCard` is `memo()` with a stable, minimal prop object; realtime patches update only the changed card via normalized client cache (Map keyed by id), not the whole column array.

### 14.2 Database — indexes (write these in the migration, verbatim)
```sql
create index leads_board_idx        on leads (stage_id, updated_at desc, id desc) where deleted_at is null;
create index leads_assignee_idx    on leads (assigned_to, stage_id) where deleted_at is null;
create index leads_pool_idx        on leads (created_at desc) where assigned_to is null and deleted_at is null;
create index leads_phone_norm_idx  on leads (phone_norm);
create index leads_email_norm_idx  on leads (email_norm);
create index leads_followup_idx    on leads (next_follow_up_at) where deleted_at is null and next_follow_up_at is not null;
create index leads_sla_idx         on leads (first_response_due_at) where first_responded_at is null and deleted_at is null;
create index leads_campaign_idx    on leads (campaign_id);
create index lead_events_lead_idx  on lead_events (lead_id, id desc);
create index leads_custom_gin      on leads using gin (custom jsonb_path_ops);
-- fuzzy search:
create extension if not exists pg_trgm;
create index leads_search_trgm on leads using gin ((name || ' ' || coalesce(email,'') || ' ' || coalesce(phone,'')) gin_trgm_ops);
```
Partial indexes (the `where` clauses) keep them tiny and hot. EVERY new query pattern gets an `explain analyze` check in dev — add a `npm run db:explain` helper script.

### 14.3 Query discipline
- **Keyset pagination everywhere** (`where (updated_at, id) < ($cursor_ts, $cursor_id) order by updated_at desc, id desc limit 30`) — never `OFFSET`, which degrades linearly.
- **No N+1:** board page = exactly 3 queries (stages+aggregates; cards for all columns in ONE query with `row_number() over (partition by stage_id order by updated_at desc) <= 30`; current user prefs). Lead page = 2 (lead with joins via a view; first timeline page). Enforce by code review comment budget at top of each server file: `-- QUERY BUDGET: 3`.
- **Select only needed columns** for cards (id, name, phone, stage_id, budget, interest, source, assigned_to, sla fields, custom→ the ≤2 `show_on_card` keys via `custom->'key'`). Full row only on the detail page.
- **Counts without COUNT(*) pain:** column counts/sums come from one `select stage_id, count(*), sum(coalesce(budget_max,budget_min,0)) from leads where deleted_at is null group by stage_id` — fine at SME scale (<100k rows) thanks to the partial index; do NOT build materialized counters until this measurably slows (leave a comment saying exactly that).
- **Search:** debounce 250ms client-side; trigram index above makes `ilike '%term%'` fast; short-circuit queries under 2 chars.

### 14.4 Caching & transport
- Supabase client per-request in RSC (no global fetch cache for authed data); TanStack Query on the client with `staleTime` 30s for lists, 5m for config (stages, custom fields, sources — these change rarely; bust via `revalidateTag('lead-config')` on any settings save).
- Config tables (stages, custom_field_defs, doc requirements, routing rules) are read on EVERY board paint → cache them with Next `unstable_cache` tagged `lead-config`, 5-min TTL. This alone removes 4 queries/request.
- Use Supabase **Supavisor pooled connection string** (port 6543) — serverless functions exhaust direct connections otherwise; this is the #1 cause of "random slow requests" on Vercel+Supabase.
- Keep Vercel function region = `fra1` or closest-to-Supabase region; set Supabase project region Frankfurt (closest stable to Dubai). Same-region app↔DB matters more than anything client-side.
- Ship `next/image` for thumbnails with proper `sizes`; property/lead lists request 96px thumbs, not originals.

### 14.5 Realtime & background
- One Realtime channel for `leads` scoped by RLS; patch cache in place (§14.1.6). Fall back to 60s polling if the socket drops (silent).
- All heavy work (import batches, SLA sweep, webhook ingest fan-out) is server-side + set-based; UI polls a status row. Nothing heavy ever runs in a user's request path.

---

## 15. Data Model Additions (migration order after master spec tables)

```sql
-- reference
communities (id, name unique, area_group text);          -- seeded ~60 Dubai communities
teams (id, name, rr_cursor int default 0);
team_members (team_id, user_id, daily_cap int default 15, primary key(team_id,user_id));

-- config
lead_stages (id, name, color, kind stage_kind, sort int, stale_after_days int,
             required_fields jsonb default '[]', helper_text text, is_active bool);
lead_sources (id, kind source_kind, -- website_form|whatsapp|meta|tiktok|google|other_webhook|import|manual|walk_in|referral
              name, token uuid unique, secret text, config jsonb, is_active bool,
              stats jsonb default '{}');                 -- rolling counters: received, junked, last_at
web_forms (id, source_id fk, name, fields jsonb, hidden_defaults jsonb, campaign_id fk null,
           success_message text, redirect_url text, turnstile_key text);
custom_field_defs (id, entity text, key text, label, type text, options jsonb,
                   required bool, show_on_card bool, show_in_list bool,
                   group_name text, sort int, is_active bool, unique(entity,key));
lead_doc_requirements (id, name, slots jsonb, applies_when jsonb, required bool,
                       allowed_types text[], max_mb int, sort int, is_active bool);
routing_rules (id, sort int, conditions jsonb, action jsonb, is_active bool);
lost_reasons (id, kind text check (kind in ('lost','junk')), label, sort, is_active);

-- runtime
leads: MODIFY — drop status enum; add stage_id fk, custom jsonb default '{}',
       campaign_id fk null, source_id fk null, external_ref text,
       phone_norm text generated, email_norm text generated,
       language text, financing text, timeframe text, purpose text,
       bedrooms text, category text, no_show_count int default 0,
       first_response_due_at timestamptz, first_responded_at timestamptz,
       last_activity_at timestamptz, last_inquiry_at timestamptz,
       import_batch_id fk null, merged_into_id fk null,
       tags text[] default '{}';
lead_events (id bigint, lead_id fk, kind text, actor_id uuid null,  -- null = system
             payload jsonb, created_at);                 -- stage snapshots, assignment info, etc.
lead_assignments (id, lead_id fk, from_user uuid null, to_user uuid null, reason text, created_at);
lead_viewings (id, lead_id fk, property_id fk, scheduled_at, agent_id, note,
               outcome text null, outcome_note text, reminded_at timestamptz null);
lead_tasks (id, lead_id fk, title, due_at, assignee_id, done_at null);
campaigns (id, name, channel, tracking_code unique, budget bigint, spend bigint,
           starts_on, ends_on, target jsonb, status, notes);
form_submissions (id, source_id fk, raw jsonb, ip inet, lead_id fk null,
                  status text, error text, created_at);  -- immutable
import_batches (id, filename, mapping jsonb, totals jsonb, status, created_by, created_at);
saved_filters (id, user_id, name, params jsonb);
rate_limits (key text pk, window_start timestamptz, count int);
```
RLS mirrors master §4 (agents: own + pool; config tables: read all-authed, write admin/manager). `lead_events` insert-only for everyone, no update/delete policies at all.

---

## 16. Build Order & Acceptance Criteria (module phases)

**L1 — Core board & lead page:** stages config (seeded, read-only UI ok initially), kanban with drag+optimistic+realtime, list view, lead detail (identity/requirement/timeline/notes), quick lead, manual create, claim from pool, convert flow.
✔ AC: create → drag through all stages with guards → convert; two browsers see each other's moves; board paints with seeded 500 leads < 1s locally.

**L2 — Capture:** sources registry, website form endpoint + embed + form_submissions + unprocessed queue, WhatsApp quick-log + click-to-chat generator, generic webhook + test payload, CSV import wizard, dedupe/re-inquiry logic, campaigns + attribution.
✔ AC: cURL to a form token creates a routed lead in < 1s with UTM→campaign link; re-posting same phone bumps existing lead instead of duplicating; 1,000-row CSV imports with a mixed error report.

**L3 — Ops engine:** routing rules UI + engine, teams + round-robin + caps + hours, SLA timers + 5-min sweep + reclaim, follow-ups view + snooze, stale rotation, viewings + reminders + no-show flow, notifications wiring.
✔ AC: breach a 1-min test SLA → lead auto-returns to pool with events + notifications; round-robin skips a capped agent; no-show increments and tasks fire.

**L4 — Config depth & polish:** stage editor full CRUD, custom fields end-to-end (form/card/list/filter/import), doc requirements + checklist + convert re-link, lost/junk reasons, junk rules, merge UI, saved filters, insights block, calendar view, Meta native integration (only if time remains).
✔ AC: admin adds a select custom field + a 2-slot doc requirement with ZERO code changes and both appear everywhere specified; merge unions timelines; KYC chip math correct.

Update `PROGRESS.md` per phase. Do not begin L2 until L1 ACs pass with the seed data.

---

## 17. Out of Scope (this module)
WhatsApp Business API send/receive (stub only), call dialer/VoIP, email inbox sync (log-only), multi-pipeline for leads (single pipeline; selector appears when a second is created — table supports it via `pipeline_id` nullable, add column now, UI later), lead web portal for clients, AI auto-replies, ad-platform spend sync.
