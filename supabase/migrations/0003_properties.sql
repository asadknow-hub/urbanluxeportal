-- Migration 0003: Properties, owners, media

create table if not exists public.property_owners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  emirates_id text,
  passport_no text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_property_owners_name on public.property_owners (name);
create index idx_property_owners_deleted on public.property_owners (deleted_at);

create trigger trg_property_owners_updated_at
  before update on public.property_owners
  for each row execute function public.set_updated_at();

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  ref_no text unique not null default ('PRP-' || lpad((extract(epoch from now())::bigint % 1000000)::text, 6, '0')),
  title text not null,
  description text,
  purpose property_purpose not null default 'sale',
  category property_category not null default 'apartment',
  status property_status not null default 'available',
  community text,
  building text,
  unit_no text,
  city text not null default 'Dubai',
  bedrooms int,
  bathrooms int,
  size_sqft numeric,
  parking int,
  price bigint not null default 0,
  service_charge bigint,
  owner_id uuid references public.property_owners on delete set null,
  trakheesi_permit_no text,
  dtcm_permit_no text,
  furnishing text,
  amenities text[],
  assigned_to uuid references public.profiles on delete set null,
  featured boolean not null default false,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_properties_status on public.properties (status);
create index idx_properties_purpose on public.properties (purpose);
create index idx_properties_category on public.properties (category);
create index idx_properties_community on public.properties (community);
create index idx_properties_owner on public.properties (owner_id);
create index idx_properties_assigned on public.properties (assigned_to);
create index idx_properties_deleted on public.properties (deleted_at);
create index idx_properties_price on public.properties (price);

create trigger trg_properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

create table if not exists public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties on delete cascade,
  storage_path text not null,
  kind text not null default 'photo',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_property_media_property on public.property_media (property_id);
create index idx_property_media_sort on public.property_media (property_id, sort_order);

-- RLS

alter table public.property_owners enable row level security;

create policy "property_owners_read" on public.property_owners
  for select using (deleted_at is null);

create policy "property_owners_write" on public.property_owners
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager', 'agent'))
  );

alter table public.properties enable row level security;

create policy "properties_read" on public.properties
  for select using (deleted_at is null);

create policy "properties_write" on public.properties
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager', 'agent'))
  );

alter table public.property_media enable row level security;

create policy "property_media_read" on public.property_media
  for select using (true);

create policy "property_media_write" on public.property_media
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager', 'agent'))
  );
