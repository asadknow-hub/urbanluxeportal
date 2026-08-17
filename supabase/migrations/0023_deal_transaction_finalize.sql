-- Deal transaction fields: property, payment, KYC while deal is in pipeline.
-- Customer is created/activated when deal is marked won (see finalize_deal_to_customer).

alter table public.deals alter column customer_id drop not null;

alter table public.deals
  add column if not exists property_title text,
  add column if not exists property_community text,
  add column if not exists property_building text,
  add column if not exists property_unit text,
  add column if not exists property_ref text,
  add column if not exists property_snapshot jsonb,
  add column if not exists payment_method text,
  add column if not exists payment_deposit bigint,
  add column if not exists payment_balance bigint,
  add column if not exists payment_schedule jsonb,
  add column if not exists payment_notes text,
  add column if not exists kyc_nationality text,
  add column if not exists kyc_emirates_id text,
  add column if not exists kyc_passport_no text,
  add column if not exists kyc_trn text,
  add column if not exists buyer_name text,
  add column if not exists buyer_phone text,
  add column if not exists buyer_email text,
  add column if not exists finalized_at timestamptz;

create index if not exists idx_deals_finalized on public.deals (finalized_at) where finalized_at is not null;

-- Properties acquired by customers when deals close
create table if not exists public.customer_properties (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers on delete cascade,
  deal_id uuid references public.deals on delete set null,
  deal_type text not null default 'sale',
  property_title text not null,
  property_community text,
  property_building text,
  property_unit text,
  property_ref text,
  property_snapshot jsonb,
  value bigint not null default 0,
  payment_method text,
  payment_snapshot jsonb,
  acquired_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_properties_customer on public.customer_properties (customer_id);
create index if not exists idx_customer_properties_deal on public.customer_properties (deal_id);

create unique index if not exists idx_customer_properties_deal_unique
  on public.customer_properties (deal_id)
  where deal_id is not null;

alter table public.customer_properties enable row level security;

create policy "customer_properties_read" on public.customer_properties
  for select using (
    exists (
      select 1 from public.customers c
      where c.id = customer_id and c.deleted_at is null
    )
  );

create policy "customer_properties_insert" on public.customer_properties
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid())
  );

create policy "customer_properties_update" on public.customer_properties
  for update using (
    exists (
      select 1 from public.customers c
      where c.id = customer_id and c.deleted_at is null
    )
  );

-- Replace legacy helper with deal-finalize flow
create or replace function public.finalize_deal_to_customer(p_deal_id uuid, p_actor_id uuid default null)
returns uuid
language plpgsql
security definer
as $$
declare
  v_deal record;
  v_lead record;
  v_customer_id uuid;
  v_name text;
  v_phone text;
  v_email text;
begin
  select * into v_deal from public.deals where id = p_deal_id and deleted_at is null;
  if not found then return null; end if;
  if v_deal.property_title is null or trim(v_deal.property_title) = '' then
    raise exception 'Property title is required before finalizing';
  end if;

  v_name := coalesce(nullif(trim(v_deal.buyer_name), ''), 'Unknown buyer');
  v_phone := nullif(trim(v_deal.buyer_phone), '');
  v_email := nullif(trim(v_deal.buyer_email), '');

  if v_deal.lead_id is not null then
    select * into v_lead from public.leads where id = v_deal.lead_id;
  end if;

  v_name := coalesce(nullif(trim(v_deal.buyer_name), ''), case when v_lead.id is not null then v_lead.name else null end, v_name);
  v_phone := coalesce(v_phone, case when v_lead.id is not null then nullif(trim(v_lead.phone), '') else null end);
  v_email := coalesce(v_email, case when v_lead.id is not null then nullif(trim(v_lead.email), '') else null end);

  v_customer_id := v_deal.customer_id;

  if v_customer_id is null and v_phone is not null then
    select id into v_customer_id from public.customers
    where phone = v_phone and deleted_at is null
    limit 1;
  end if;

  if v_customer_id is null then
    insert into public.customers (
      type, name, phone, email, nationality, emirates_id, passport_no, trn,
      assigned_to, lead_id, status, lead_context, created_by
    )
    values (
      'individual',
      v_name,
      v_phone,
      v_email,
      coalesce(v_deal.kyc_nationality, case when v_lead.id is not null then v_lead.nationality else null end),
      v_deal.kyc_emirates_id,
      v_deal.kyc_passport_no,
      v_deal.kyc_trn,
      v_deal.assigned_to,
      v_deal.lead_id,
      'active',
      v_deal.lead_context,
      p_actor_id
    )
    returning id into v_customer_id;
  else
    update public.customers set
      status = 'active',
      name = coalesce(nullif(trim(name), ''), v_name),
      phone = coalesce(phone, v_phone),
      email = coalesce(email, v_email),
      nationality = coalesce(nationality, v_deal.kyc_nationality, case when v_lead.id is not null then v_lead.nationality else null end),
      emirates_id = coalesce(emirates_id, v_deal.kyc_emirates_id),
      passport_no = coalesce(passport_no, v_deal.kyc_passport_no),
      trn = coalesce(trn, v_deal.kyc_trn),
      lead_id = coalesce(lead_id, v_deal.lead_id),
      lead_context = coalesce(lead_context, v_deal.lead_context),
      updated_at = now()
    where id = v_customer_id;
  end if;

  update public.deals set
    customer_id = v_customer_id,
    finalized_at = now(),
    updated_at = now()
  where id = p_deal_id;

  insert into public.customer_properties (
    customer_id, deal_id, deal_type, property_title, property_community,
    property_building, property_unit, property_ref, property_snapshot,
    value, payment_method, payment_snapshot
  )
  select
    v_customer_id,
    p_deal_id,
    v_deal.deal_type::text,
    v_deal.property_title,
    v_deal.property_community,
    v_deal.property_building,
    v_deal.property_unit,
    v_deal.property_ref,
    v_deal.property_snapshot,
    coalesce(v_deal.value, 0),
    v_deal.payment_method,
    jsonb_build_object(
      'deposit', v_deal.payment_deposit,
      'balance', v_deal.payment_balance,
      'schedule', v_deal.payment_schedule,
      'notes', v_deal.payment_notes
    )
  where not exists (
    select 1 from public.customer_properties cp where cp.deal_id = p_deal_id
  );

  if v_deal.lead_id is not null then
    update public.leads set
      converted_customer_id = v_customer_id,
      updated_at = now()
    where id = v_deal.lead_id;
  end if;

  return v_customer_id;
end;
$$;

notify pgrst, 'reload schema';
