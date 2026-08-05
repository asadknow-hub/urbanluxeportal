# MASTER SPEC — Hybrid CRM/ERP for a Dubai Real Estate Company

> **Audience:** This document is written for an AI coding agent (Devin / GLM 5.2). Follow it literally. Where a decision is marked **LOCKED**, do not substitute alternatives. Where marked **AGENT DISCRETION**, choose the simplest option that satisfies the acceptance criteria. If anything is ambiguous, prefer the simpler implementation and leave a `// TODO(owner):` comment rather than inventing scope.

---

## 1. Project Overview

**Client:** A small real estate brokerage/property company in Dubai, UAE (fewer than ~25 staff).
**Goal:** One "master" all-in-one system that replaces spreadsheets and disconnected tools: CRM (leads, customers, pipeline) + light ERP (properties, quotations, invoices, cheques/payments, finance dashboard) + document management + approvals + notifications + a small set of genuinely useful AI features.

**What this is NOT:**
- Not a multi-tenant SaaS. Single company, single database. Do not build tenant isolation, billing, or signup flows.
- Not a public portal. All pages sit behind login except one optional public listing page (Phase 4, out of MVP).
- No AI chatbot widget. (Explicitly excluded — see §8.)

**Success criteria (business):**
1. An agent can go from "new lead" → "deal won" → "invoice issued" → "cheque logged & tracked" without leaving the system.
2. The owner opens the dashboard and sees: pipeline value, revenue this month, overdue invoices, cheques due in the next 30 days, and top agents — in under 3 seconds.
3. Every property, customer, and deal has its documents (Emirates ID, passport, title deed, MOU, tenancy contract) attached and findable in under 10 seconds.

---

## 2. Tech Stack — **LOCKED**

The client deploys on **Vercel** with **Supabase** as the data platform. .NET/Java/Go backends are NOT compatible with this hosting choice — do not propose them. The stack below is fast (edge-rendered, server components), modern, and plays natively with Vercel + Supabase.

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15 (App Router, TypeScript, RSC)** | `create-next-app@latest`, `/src` dir, path alias `@/*` |
| Styling | **Tailwind CSS v4 + shadcn/ui** | All UI components from shadcn; no other component libraries |
| Icons | **lucide-react** | |
| DB | **Supabase Postgres** | Schema via SQL migration files in `/supabase/migrations` |
| Auth | **Supabase Auth** (email+password, invite-only) | No public signup. Admin invites users. |
| Storage | **Supabase Storage** | Buckets: `documents`, `property-media`, `avatars` |
| Server logic | **Next.js Route Handlers + Server Actions** | Use Server Actions for mutations; Route Handlers for webhooks/cron |
| Data fetching | **Server Components first**; TanStack Query only for interactive client tables | |
| Validation | **Zod** on every server action input | |
| Forms | **react-hook-form + zodResolver** | |
| Charts | **Recharts** | |
| Tables | **TanStack Table v8** | Server-side pagination for lists > 200 rows |
| PDF generation | **@react-pdf/renderer** (quotations, invoices, receipts) | Rendered server-side in a route handler |
| Email | **Resend** (transactional) | Env var `RESEND_API_KEY`; fall back to console.log in dev |
| AI | **Anthropic API (`claude-sonnet-4-6`)** via route handlers | Only for the features in §8 |
| Cron | **Vercel Cron** (`vercel.json`) | Daily jobs: cheque reminders, invoice overdue flags |
| Dates/money | **date-fns**, money stored as **integer fils** (1 AED = 100 fils) in DB, formatted `AED 1,250.00` in UI | Never use floats for money |
| Timezone | **Asia/Dubai** everywhere (display); store UTC timestamps | |

**Environment variables** (create `.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only, never exposed to client
ANTHROPIC_API_KEY=                # server-only
RESEND_API_KEY=                   # server-only
APP_BASE_URL=
CRON_SECRET=                      # protects cron route handlers
```

---

## 3. Repository & Coding Conventions (for the agent)

- Monorepo not needed. Single Next.js app.
- Directory layout:
```
/src
  /app
    /(auth)/login
    /(app)/dashboard
    /(app)/leads
    /(app)/customers
    /(app)/pipeline
    /(app)/properties
    /(app)/quotations
    /(app)/invoices
    /(app)/payments        # includes cheque tracker
    /(app)/documents
    /(app)/approvals
    /(app)/reports
    /(app)/settings        # users, roles, company profile, templates, automations
    /api/cron/...
    /api/ai/...
    /api/pdf/...
  /components  (ui/, shared/, module-specific folders)
  /lib         (supabase clients, auth helpers, money.ts, dates.ts, permissions.ts)
  /server      (server actions grouped per module: leads.actions.ts, etc.)
  /types       (generated supabase types + zod schemas)
/supabase/migrations
```
- **Every mutation is a Server Action** that: (1) checks session, (2) checks role permission via `lib/permissions.ts`, (3) validates with Zod, (4) writes, (5) writes an `activity_log` row, (6) revalidates the affected path.
- Generate DB types with `supabase gen types typescript` into `/src/types/database.ts` after every migration.
- All lists: empty state with icon + one-line explanation + primary CTA button.
- Loading: use `loading.tsx` skeletons per route. No spinners on full pages.
- Commit style: `feat(module): ...`, one module per PR/commit series.
- Seed script `/supabase/seed.sql`: 1 admin user, 3 agents, 15 properties, 25 leads across stages, 10 customers, 6 quotations, 8 invoices, 12 cheques (mix of due/overdue/cleared) so every screen renders with data on first run.

---

## 4. Roles & Permissions — **LOCKED**

Four roles, stored in `profiles.role`. Enforce in BOTH the UI (hide controls) and server actions (hard check), AND with Supabase RLS as a final layer.

| Capability | `admin` (owner) | `manager` | `agent` | `accountant` |
|---|---|---|---|---|
| Dashboard (full financials) | ✅ | ✅ | ❌ (own stats only) | ✅ |
| Leads/customers — all records | ✅ | ✅ | own + unassigned | read-only |
| Pipeline — all deals | ✅ | ✅ | own deals | read-only |
| Properties — create/edit | ✅ | ✅ | create, edit own | read-only |
| Quotations — create | ✅ | ✅ | ✅ (needs approval > threshold) | ✅ |
| Invoices — create/void | ✅ | ✅ | ❌ | ✅ |
| Payments & cheques | ✅ | view | ❌ | ✅ |
| Discount/commission approvals | ✅ approve | ✅ approve | request | ❌ |
| Reports | ✅ | ✅ | own only | financial only |
| User management, settings, automations | ✅ | ❌ | ❌ | ❌ |
| Delete anything | ✅ soft-delete only | ❌ | ❌ | ❌ |

Rules:
- **Soft delete only** (`deleted_at` column). No hard deletes anywhere.
- Every table has `created_by uuid`, `created_at`, `updated_at`, `deleted_at`.
- RLS: enable on all tables. Policies keyed off `auth.uid()` → `profiles.role`. Agents can only `select/update` rows where `assigned_to = auth.uid()` OR the record is unassigned (leads pool).

---

## 5. Database Schema (Supabase / Postgres)

Write these as ordered SQL migration files. Types abbreviated; add sensible NOT NULLs and FKs. All money columns are `bigint` (fils). All enums are Postgres enums.

### 5.1 Core / identity
```sql
profiles (
  id uuid PK references auth.users,
  full_name text, email text, phone text,
  role user_role,           -- enum: admin|manager|agent|accountant
  avatar_url text,
  commission_rate numeric,  -- default agent commission %, e.g. 2.0
  is_active boolean default true,
  created_at, updated_at
)

company_settings (          -- single row
  id int PK default 1,
  company_name text, trn text,          -- UAE Tax Registration Number
  rera_orn text,                        -- Office Registration Number
  address text, phone text, email text, logo_url text,
  vat_rate numeric default 5.0,
  quotation_prefix text default 'QT-', invoice_prefix text default 'INV-',
  quotation_approval_threshold bigint default 0,  -- fils; 0 = all need approval? no: 0 = none
  default_currency text default 'AED'
)

activity_log (
  id bigint PK, actor_id uuid, entity_type text, entity_id uuid,
  action text,              -- created|updated|status_changed|deleted|commented|...
  diff jsonb, created_at
)
```

### 5.2 CRM
```sql
leads (
  id uuid PK, name text, phone text, email text,
  source lead_source,       -- enum: website|bayut|property_finder|dubizzle|referral|walk_in|social|other
  interest lead_interest,   -- enum: buy|rent|sell|off_plan|commercial
  budget_min bigint, budget_max bigint,
  preferred_areas text[], notes text,
  status lead_status,       -- enum: new|contacted|qualified|unqualified|converted
  score int,                -- 0-100, AI-assisted (see §8.2), nullable
  score_reason text,
  assigned_to uuid FK profiles, next_follow_up_at timestamptz,
  converted_customer_id uuid, converted_deal_id uuid,
  created_by, created_at, updated_at, deleted_at
)

lead_activities (
  id uuid PK, lead_id uuid FK, type text,  -- call|whatsapp|email|meeting|note
  summary text, occurred_at timestamptz, created_by
)

customers (
  id uuid PK, type customer_type,          -- individual|company
  name text, phone text, email text, nationality text,
  emirates_id text, passport_no text, trn text,   -- trn for companies
  address text, tags text[], notes text,
  assigned_to uuid, created_by, created_at, updated_at, deleted_at
)

deals (
  id uuid PK, title text,
  customer_id uuid FK, property_id uuid FK NULL,
  deal_type deal_type,      -- sale|rental|off_plan
  stage deal_stage,         -- enum: inquiry|viewing|negotiation|offer|contract|won|lost
  value bigint,             -- expected deal value (sale price or annual rent)
  commission_amount bigint, commission_rate numeric,
  assigned_to uuid, expected_close_date date,
  lost_reason text, stage_changed_at timestamptz,
  created_by, created_at, updated_at, deleted_at
)
```

### 5.3 Properties / inventory
```sql
properties (
  id uuid PK, ref_no text unique,          -- auto: PRP-0001
  title text, description text,
  purpose property_purpose,                -- sale|rent
  category property_category,              -- apartment|villa|townhouse|office|retail|warehouse|land|off_plan
  status property_status,                  -- available|reserved|sold|rented|off_market
  community text, building text, unit_no text, city text default 'Dubai',
  bedrooms int, bathrooms int, size_sqft numeric, parking int,
  price bigint,                            -- sale price or annual rent
  service_charge bigint NULL,
  owner_id uuid FK property_owners,
  trakheesi_permit_no text NULL,           -- DLD advertising permit
  dtcm_permit_no text NULL,                -- short-term/holiday-home permit if applicable
  furnishing text, amenities text[],
  assigned_to uuid, featured boolean default false,
  created_by, created_at, updated_at, deleted_at
)

property_owners (
  id uuid PK, name text, phone text, email text,
  emirates_id text, passport_no text, notes text, created_at, updated_at, deleted_at
)

property_media (
  id uuid PK, property_id uuid FK, storage_path text,
  kind text,               -- photo|floorplan|video
  sort_order int, created_at
)
```

### 5.4 Commercial documents & money
```sql
quotations (
  id uuid PK, quote_no text unique,        -- QT-2026-0001, sequential per year
  customer_id uuid FK, deal_id uuid FK NULL,
  status quotation_status,                 -- draft|pending_approval|approved|sent|accepted|rejected|expired
  issue_date date, valid_until date,
  subtotal bigint, discount bigint, vat_amount bigint, total bigint,
  notes text, terms text,
  approval_id uuid FK approvals NULL,
  created_by, created_at, updated_at, deleted_at
)

quotation_items (
  id uuid PK, quotation_id uuid FK, sort_order int,
  description text, qty numeric, unit_price bigint, line_total bigint
)

invoices (
  id uuid PK, invoice_no text unique,      -- INV-2026-0001
  customer_id uuid FK, deal_id uuid FK NULL, quotation_id uuid FK NULL,
  status invoice_status,                   -- draft|sent|partially_paid|paid|overdue|void
  issue_date date, due_date date,
  subtotal bigint, discount bigint, vat_amount bigint, total bigint,
  amount_paid bigint default 0,
  notes text, created_by, created_at, updated_at, deleted_at
)

invoice_items (same shape as quotation_items, FK invoices)

payments (
  id uuid PK, invoice_id uuid FK NULL, customer_id uuid FK,
  method payment_method,                   -- cash|bank_transfer|cheque|card
  amount bigint, received_date date, reference text, notes text,
  cheque_id uuid FK cheques NULL,
  created_by, created_at, updated_at, deleted_at
)

cheques (                                  -- FIRST-CLASS module; PDCs are core to Dubai real estate
  id uuid PK, direction cheque_direction,  -- incoming|outgoing
  customer_id uuid NULL, payee text NULL,
  bank_name text, cheque_no text, amount bigint,
  due_date date,
  status cheque_status,                    -- pending|deposited|cleared|bounced|replaced|cancelled
  invoice_id uuid NULL, deal_id uuid NULL, property_id uuid NULL,
  bounce_reason text NULL, replaced_by_cheque_id uuid NULL,
  notes text, created_by, created_at, updated_at, deleted_at
)

expenses (
  id uuid PK, category text,               -- rent|salaries|marketing|utilities|dld_fees|other
  description text, amount bigint, expense_date date,
  vendor text, payment_method payment_method, receipt_document_id uuid NULL,
  created_by, created_at, updated_at, deleted_at
)
```

### 5.5 Documents, approvals, notifications, automation
```sql
documents (
  id uuid PK, name text, storage_path text, mime_type text, size_bytes bigint,
  category doc_category,   -- emirates_id|passport|visa|title_deed|mou|tenancy_contract|noc|cheque_copy|invoice|receipt|marketing|other
  entity_type text NULL, entity_id uuid NULL,   -- polymorphic link: customer|property|deal|invoice|...
  expiry_date date NULL,                        -- for IDs/permits — drives expiry reminders
  ai_extracted jsonb NULL,                      -- see §8.1
  uploaded_by, created_at, deleted_at
)

approvals (
  id uuid PK, kind approval_kind,          -- quotation_discount|expense|deal_commission|other
  entity_type text, entity_id uuid,
  requested_by uuid, status approval_status,   -- pending|approved|rejected
  amount bigint NULL, reason text,
  decided_by uuid NULL, decided_at timestamptz NULL, decision_note text NULL,
  created_at
)

notifications (
  id uuid PK, user_id uuid FK, title text, body text,
  kind text,               -- cheque_due|invoice_overdue|lead_assigned|approval_request|approval_decided|doc_expiring|followup_due
  entity_type text NULL, entity_id uuid NULL,
  read_at timestamptz NULL, created_at
)

automation_rules (        -- simple, table-driven; NOT a visual workflow builder
  id uuid PK, name text, is_active boolean,
  trigger text,            -- e.g. lead_created|deal_stage_changed|invoice_overdue|cheque_due_in_7d|doc_expiring_30d
  conditions jsonb,        -- e.g. {"source":"bayut"} — keep simple equality matching
  actions jsonb,           -- e.g. [{"type":"notify","role":"manager"},{"type":"assign_round_robin"},{"type":"send_email","template":"followup_1"}]
  created_at, updated_at
)

email_templates (
  id uuid PK, key text unique, subject text, body_html text, updated_at
)
```

**Numbering:** implement `next_doc_number(prefix)` as a Postgres function using a `counters` table with `SELECT ... FOR UPDATE` so quote/invoice numbers never collide.

---

## 6. Module Specifications

Build modules in the phase order of §10. Each module below lists: purpose → key screens → behaviors → acceptance criteria (AC). Screens follow the design system in §9.

### 6.1 Dashboard (`/dashboard`)
Layout mirrors the client's previous portal (four KPI stat cards on top, quick actions row, alert banner, module cards grid, right rail with recent activity + system status).
- **KPI cards:** Total Properties, Active Deals (count + AED pipeline value), Revenue this month (paid invoices), Overdue invoices (count + amount). Agents see only their own numbers.
- **Alert banner (purple, full-width):** "Cheque tracker — X due in 30 days · Y overdue/bounced" → links to `/payments?tab=cheques`.
- **Quick actions:** + Add Lead, + Add Property, + New Quotation.
- **Charts:** Revenue by month (last 12, bar), Pipeline by stage (funnel/bar), Leads by source (donut).
- **Right rail:** last 15 activity_log entries (human sentences: "Sara moved *Marina 2BR — Ahmed* to Contract"), upcoming follow-ups for the current user.
- **AC:** loads via a single server component with parallel queries; renders skeletons; all numbers match reports module exactly (same query helpers in `/server/metrics.ts` — single source of truth).

### 6.2 Lead Management (`/leads`)
- Table (TanStack): name, phone (click-to-WhatsApp `wa.me` link), source badge, interest, budget range, status, score, assigned agent, next follow-up. Filters: status, source, assigned, date range. Search across name/phone/email.
- Detail drawer (not a new page): profile fields, activity timeline (calls/notes with quick-add), documents, AI score panel (§8.2), buttons: **Convert to Customer + Deal**, Mark Unqualified.
- **Convert flow:** one dialog → creates `customers` row (prefilled), optional `deals` row (title auto: "{interest} — {name}"), links back on the lead, status → converted.
- Round-robin auto-assign: if an automation rule with `assign_round_robin` is active, new leads rotate across active agents.
- Duplicate guard: on create, warn if phone or email matches an existing lead/customer (non-blocking).
- **AC:** agent role sees only own + unassigned; converting is idempotent (button disabled after success); every status change logged.

### 6.3 Customer Management (`/customers`)
- Table + detail page (full page, not drawer): overview, deals list, invoices & payment history with balance, cheques, documents (with expiry badges), activity.
- KYC panel: Emirates ID / passport fields + linked ID documents; red badge if ID document expired or missing.
- **AC:** balance shown = sum(invoices.total where not void) − sum(payments.amount); matches accountant reports.

### 6.4 Sales Pipeline (`/pipeline`)
- Kanban board of `deals` by stage (columns: Inquiry → Viewing → Negotiation → Offer → Contract → Won / Lost). Drag-and-drop updates stage (use `@dnd-kit/core`), optimistic UI, server action persists + logs.
- Card: title, customer, property ref, AED value, agent avatar, days-in-stage chip (amber > 14 days, red > 30).
- Moving to **Won** → dialog: confirm value + commission → offers "Create invoice now?" shortcut. Moving to **Lost** → require `lost_reason`.
- Board header: total pipeline AED, weighted value (stage weights: 10/25/40/60/80%), count per column. List-view toggle.
- **AC:** drag persists across refresh; agents can drag only their own deals; Won deals lock value edits for non-admins.

### 6.5 Property / Inventory Management (`/properties`)
- Card grid + table toggle. Card: cover photo, ref no, title, community, beds/baths/sqft, price (AED, formatted), status badge, purpose badge.
- Detail page: gallery (upload to `property-media` bucket, drag-sort), specs, owner card (link to owner), Trakheesi permit field with "missing permit" warning badge if empty while status = available, linked deals, documents (title deed, NOC), activity.
- Status transitions with guardrails: `available → reserved → sold/rented`; reserving asks which deal reserves it; selling/renting requires a linked Won deal (warn, allow admin override).
- Owners sub-page (`/properties/owners`): simple CRUD + their properties.
- **AC:** ref_no auto-generates; images compressed client-side before upload (max 1920px, ~80% quality); property list filters by purpose/category/status/community/beds/price range.

### 6.6 Quotation Management (`/quotations`)
- Builder page: customer picker (searchable), optional deal link, line items (description/qty/unit price, auto line totals), discount (amount or %), VAT auto at company rate (5%), totals footer. Live PDF-style preview on the right.
- **Approval hook:** if discount > 0 AND total discount exceeds `quotation_approval_threshold` → status `pending_approval`, creates an `approvals` row, notifies admins/managers. Cannot be sent until approved.
- Actions: Save draft, Send (emails PDF via Resend + marks sent), Mark accepted/rejected, **Convert to invoice** (copies items).
- PDF (route `/api/pdf/quotation/[id]`): company logo/header, TRN, quote no, customer block, items table, totals with VAT line, terms, signature area. A4.
- **AC:** totals always recomputed server-side (never trust client math); expired quotes auto-flag via daily cron; numbering sequential.

### 6.7 Invoice Management (`/invoices`)
- Same builder pattern as quotations. Statuses driven by payments: `sent → partially_paid → paid` automatically as payments post; daily cron flags `overdue` when past due_date with balance > 0.
- Record payment dialog from invoice page: method, amount (default = balance), date, reference; method = cheque → inline create a `cheques` row (incoming, linked).
- Void requires admin + reason; voided invoices excluded from all metrics.
- Tax-compliant PDF: "TAX INVOICE" title, company TRN, customer TRN (if company), VAT 5% line, AED. Also a Receipt PDF per payment.
- **AC:** amount_paid maintained by trigger or transactional server action (choose one, be consistent); cannot pay more than balance; overdue cron idempotent.

### 6.8 Payments & Cheque Tracker (`/payments`)
Two tabs. This module is a headline feature — Dubai real estate runs on post-dated cheques (PDCs).
- **Payments tab:** all payments, filter by method/date, link through to invoice/customer, export CSV.
- **Cheques tab:** table sorted by due_date. Columns: due date (red if past), direction badge, customer/payee, bank, cheque no, amount, status, linked invoice/deal. Filters: status, direction, due in 7/30/90 days. Summary strip: "Due in 30 days: AED X (n) · Overdue/pending past due: AED Y (m) · Bounced: k".
- Status flow: `pending → deposited → cleared` | `bounced` (requires reason; offers "Create replacement cheque" which links `replaced_by_cheque_id` and sets original to `replaced`). Clearing a cheque linked to an invoice posts/updates the payment automatically.
- Daily cron: notify accountant + admin for cheques due in 7 days and on due date; overdue invoice flags; document-expiry reminders (30 days) — one combined `/api/cron/daily` handler, guarded by `CRON_SECRET`.
- **AC:** a bounced cheque linked to an invoice reverses that payment (invoice returns to partially_paid/sent) atomically.

### 6.9 Financial Dashboard & Expenses (`/reports` + `/payments`)
- Expenses CRUD (accountant/admin) with receipt upload.
- Financial view (admin/accountant/manager): Revenue vs Expenses by month (12m), collected vs outstanding, VAT collected this quarter, commissions payable by agent (from won deals), cheque exposure timeline (incoming PDC amounts by month).

### 6.10 Reports & Analytics (`/reports`)
Fixed report pages (no custom report builder — out of scope):
1. Sales performance: deals won/lost, conversion rate by stage, avg days-to-close, by agent + date range.
2. Lead analytics: volume by source, source → conversion %, response-time avg (lead created → first activity).
3. Property report: inventory by status/category/community, avg days-on-market.
4. Financial: revenue, outstanding, aging buckets (0-30/31-60/61-90/90+), VAT summary, expense breakdown.
5. Agent scorecard: leads handled, activities logged, deals won, revenue, commissions.
- Every report: date-range picker, CSV export button (server-generated), and uses the shared `/server/metrics.ts` helpers.
- **AC:** numbers reconcile with dashboard KPIs for identical ranges.

### 6.11 Document Management (`/documents`)
- Global library view (filter by category/entity/expiry) + embedded "Documents" tab on customer/property/deal/invoice pages (upload scoped to that entity).
- Upload → Supabase Storage `documents` bucket, path `{entity_type}/{entity_id}/{uuid}-{filename}`; signed URLs for viewing (private bucket).
- Expiry tracking: `expiry_date` on IDs/permits/contracts → dashboard badge + cron reminder at 30 days.
- Optional AI extraction on upload (see §8.1) prefills name/category/expiry.
- **AC:** max 20 MB/file; allowed types pdf/jpg/png/webp/docx/xlsx; deleting is soft (row) — storage object retained.

### 6.12 Approvals (`/approvals`)
- Inbox for admins/managers: pending list with context card (what/who/amount/reason), Approve/Reject with note. Requesters see their own request statuses.
- Wired into: quotation discounts over threshold (6.6), expenses above an admin-set limit (settings), manual commission overrides on deals.
- **AC:** decision unlocks/updates the source entity in the same transaction; both sides notified.

### 6.13 Notification System
- In-app: bell icon with unread count (poll every 60s or Supabase Realtime — **AGENT DISCRETION**), dropdown list, mark-all-read, each links to its entity.
- Email (Resend): approval requests, lead assigned, cheque due (7d/0d), invoice overdue. Per-user email toggles in profile settings.
- All notification creation goes through one helper `notify(userIds, kind, title, body, entity)`.

### 6.14 Workflow Automation (`/settings/automations`)
Deliberately simple — a rules table, not a visual builder:
- List of rules with toggle. Create/edit form: pick trigger (dropdown of the fixed trigger list), simple condition rows (field equals value), actions (notify role, assign round-robin, send email template, create follow-up task).
- Triggers fire from the relevant server actions (in-process, after commit) and from the daily cron for time-based ones.
- Ship 4 default rules ON: new lead → notify manager + round-robin assign; deal → Won → notify admin; cheque due 7d → notify accountant; document expiring 30d → notify admin.

### 6.15 User & Role Management (`/settings/users`) + Settings
- Admin invites by email (Supabase invite), sets role + commission rate; deactivate (blocks login via `is_active` check in middleware); reset password link.
- Settings pages: Company profile (name, TRN, RERA ORN, logo, VAT rate, numbering prefixes, approval thresholds), Email templates (edit subject/body with `{{placeholders}}`), Automations (6.14).

---

## 7. UAE / Dubai Specifics — do not skip these

1. **Currency:** AED only for MVP. Format `AED 1,250,000` (no decimals for property prices; 2 decimals on invoices).
2. **VAT:** 5% on brokerage commissions/service invoices. Invoices must show TRN of company (and customer TRN when customer is a company) and the label **"TAX INVOICE"**. VAT rate read from `company_settings` — never hardcode.
3. **Post-dated cheques (PDCs):** rent is commonly paid in 1–4 cheques/year; this is why §6.8 is a first-class module, not a payments afterthought.
4. **Regulatory fields (data capture only — no API integrations in MVP):** RERA ORN (company), BRN per agent (add `brn text` to profiles), Trakheesi permit no. per advertised property, DTCM permit for holiday homes, Ejari number field on rental deals (`ejari_no text` on deals).
5. **Work week:** Mon–Fri business; date pickers standard. Timezone Asia/Dubai.
6. **WhatsApp-first culture:** every phone number in the UI renders with a WhatsApp deep-link icon (`https://wa.me/<E.164 digits>`). Store phones in E.164 (+9715xxxxxxxx); validate with a light regex, don't over-restrict.
7. **Languages:** English-only UI for MVP. Build with next-intl-friendly structure is NOT required — plain strings are fine (keep it simple).

---

## 8. AI Features — right-sized (**LOCKED scope**)

**Excluded on purpose:** public AI chatbots, AI voice assistants, "customer support automation" — a <25-person brokerage has no volume to justify them and no one to maintain them. Do not build any chat widget.

All AI calls go through server route handlers under `/api/ai/*` using `ANTHROPIC_API_KEY`, model `claude-sonnet-4-6`, with a 20s timeout and graceful degradation (feature hides/disables if the key is missing). Prompt the model to return **JSON only** and parse defensively.

### 8.1 Document intelligence (highest value)
- On upload (user opts in via a "Scan with AI" button, not automatic), send the image/PDF to the API and extract: document type, person/company name, ID numbers (Emirates ID, passport), issue/expiry dates.
- Prefill the document form (category, name, expiry_date) and, when uploaded from a customer page, offer one-click "Apply to customer profile" for Emirates ID / passport number fields. Store raw output in `documents.ai_extracted`.
- AC: wrong extractions must be trivially editable; nothing auto-saves without user confirmation.

### 8.2 Lead scoring & next-best-action
- Button on lead drawer: "Score this lead". Sends lead fields + activity summary → returns `{score: 0-100, reason: string, suggested_next_action: string}`. Saved to `leads.score/score_reason`. Batch re-score nightly for open leads is **out of scope** (manual only).

### 8.3 Drafting assistant
- On lead/customer pages: "Draft follow-up" → generates a short WhatsApp message or email (tone: professional, Dubai real estate context, mentions specific property/budget). Output into an editable textarea with Copy + (for email) Send buttons. Never auto-sends.

### 8.4 Deal/quotation summarizer
- On deal page: "Summarize" → 5-bullet summary of timeline, blockers, and suggested next step from the activity log. Display-only.

That's the whole AI scope. Anything else (knowledge base, workflow intelligence, process mining) is explicitly **out of scope** for this build.

---

## 9. UI / Design System

Match the look-and-feel of the client's previous portal (reference screenshot: "Mahenti CRM"):
- **Shell:** fixed left sidebar (collapsible groups, active item = dark pill), top bar with breadcrumb center, bell + user chip right. Content on `#F7F8FA` background, white cards `rounded-2xl` with soft shadow.
- **Palette (Tailwind tokens):** primary teal/green `#10B981` (CTAs like Add Property), secondary purple `#7C3AED` (banners, off-plan/alt actions), accent blue `#3B82F6`, amber `#F59E0B`, danger `#EF4444`. Neutral slate for text (`#0F172A` headings).
- **Stat cards:** icon in a colored rounded square (top-left), big number, muted label — exactly like the reference.
- **Quick actions:** full-width colored gradient buttons in a row.
- **Alert banner:** purple gradient, icon left, chevron right, white text with pink highlight for the urgent number.
- Status badges: soft background + strong text color, per-status color map defined once in `/lib/status-colors.ts`.
- Every table: sticky header, row hover, right-aligned money, action kebab menu.
- Responsive: sidebar collapses to icons < 1280px, drawer nav on mobile; tables become card lists on mobile for leads/properties.
- Dark mode: **out of scope**.

---

## 10. Build Phases & Order (each phase must be deployable)

**Phase 0 — Foundation (do first, completely):** Next.js scaffold, Supabase project wiring, auth (login, middleware, invite flow), profiles + roles, RLS baseline, app shell (sidebar/topbar), settings company profile, seed script, activity_log helper, `money.ts`/`dates.ts`, permissions helper. AC: can log in as each seeded role and see role-appropriate nav.

**Phase 1 — CRM core:** Leads (6.2) → Customers (6.3) → Pipeline (6.4) → Dashboard v1 (KPIs + activity). AC: full lead→won journey works.

**Phase 2 — Inventory & money:** Properties + owners (6.5) → Quotations (6.6) → Invoices (6.7) → Payments + Cheque tracker (6.8) → PDFs → daily cron. AC: won deal → invoice → 4 PDCs logged → one bounces → replacement → invoice paid; dashboard banner reflects it.

**Phase 3 — Governance & polish:** Documents (6.11) → Approvals (6.12) → Notifications (6.13) → Automations (6.14) → Reports (6.10) → Financial views (6.9) → Users/settings complete (6.15).

**Phase 4 — AI features (§8)** in order 8.1 → 8.2 → 8.3 → 8.4.

Do not start a phase until the previous phase's ACs pass. Write a short `PROGRESS.md` updated at each milestone.

---

## 11. Non-Functional Requirements

- **Security:** RLS on every table; service-role key only in server code; all storage buckets private with signed URLs; Zod-validate every action input; rate-limit AI routes (10/min/user); middleware blocks inactive users.
- **Performance:** server components + parallel data fetching; paginate every list (25/page); DB indexes on every FK, `deals.stage`, `cheques(due_date, status)`, `invoices(status, due_date)`, `leads(status, assigned_to)`; dashboard target < 1.5s TTFB on Vercel.
- **Integrity:** money in bigint fils; totals computed server-side; numbering via locked counter function; soft deletes filtered by a shared query helper (never forget `deleted_at is null`).
- **Auditability:** activity_log on every mutation; approvals immutable once decided.
- **Testing:** Vitest unit tests for `money.ts`, VAT/total calculators, cheque status transitions, and permission matrix (minimum 25 tests). Playwright smoke: login, create lead, convert, drag deal to Won, create invoice, record cheque payment.
- **Error handling:** every server action returns `{ok, data?, error?}`; toasts via sonner; never expose raw DB errors to UI.

## 12. Explicitly OUT of scope (do not build)
Public property portal/website, portal feeds (Bayut/Property Finder XML), multi-currency, payroll/HR, accounting ledger (double-entry), tenant/maintenance portal, mobile apps, dark mode, custom report builder, visual workflow designer, AI chatbots/voice, WhatsApp Business API integration (deep-links only).

## 13. Definition of Done (whole project)
1. All phase ACs pass; Playwright smoke suite green.
2. Seeded demo renders every screen with realistic data; zero empty crashes.
3. `README.md` covers: env setup, Supabase migration + seed commands, local dev, deploy to Vercel, cron setup.
4. Lighthouse (dashboard, logged-in): Performance ≥ 85, Accessibility ≥ 90.
5. No TypeScript errors (`tsc --noEmit` clean), ESLint clean.
