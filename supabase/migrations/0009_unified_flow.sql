-- Migration 0009: Unified Lead→Deal→Customer flow
-- Links deals and customers back to their originating leads
-- Adds customer status (prospect → active) for progressive maturation
-- Adds deal_activities table for deal timeline (mirrors lead_activities)

-- ============================================================
-- ADD lead_id TO customers
-- ============================================================
alter table public.customers add column if not exists lead_id uuid references public.leads on delete set null;
alter table public.customers add column if not exists status text not null default 'active';

create index if not exists idx_customers_lead on public.customers (lead_id);
create index if not exists idx_customers_status on public.customers (status);

-- ============================================================
-- ADD lead_id TO deals
-- ============================================================
alter table public.deals add column if not exists lead_id uuid references public.leads on delete set null;

create index if not exists idx_deals_lead on public.deals (lead_id);

-- ============================================================
-- DEAL ACTIVITIES (timeline for deals, mirrors lead_activities)
-- ============================================================
create table if not exists public.deal_activities (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals on delete cascade,
  type text not null default 'note',
  summary text,
  created_by uuid references public.profiles on delete set null,
  occurred_at timestamptz not null default now()
);

create index idx_deal_activities_deal on public.deal_activities (deal_id);
create index idx_deal_activities_occurred on public.deal_activities (occurred_at desc);

alter table public.deal_activities enable row level security;

create policy "deal_activities_read" on public.deal_activities
  for select using (
    exists (select 1 from public.deals d where d.id = deal_id and d.deleted_at is null)
  );

create policy "deal_activities_insert" on public.deal_activities
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid())
  );

-- ============================================================
-- RLS: Allow reading lead_id on deals and customers
-- (existing policies already cover select, just ensure new columns are accessible)
-- ============================================================

-- Update customer RLS to include lead_id (existing policies cover all columns by default with *)
-- No changes needed — existing RLS policies use `*` which includes new columns

-- ============================================================
-- HELPER: auto-create customer when deal is won
-- ============================================================
-- Called from updateDealStage when stage = 'won'
-- Creates customer from lead data if not already created

create or replace function public.create_customer_from_lead(p_lead_id uuid, p_deal_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_lead record;
  v_customer_id uuid;
begin
  select * into v_lead from public.leads where id = p_lead_id;
  if not found then return null; end if;

  -- Check if customer already exists for this lead
  select id into v_customer_id from public.customers where lead_id = p_lead_id and deleted_at is null limit 1;
  if v_customer_id is not null then
    -- Update status to active
    update public.customers set status = 'active', updated_at = now() where id = v_customer_id;
    -- Link deal to customer if not already
    update public.deals set customer_id = v_customer_id where id = p_deal_id and customer_id is null;
    return v_customer_id;
  end if;

  -- Create new customer from lead data
  insert into public.customers (
    type, name, phone, email, notes, assigned_to, lead_id, status
  )
  values (
    'individual', v_lead.name, v_lead.phone, v_lead.email, v_lead.notes, v_lead.assigned_to, p_lead_id, 'active'
  )
  returning id into v_customer_id;

  -- Link deal to customer
  update public.deals set customer_id = v_customer_id where id = p_deal_id;

  return v_customer_id;
end;
$$;
