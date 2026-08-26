-- Evolve the live CRM toward: one person from first contact, lean inventory, first-class viewings.
-- Keep existing leads/deals/customers tables. Money stays fils. Roles unchanged.

-- ============================================================
-- PERSON: customer exists from capture; lead.customer_id is the link
-- ============================================================

alter table public.customers
  add column if not exists client_since date;

alter table public.leads
  add column if not exists customer_id uuid references public.customers on delete set null;

create index if not exists idx_leads_customer on public.leads (customer_id);

-- Prospect was the old "not yet a client" bucket. Capture now uses status=lead.
update public.customers
set status = 'lead'
where status = 'prospect';

-- Link already-finalized people
update public.leads l
set customer_id = l.converted_customer_id
where l.customer_id is null
  and l.converted_customer_id is not null;

update public.leads l
set customer_id = c.id
from public.customers c
where l.customer_id is null
  and c.lead_id = l.id
  and c.deleted_at is null;

-- Backfill a person row for every remaining live lead
do $$
declare
  r record;
  v_id uuid;
  v_status text;
begin
  for r in
    select *
    from public.leads
    where customer_id is null
      and deleted_at is null
  loop
    v_id := null;
    v_status := case
      when r.status = 'converted' then 'qualified'
      when r.status = 'unqualified' then 'lost'
      else 'lead'
    end;

    if r.phone is not null and length(trim(r.phone)) > 0 then
      select id into v_id
      from public.customers
      where phone = r.phone and deleted_at is null
      limit 1;
    end if;

    if v_id is null and r.email is not null and length(trim(r.email)) > 0 then
      select id into v_id
      from public.customers
      where email = r.email and deleted_at is null
      limit 1;
    end if;

    if v_id is null then
      insert into public.customers (
        type, name, phone, email, nationality, notes, tags,
        assigned_to, lead_id, status, created_by
      )
      values (
        'individual',
        r.name,
        r.phone,
        r.email,
        r.nationality,
        r.notes,
        coalesce(r.tags, '{}'),
        r.assigned_to,
        r.id,
        v_status,
        r.created_by
      )
      returning id into v_id;
    else
      update public.customers
      set lead_id = coalesce(lead_id, r.id)
      where id = v_id;
    end if;

    update public.leads set customer_id = v_id where id = r.id;
  end loop;
end $$;

-- Open deals inherit the person
update public.deals d
set customer_id = l.customer_id
from public.leads l
where d.lead_id = l.id
  and d.customer_id is null
  and l.customer_id is not null
  and d.deleted_at is null;

update public.customers c
set status = 'qualified'
where c.status = 'lead'
  and c.deleted_at is null
  and exists (
    select 1
    from public.deals d
    where d.customer_id = c.id
      and d.deleted_at is null
      and d.stage not in ('closed', 'lost')
  );

-- Stamp client_since on already-closed deals
update public.customers c
set client_since = coalesce(
  c.client_since,
  (
    select min(coalesce(d.finalized_at::date, d.updated_at::date))
    from public.deals d
    where d.customer_id = c.id
      and d.deleted_at is null
      and d.stage in ('closed', 'won')
  )
)
where c.status = 'active'
  and c.client_since is null;

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

  v_customer_id := coalesce(
    v_deal.customer_id,
    case when v_lead.id is not null then v_lead.customer_id else null end
  );

  if v_customer_id is null and v_phone is not null then
    select id into v_customer_id from public.customers
    where phone = v_phone and deleted_at is null
    limit 1;
  end if;

  if v_customer_id is null then
    insert into public.customers (
      type, name, phone, email, nationality, emirates_id, passport_no, trn,
      assigned_to, lead_id, status, lead_context, client_since, created_by
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
      current_date,
      p_actor_id
    )
    returning id into v_customer_id;
  else
    update public.customers set
      status = 'active',
      client_since = coalesce(client_since, current_date),
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
      customer_id = v_customer_id,
      converted_customer_id = v_customer_id,
      updated_at = now()
    where id = v_deal.lead_id;
  end if;

  return v_customer_id;
end;
$$;

-- ============================================================
-- LEAN INVENTORY
-- ============================================================

create sequence if not exists public.property_code_seq start with 1;

create table if not exists public.developers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  phone text,
  email text,
  is_active boolean not null default true,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_developers_name on public.developers (name);
create index if not exists idx_developers_deleted on public.developers (deleted_at);

create trigger trg_developers_updated_at
  before update on public.developers
  for each row execute function public.set_updated_at();

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid references public.developers on delete set null,
  name text not null,
  community text,
  location text,
  project_type text not null default 'ready'
    check (project_type in ('off_plan', 'ready')),
  handover_date date,
  description text,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_projects_developer on public.projects (developer_id);
create index if not exists idx_projects_community on public.projects (community);
create index if not exists idx_projects_deleted on public.projects (deleted_at);

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  property_code text unique not null default ('PRP-' || lpad(nextval('public.property_code_seq')::text, 5, '0')),
  project_id uuid references public.projects on delete set null,
  developer_id uuid references public.developers on delete set null,
  community text,
  building_name text,
  unit_number text,
  property_type text not null default 'apartment'
    check (property_type in (
      'apartment', 'villa', 'townhouse', 'penthouse', 'plot',
      'office', 'retail', 'warehouse', 'building'
    )),
  bedrooms int,
  bathrooms int,
  maid_room boolean not null default false,
  floor text,
  view text,
  bua_sqft numeric(10, 2),
  plot_sqft numeric(10, 2),
  parking int,
  status text not null default 'available'
    check (status in ('off_plan', 'under_construction', 'ready', 'available', 'sold', 'rented')),
  title_deed_number text,
  oqood_number text,
  dld_property_number text,
  assigned_to uuid references public.profiles on delete set null,
  notes text,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_properties_community on public.properties (community);
create index if not exists idx_properties_type on public.properties (property_type);
create index if not exists idx_properties_status on public.properties (status);
create index if not exists idx_properties_assigned on public.properties (assigned_to);
create index if not exists idx_properties_deleted on public.properties (deleted_at);
create index if not exists idx_properties_code on public.properties (property_code);

create trigger trg_properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties on delete cascade,
  listing_type text not null default 'sale'
    check (listing_type in ('sale', 'rent', 'off_plan')),
  asking_price bigint not null default 0,
  listing_status text not null default 'available'
    check (listing_status in ('draft', 'available', 'reserved', 'under_offer', 'sold', 'rented', 'withdrawn')),
  assigned_agent_id uuid references public.profiles on delete set null,
  trakheesi_permit_no text,
  available_from date,
  furnishing text
    check (furnishing is null or furnishing in ('furnished', 'semi', 'unfurnished')),
  notes text,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_listings_property on public.listings (property_id);
create index if not exists idx_listings_status on public.listings (listing_status);
create index if not exists idx_listings_type on public.listings (listing_type);
create index if not exists idx_listings_deleted on public.listings (deleted_at);

create trigger trg_listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

create table if not exists public.deal_properties (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals on delete cascade,
  property_id uuid not null references public.properties on delete cascade,
  listing_id uuid references public.listings on delete set null,
  role text not null default 'shortlisted'
    check (role in ('requirement', 'suggested', 'shortlisted', 'viewed', 'offered')),
  notes text,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  unique (deal_id, property_id)
);

create index if not exists idx_deal_properties_deal on public.deal_properties (deal_id);
create index if not exists idx_deal_properties_property on public.deal_properties (property_id);

-- ============================================================
-- VIEWINGS (evolve unused lead_viewings)
-- ============================================================

alter table public.lead_viewings alter column lead_id drop not null;

alter table public.lead_viewings
  add column if not exists deal_id uuid references public.deals on delete cascade,
  add column if not exists property_id uuid references public.properties on delete set null,
  add column if not exists listing_id uuid references public.listings on delete set null,
  add column if not exists status text not null default 'scheduled';

alter table public.lead_viewings drop constraint if exists lead_viewings_outcome_check;
alter table public.lead_viewings drop constraint if exists lead_viewings_status_check;
alter table public.lead_viewings drop constraint if exists lead_viewings_parent_check;

alter table public.lead_viewings
  add constraint lead_viewings_status_check
  check (status in ('scheduled', 'completed', 'no_show', 'cancelled'));

alter table public.lead_viewings
  add constraint lead_viewings_outcome_check
  check (
    outcome is null or outcome in (
      'attended', 'no_show', 'cancelled',
      'interested', 'offer', 'rejected', 'follow_up'
    )
  );

alter table public.lead_viewings
  add constraint lead_viewings_parent_check
  check (lead_id is not null or deal_id is not null);

update public.lead_viewings set status = 'completed' where outcome = 'attended' and status = 'scheduled';
update public.lead_viewings set status = 'no_show' where outcome = 'no_show' and status = 'scheduled';
update public.lead_viewings set status = 'cancelled' where outcome = 'cancelled' and status = 'scheduled';

create index if not exists idx_lead_viewings_deal on public.lead_viewings (deal_id, scheduled_at desc);
create index if not exists idx_lead_viewings_property on public.lead_viewings (property_id);
create index if not exists idx_lead_viewings_status on public.lead_viewings (status, scheduled_at);

-- ============================================================
-- RLS
-- ============================================================

alter table public.developers enable row level security;
alter table public.projects enable row level security;
alter table public.properties enable row level security;
alter table public.listings enable row level security;
alter table public.deal_properties enable row level security;

drop policy if exists "developers_read" on public.developers;
create policy "developers_read" on public.developers
  for select using (deleted_at is null and auth.uid() is not null);
drop policy if exists "developers_write" on public.developers;
create policy "developers_write" on public.developers
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "projects_read" on public.projects;
create policy "projects_read" on public.projects
  for select using (deleted_at is null and auth.uid() is not null);
drop policy if exists "projects_write" on public.projects;
create policy "projects_write" on public.projects
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "properties_read" on public.properties;
create policy "properties_read" on public.properties
  for select using (deleted_at is null and auth.uid() is not null);
drop policy if exists "properties_write" on public.properties;
create policy "properties_write" on public.properties
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "listings_read" on public.listings;
create policy "listings_read" on public.listings
  for select using (deleted_at is null and auth.uid() is not null);
drop policy if exists "listings_write" on public.listings;
create policy "listings_write" on public.listings
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "deal_properties_read" on public.deal_properties;
create policy "deal_properties_read" on public.deal_properties
  for select using (
    exists (
      select 1 from public.deals d
      where d.id = deal_id and d.deleted_at is null
    )
  );
drop policy if exists "deal_properties_write" on public.deal_properties;
create policy "deal_properties_write" on public.deal_properties
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

notify pgrst, 'reload schema';
