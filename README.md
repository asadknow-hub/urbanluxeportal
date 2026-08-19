# UrbanLuxe Portal — CRM & ERP for Dubai Real Estate

An all-in-one CRM (leads, customers, pipeline) + light ERP (properties, quotations, invoices, cheques, finance) for a Dubai real estate brokerage.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript, RSC)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **DB:** Supabase Postgres
- **Auth:** Supabase Auth (email+password, invite-only)
- **Storage:** Supabase Storage
- **Charts:** Recharts
- **Tables:** TanStack Table v8
- **PDF:** @react-pdf/renderer
- **Email:** Resend
- **AI:** Anthropic API (claude-sonnet-4-6)
- **Icons:** lucide-react

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase and API keys:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — server-only service role key
- `DATABASE_URL` — Postgres URI (direct or session pooler, port 5432) so migrations can be applied locally with `npm run db -- --file supabase/migrations/00xx.sql`
- `ANTHROPIC_API_KEY` — Anthropic API key (for AI features)
- `RESEND_API_KEY` — Resend API key (for transactional email)
- `APP_BASE_URL` — app URL (e.g. http://localhost:3000)
- `CRON_SECRET` — secret to protect cron route handlers

### 3. Database setup

Run migrations in order:

```bash
npm run db -- --file supabase/migrations/0026_ensure_deal_buyer_schema.sql
```

Or `supabase db push` if the CLI is linked.

Or manually run the SQL files in `supabase/migrations/` in order (0001 → 0005).

Then seed demo data:

```bash
psql -d your_db -f supabase/seed.sql
```

**Note:** Auth users must be created via Supabase Auth (Admin SDK or dashboard) before running the seed. The seed references profile IDs that must match auth.users IDs.

### 4. Create admin user

1. Go to Supabase Dashboard → Authentication → Users → Add user
2. Set email to `admin@urbanluxe.ae` and set a password
3. The user's auth ID must be `a0000000-0000-0000-0000-000000000001` (or update the seed)

### 5. Run dev server

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

### 6. Build for production

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables in Vercel project settings
4. Deploy

## Cron Jobs

A daily cron runs at 06:00 UTC via Vercel Cron (`/api/cron/daily`):
- Flags overdue invoices
- Sends cheque due reminders (7 days)
- Sends document expiry reminders (30 days)
- Auto-expires quotations past `valid_until`

Protected by `CRON_SECRET` environment variable.

## Project Structure

```
/src
  /app
    /(auth)/login          — login page
    /(app)/dashboard       — main dashboard
    /(app)/leads           — lead management
    /(app)/customers       — customer management
    /(app)/pipeline        — sales pipeline (Kanban)
    /(app)/properties      — property inventory
    /(app)/quotations      — quotation builder
    /(app)/invoices        — invoice management
    /(app)/payments        — payments + cheque tracker
    /(app)/documents       — document library
    /(app)/approvals       — approval inbox
    /(app)/reports         — reports & analytics
    /(app)/settings        — company profile, users, automations
    /api/cron/daily        — daily cron handler
    /api/ai/...            — AI route handlers
    /api/pdf/...           — PDF generation
  /components
    /ui                    — shadcn/ui components
    /shared                — sidebar, topbar, etc.
  /lib
    supabase/              — server & browser Supabase clients
    money.ts               — fils/AED conversion, formatting
    dates.ts               — date formatting (Asia/Dubai)
    permissions.ts         — role/capability matrix
    status-colors.ts       — status badge color map
    auth.ts                — session/user helpers
    activity-log.ts        — audit log helper
    notify.ts              — notification helper
    phone.ts               — WhatsApp/phone helpers
  /types
    database.ts            — TypeScript types for DB schema
/supabase
  /migrations              — SQL migration files (0001-0005)
  seed.sql                 — demo data
```

## Roles & Permissions

| Capability | admin | manager | agent | accountant |
|---|---|---|---|---|
| Dashboard (full) | ✅ | ✅ | ❌ (own stats) | ✅ |
| Leads (all) | ✅ | ✅ | own + unassigned | read-only |
| Pipeline (all) | ✅ | ✅ | own deals | read-only |
| Properties (create/edit) | ✅ | ✅ | create, edit own | read-only |
| Quotations | ✅ | ✅ | ✅ (approval > threshold) | ✅ |
| Invoices | ✅ | ✅ | ❌ | ✅ |
| Payments & cheques | ✅ | view | ❌ | ✅ |
| User management | ✅ | ❌ | ❌ | ❌ |
| Delete (soft) | ✅ | ❌ | ❌ | ❌ |

## Money

All amounts stored as **integer fils** (1 AED = 100 fils). Never use floats. Use `formatAED()` for display.

## License

Private — UrbanLuxe Real Estate.
