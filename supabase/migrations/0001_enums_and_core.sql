-- Migration 0001: Enums and core tables
-- Creates all Postgres enums, profiles, company_settings, activity_log, and counters

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('admin', 'manager', 'agent', 'accountant');

create type lead_source as enum ('website', 'bayut', 'property_finder', 'dubizzle', 'referral', 'walk_in', 'social', 'other');

create type lead_interest as enum ('buy', 'rent', 'sell', 'off_plan', 'commercial');

create type lead_status as enum ('new', 'contacted', 'qualified', 'unqualified', 'converted');

create type customer_type as enum ('individual', 'company');

create type deal_type as enum ('sale', 'rental', 'off_plan');

create type deal_stage as enum ('inquiry', 'viewing', 'negotiation', 'offer', 'contract', 'won', 'lost');

create type property_purpose as enum ('sale', 'rent');

create type property_category as enum ('apartment', 'villa', 'townhouse', 'office', 'retail', 'warehouse', 'land', 'off_plan');

create type property_status as enum ('available', 'reserved', 'sold', 'rented', 'off_market');

create type quotation_status as enum ('draft', 'pending_approval', 'approved', 'sent', 'accepted', 'rejected', 'expired');

create type invoice_status as enum ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void');

create type payment_method as enum ('cash', 'bank_transfer', 'cheque', 'card');

create type cheque_direction as enum ('incoming', 'outgoing');

create type cheque_status as enum ('pending', 'deposited', 'cleared', 'bounced', 'replaced', 'cancelled');

create type doc_category as enum ('emirates_id', 'passport', 'visa', 'title_deed', 'mou', 'tenancy_contract', 'noc', 'cheque_copy', 'invoice', 'receipt', 'marketing', 'other');

create type approval_kind as enum ('quotation_discount', 'expense', 'deal_commission', 'other');

create type approval_status as enum ('pending', 'approved', 'rejected');

-- ============================================================
-- PROFILES
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  email text,
  phone text,
  role user_role not null default 'agent',
  avatar_url text,
  commission_rate numeric default 2.0,
  brn text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- COMPANY SETTINGS (single row, id = 1)
-- ============================================================

create table if not exists public.company_settings (
  id int primary key default 1,
  company_name text,
  trn text,
  rera_orn text,
  address text,
  phone text,
  email text,
  logo_url text,
  vat_rate numeric not null default 5.0,
  quotation_prefix text not null default 'QT-',
  invoice_prefix text not null default 'INV-',
  quotation_approval_threshold bigint not null default 0,
  default_currency text not null default 'AED',
  constraint single_row check (id = 1)
);

insert into public.company_settings (id) values (1) on conflict do nothing;

-- ============================================================
-- ACTIVITY LOG
-- ============================================================

create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  diff jsonb,
  created_at timestamptz not null default now()
);

create index idx_activity_log_entity on public.activity_log (entity_type, entity_id);
create index idx_activity_log_actor on public.activity_log (actor_id);
create index idx_activity_log_created on public.activity_log (created_at desc);

-- ============================================================
-- COUNTERS (for sequential document numbering)
-- ============================================================

create table if not exists public.counters (
  id int generated always as identity primary key,
  prefix text not null,
  year int not null,
  seq int not null default 0,
  unique (prefix, year)
);

-- ============================================================
-- next_doc_number function
-- ============================================================

create or replace function public.next_doc_number(p_prefix text)
returns text
language plpgsql
security definer
as $$
declare
  v_year int := extract(year from now())::int;
  v_seq int;
  v_result text;
begin
  insert into public.counters (prefix, year, seq)
  values (p_prefix, v_year, 1)
  on conflict (prefix, year)
  do update set seq = public.counters.seq + 1
  returning seq into v_seq;

  v_result := p_prefix || v_year::text || '-' || lpad(v_seq::text, 4, '0');
  return v_result;
end;
$$;

-- ============================================================
-- UPDATED_AT trigger helper
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS on profiles
-- ============================================================

alter table public.profiles enable row level security;

create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_admin_all" on public.profiles
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- RLS on company_settings
alter table public.company_settings enable row level security;

create policy "company_settings_read" on public.company_settings
  for select using (true);

create policy "company_settings_admin_write" on public.company_settings
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- RLS on activity_log
alter table public.activity_log enable row level security;

create policy "activity_log_read" on public.activity_log
  for select using (true);

create policy "activity_log_insert" on public.activity_log
  for insert with check (auth.uid() is not null);

-- RLS on counters (service role only via function)
alter table public.counters enable row level security;
create policy "counters_service_only" on public.counters
  for all using (auth.role() = 'service_role');
