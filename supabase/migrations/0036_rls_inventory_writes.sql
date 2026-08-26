-- R3: inventory catalog writes are CRM managers (admin / manager / reception).
-- All staff still read the catalog (matching, viewings, shortlist).
-- Deal shortlist writes follow the deal, not the catalog.

create or replace function public.crm_can_write_inventory()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- reception inherits manager inside has_role()
  select public.has_role(array['admin', 'manager']);
$$;

create or replace function public.crm_can_write_deal(p_assigned_to uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.crm_can_write_inventory() or p_assigned_to = auth.uid();
$$;

create or replace function public.crm_can_write_deal_id(p_deal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select public.crm_can_write_deal(d.assigned_to)
      from public.deals d
      where d.id = p_deal_id
        and d.deleted_at is null
    ),
    false
  );
$$;

revoke all on function public.crm_can_write_inventory() from public;
revoke all on function public.crm_can_write_deal(uuid) from public;
revoke all on function public.crm_can_write_deal_id(uuid) from public;

grant execute on function public.crm_can_write_inventory() to authenticated, service_role;
grant execute on function public.crm_can_write_deal(uuid) to authenticated, service_role;
grant execute on function public.crm_can_write_deal_id(uuid) to authenticated, service_role;

-- ============================================================
-- Catalog writes
-- ============================================================

drop policy if exists "developers_write" on public.developers;
drop policy if exists "developers_insert" on public.developers;
drop policy if exists "developers_update" on public.developers;
drop policy if exists "developers_delete" on public.developers;
create policy "developers_insert" on public.developers
  for insert with check (public.crm_can_write_inventory());
create policy "developers_update" on public.developers
  for update using (public.crm_can_write_inventory())
  with check (public.crm_can_write_inventory());
create policy "developers_delete" on public.developers
  for delete using (public.crm_can_write_inventory());

drop policy if exists "projects_write" on public.projects;
drop policy if exists "projects_insert" on public.projects;
drop policy if exists "projects_update" on public.projects;
drop policy if exists "projects_delete" on public.projects;
create policy "projects_insert" on public.projects
  for insert with check (public.crm_can_write_inventory());
create policy "projects_update" on public.projects
  for update using (public.crm_can_write_inventory())
  with check (public.crm_can_write_inventory());
create policy "projects_delete" on public.projects
  for delete using (public.crm_can_write_inventory());

drop policy if exists "properties_write" on public.properties;
drop policy if exists "properties_insert" on public.properties;
drop policy if exists "properties_update" on public.properties;
drop policy if exists "properties_delete" on public.properties;
create policy "properties_insert" on public.properties
  for insert with check (public.crm_can_write_inventory());
create policy "properties_update" on public.properties
  for update using (public.crm_can_write_inventory())
  with check (public.crm_can_write_inventory());
create policy "properties_delete" on public.properties
  for delete using (public.crm_can_write_inventory());

drop policy if exists "listings_write" on public.listings;
drop policy if exists "listings_insert" on public.listings;
drop policy if exists "listings_update" on public.listings;
drop policy if exists "listings_delete" on public.listings;
create policy "listings_insert" on public.listings
  for insert with check (public.crm_can_write_inventory());
create policy "listings_update" on public.listings
  for update using (public.crm_can_write_inventory())
  with check (public.crm_can_write_inventory());
create policy "listings_delete" on public.listings
  for delete using (public.crm_can_write_inventory());

alter table public.developers force row level security;
alter table public.projects force row level security;
alter table public.properties force row level security;
alter table public.listings force row level security;

-- ============================================================
-- Deal shortlist + closed-deal units
-- ============================================================

drop policy if exists "deal_properties_write" on public.deal_properties;
drop policy if exists "deal_properties_insert" on public.deal_properties;
drop policy if exists "deal_properties_update" on public.deal_properties;
drop policy if exists "deal_properties_delete" on public.deal_properties;
create policy "deal_properties_insert" on public.deal_properties
  for insert with check (public.crm_can_write_deal_id(deal_id));
create policy "deal_properties_update" on public.deal_properties
  for update using (public.crm_can_write_deal_id(deal_id))
  with check (public.crm_can_write_deal_id(deal_id));
create policy "deal_properties_delete" on public.deal_properties
  for delete using (public.crm_can_write_deal_id(deal_id));

drop policy if exists "customer_properties_read" on public.customer_properties;
create policy "customer_properties_read" on public.customer_properties
  for select using (public.crm_can_read_customer_id(customer_id));

drop policy if exists "customer_properties_insert" on public.customer_properties;
create policy "customer_properties_insert" on public.customer_properties
  for insert with check (public.crm_can_read_customer_id(customer_id) and public.crm_can_write_inventory());

drop policy if exists "customer_properties_update" on public.customer_properties;
create policy "customer_properties_update" on public.customer_properties
  for update using (public.crm_can_read_customer_id(customer_id) and public.crm_can_write_inventory())
  with check (public.crm_can_read_customer_id(customer_id) and public.crm_can_write_inventory());

alter table public.deal_properties force row level security;
alter table public.customer_properties force row level security;

-- ============================================================
-- property-media bucket (table was dropped; keep the bucket locked)
-- ============================================================

drop policy if exists "property_media_bucket_write" on storage.objects;
create policy "property_media_bucket_write" on storage.objects
  for insert with check (
    bucket_id = 'property-media' and public.crm_can_write_inventory()
  );

drop policy if exists "property_media_bucket_update" on storage.objects;
create policy "property_media_bucket_update" on storage.objects
  for update using (
    bucket_id = 'property-media' and public.crm_can_write_inventory()
  )
  with check (
    bucket_id = 'property-media' and public.crm_can_write_inventory()
  );

drop policy if exists "property_media_bucket_delete" on storage.objects;
create policy "property_media_bucket_delete" on storage.objects
  for delete using (
    bucket_id = 'property-media' and public.crm_can_write_inventory()
  );

notify pgrst, 'reload schema';
