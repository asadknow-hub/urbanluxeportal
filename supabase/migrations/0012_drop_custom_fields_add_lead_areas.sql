-- Drop custom field definitions and start a live preferred-areas list.
-- leads.custom JSONB is cleared (kept as an empty object for later use).

drop function if exists public.deactivate_custom_field(uuid, boolean);
drop table if exists public.custom_field_defs cascade;

update public.leads
set custom = '{}'::jsonb
where custom is distinct from '{}'::jsonb;

create table if not exists public.lead_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_norm text generated always as (lower(btrim(name))) stored,
  created_at timestamptz not null default now(),
  constraint lead_areas_name_norm_key unique (name_norm)
);

create index if not exists lead_areas_name_idx on public.lead_areas (name);

alter table public.lead_areas enable row level security;

drop policy if exists "lead_areas_read" on public.lead_areas;
create policy "lead_areas_read" on public.lead_areas
  for select using (auth.uid() is not null);

drop policy if exists "lead_areas_write" on public.lead_areas;
create policy "lead_areas_write" on public.lead_areas
  for all using (public.has_role(array['admin','manager']));

create or replace function public.lead_table_columns()
returns table (
  column_name text,
  data_type text,
  udt_name text,
  ordinal_position integer
)
language sql
stable
security definer
set search_path = pg_catalog, information_schema
as $$
  select
    c.column_name::text,
    c.data_type::text,
    c.udt_name::text,
    c.ordinal_position::integer
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'leads'
  order by c.ordinal_position;
$$;

revoke all on function public.lead_table_columns() from public;
grant execute on function public.lead_table_columns() to authenticated;
grant execute on function public.lead_table_columns() to service_role;

comment on table public.lead_areas is
  'Managed list of Dubai areas for lead preferred_areas. Empty until uploaded or pasted in Lead Settings.';
comment on function public.lead_table_columns() is
  'Live columns of public.leads for the Lead Settings fields list.';
