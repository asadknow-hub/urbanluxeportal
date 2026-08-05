-- Migration 0002: CRM tables (leads, lead_activities, customers, deals)

-- ============================================================
-- LEADS
-- ============================================================

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  source lead_source not null default 'other',
  interest lead_interest not null default 'buy',
  budget_min bigint,
  budget_max bigint,
  preferred_areas text[],
  notes text,
  status lead_status not null default 'new',
  score int,
  score_reason text,
  assigned_to uuid references public.profiles on delete set null,
  next_follow_up_at timestamptz,
  converted_customer_id uuid,
  converted_deal_id uuid,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_leads_status on public.leads (status);
create index idx_leads_assigned on public.leads (assigned_to);
create index idx_leads_source on public.leads (source);
create index idx_leads_deleted on public.leads (deleted_at);
create index idx_leads_created on public.leads (created_at desc);

create trigger trg_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ============================================================
-- LEAD ACTIVITIES
-- ============================================================

create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads on delete cascade,
  type text not null default 'note',
  summary text,
  occurred_at timestamptz not null default now(),
  created_by uuid references public.profiles on delete set null
);

create index idx_lead_activities_lead on public.lead_activities (lead_id);
create index idx_lead_activities_occurred on public.lead_activities (occurred_at desc);

-- ============================================================
-- CUSTOMERS
-- ============================================================

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  type customer_type not null default 'individual',
  name text not null,
  phone text,
  email text,
  nationality text,
  emirates_id text,
  passport_no text,
  trn text,
  address text,
  tags text[],
  notes text,
  assigned_to uuid references public.profiles on delete set null,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_customers_name on public.customers (name);
create index idx_customers_assigned on public.customers (assigned_to);
create index idx_customers_deleted on public.customers (deleted_at);

create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ============================================================
-- DEALS
-- ============================================================

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  customer_id uuid not null references public.customers on delete cascade,
  property_id uuid,
  deal_type deal_type not null default 'sale',
  stage deal_stage not null default 'inquiry',
  value bigint not null default 0,
  commission_amount bigint,
  commission_rate numeric,
  assigned_to uuid references public.profiles on delete set null,
  expected_close_date date,
  lost_reason text,
  stage_changed_at timestamptz default now(),
  ejari_no text,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_deals_stage on public.deals (stage);
create index idx_deals_customer on public.deals (customer_id);
create index idx_deals_property on public.deals (property_id);
create index idx_deals_assigned on public.deals (assigned_to);
create index idx_deals_deleted on public.deals (deleted_at);

create trigger trg_deals_updated_at
  before update on public.deals
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

alter table public.leads enable row level security;

create policy "leads_read" on public.leads
  for select using (
    deleted_at is null and (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager', 'accountant'))
      or assigned_to = auth.uid()
      or assigned_to is null
    )
  );

create policy "leads_insert" on public.leads
  for insert with check (auth.uid() is not null);

create policy "leads_update" on public.leads
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager'))
    or assigned_to = auth.uid()
  );

alter table public.lead_activities enable row level security;

create policy "lead_activities_read" on public.lead_activities
  for select using (true);

create policy "lead_activities_insert" on public.lead_activities
  for insert with check (auth.uid() is not null);

alter table public.customers enable row level security;

create policy "customers_read" on public.customers
  for select using (
    deleted_at is null and (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager', 'accountant'))
      or assigned_to = auth.uid()
      or assigned_to is null
    )
  );

create policy "customers_insert" on public.customers
  for insert with check (auth.uid() is not null);

create policy "customers_update" on public.customers
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager'))
    or assigned_to = auth.uid()
  );

alter table public.deals enable row level security;

create policy "deals_read" on public.deals
  for select using (
    deleted_at is null and (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager', 'accountant'))
      or assigned_to = auth.uid()
    )
  );

create policy "deals_insert" on public.deals
  for insert with check (auth.uid() is not null);

create policy "deals_update" on public.deals
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager'))
    or assigned_to = auth.uid()
  );
