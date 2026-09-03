-- Proposed properties linked to a lead (agent pitch / inventory connect).

create table if not exists public.lead_properties (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads on delete cascade,
  property_id uuid not null references public.properties on delete cascade,
  listing_id uuid references public.listings on delete set null,
  role text not null default 'proposed'
    check (role in ('proposed', 'suggested', 'shortlisted', 'viewed', 'offered')),
  notes text,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  unique (lead_id, property_id)
);

create index if not exists idx_lead_properties_lead on public.lead_properties (lead_id);
create index if not exists idx_lead_properties_property on public.lead_properties (property_id);

alter table public.lead_properties enable row level security;
alter table public.lead_properties force row level security;

drop policy if exists "lead_properties_read" on public.lead_properties;
create policy "lead_properties_read" on public.lead_properties
  for select using (public.crm_can_read_lead_id(lead_id));

drop policy if exists "lead_properties_insert" on public.lead_properties;
create policy "lead_properties_insert" on public.lead_properties
  for insert with check (public.crm_can_write_lead_id(lead_id));

drop policy if exists "lead_properties_update" on public.lead_properties;
create policy "lead_properties_update" on public.lead_properties
  for update using (public.crm_can_write_lead_id(lead_id))
  with check (public.crm_can_write_lead_id(lead_id));

drop policy if exists "lead_properties_delete" on public.lead_properties;
create policy "lead_properties_delete" on public.lead_properties
  for delete using (public.crm_can_write_lead_id(lead_id));

notify pgrst, 'reload schema';
