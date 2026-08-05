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

### Next: Phase 1 — CRM Core
- [x] Leads module (/leads) — list with filters/search, detail drawer, convert to customer+deal, create dialog with duplicate guard, activity logging
- [x] Customers module (/customers) — list with search/type filter, create dialog, detail page with KYC panel, balance, deals, invoices, activity
- [x] Pipeline (/pipeline) — Kanban with @dnd-kit drag-and-drop, 7 stages, Won/Lost dialogs, weighted value totals, agent ownership check
- [ ] Dashboard v1 (charts, activity feed, follow-ups)

### Bug fixes applied
- [x] RLS infinite recursion fix (migration 0006 — SECURITY DEFINER functions has_role/is_admin)
- [x] Base UI error #31 (DropdownMenuLabel wrapped in DropdownMenuGroup)
- [x] Global error boundary, debug API route, auth error logging

## Phase 2 — Inventory & Money (next)
- [ ] Properties + owners (/properties)
- [ ] Quotations (/quotations)
- [ ] Invoices (/invoices)
- [ ] Payments + Cheque tracker (/payments)
- [ ] PDFs (quotation, invoice, receipt)
- [ ] Daily cron wiring
