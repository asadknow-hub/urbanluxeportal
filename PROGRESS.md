# PROGRESS — UrbanLuxe Portal

## Phase 0 — Foundation ✅

- [x] Next.js 16 scaffold (App Router, TypeScript, Tailwind v4, src dir, @/* alias)
- [x] Dependencies installed (shadcn/ui, supabase, zod, react-hook-form, recharts, tanstack table, @react-pdf/renderer, resend, date-fns, @dnd-kit, sonner, lucide-react)
- [x] Supabase clients (server.ts, client.ts, service client)
- [x] Proxy (middleware) — auth guard, inactive user check, redirect logic
- [x] Database types (src/types/database.ts)
- [x] SQL migrations (0001-0005): enums, profiles, company_settings, activity_log, counters, leads, lead_activities, customers, deals, properties, property_owners, property_media, quotations, quotation_items, invoices, invoice_items, payments, cheques, expenses, documents, approvals, notifications, automation_rules, email_templates, next_doc_number function, RLS on all tables
- [x] Lib helpers: money.ts, dates.ts, permissions.ts, status-colors.ts, auth.ts, activity-log.ts, notify.ts, phone.ts
- [x] App shell: sidebar (collapsible, role-filtered nav), topbar (breadcrumb, notifications, user menu)
- [x] Auth: login page (email+password), route groups (auth)/(app), root redirect
- [x] Dashboard v0: KPI stat cards, alert banner placeholder, activity + follow-up placeholders, loading skeleton
- [x] Settings: company profile page (read-only form, admin-only)
- [x] Cron route: /api/cron/daily (overdue invoices, cheque reminders, doc expiry, quote expiry)
- [x] Seed data: 5 profiles, 5 owners, 15 properties, 10 customers, 25 leads, 10 deals, 6 quotations, 8 invoices, 12 cheques, 3 payments, activity log entries
- [x] .env.example, README.md, vercel.json

### Next: Phase 1 — CRM Core ✅
- [x] Leads module (/leads) — list with filters/search, detail drawer, convert to customer+deal, create dialog with duplicate guard, activity logging
- [x] Customers module (/customers) — list with search/type filter, create dialog, detail page with KYC panel, balance, deals, invoices, activity
- [x] Pipeline (/pipeline) — Kanban with @dnd-kit drag-and-drop, 7 stages, Won/Lost dialogs, weighted value totals, agent ownership check
- [x] Dashboard v1 — real activity feed, upcoming follow-ups, live cheque banner, quick action buttons

### Bug fixes applied
- [x] RLS infinite recursion fix (migration 0006 — SECURITY DEFINER functions has_role/is_admin)
- [x] Base UI error #31 (DropdownMenuLabel wrapped in DropdownMenuGroup)
- [x] Global error boundary, debug API route, auth error logging

## Phase 2 — Inventory & Money ✅
- [x] Properties + owners (/properties) — card grid with filters, detail page with Supabase Storage gallery upload, create dialog, linked deals
- [x] Owners sub-page (/properties/owners) — list with property counts, create dialog
- [x] Quotations (/quotations) — list with filters, create dialog with line items builder + VAT calc, detail page, convert-to-invoice flow, status management
- [x] Invoices (/invoices) — list with status/balance, create dialog with line items+VAT, detail page with payment history, record payment with auto status flow (partial/paid), void action
- [x] Payments + Cheque tracker (/payments) — tabbed UI, payments list, cheque lifecycle (pending→deposited→cleared/bounced), create cheque dialog, summary strip
- [x] Expenses module (/expenses) — CRUD with receipt upload to Supabase Storage, category filter, search
- [x] Document upload component — Supabase Storage canonical paths, always upload never link
- [x] RLS migration 0007 — tighten quotations/documents policies, create storage buckets with RLS
- [x] PDFs — quotation, tax invoice, payment receipt via @react-pdf/renderer (company header, TRN, VAT, line items, totals)
- [x] Daily cron — overdue invoices, cheque due in 7 days, document expiry 30 days, quote auto-expire

## Phase 3 — Governance & Polish ✅
- [x] Documents (/documents) — global library with search, category/entity filters, expiry badges, signed URLs, upload dialog with Supabase Storage
- [x] Approvals (/approvals) — inbox for admins/managers, approve/reject with note, my requests tab, requester notification
- [x] Notifications — bell with unread count, dropdown list, mark-all-read, auto-refresh, click-through to entity
- [x] Automations (/settings/automations) — rules list with toggle on/off, trigger/action summary
- [x] Reports (/reports) — tabbed: Sales (won/lost, win rate, agent scorecard), Leads (by source, conversion), Properties (by status/category), Financial (revenue, expenses, VAT, net profit)
- [x] Users (/settings/users) — list with roles, activate/deactivate, invite dialog
- [x] Email Templates (/settings/email-templates) — edit subject/body for transactional emails
- [x] Settings hub — sub-page navigation cards, company profile form
- [x] Switch UI component

### Next: Phase 4 — AI Features & Polish
- [ ] AI document extraction (passport, Emirates ID, title deed)
- [ ] AI lead scoring & enrichment
- [ ] AI quotation/valuation suggestions
- [ ] Resend email integration
- [ ] Production deployment & testing
