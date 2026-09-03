-- Restore property_media (dropped in 0021) with inventory RLS.
-- Photos live in the existing property-media storage bucket.

create table if not exists public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties on delete cascade,
  storage_path text not null,
  kind text not null default 'photo'
    check (kind in ('photo', 'floorplan', 'video')),
  caption text,
  sort_order int not null default 0,
  uploaded_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_property_media_property
  on public.property_media (property_id)
  where deleted_at is null;

create index if not exists idx_property_media_sort
  on public.property_media (property_id, sort_order)
  where deleted_at is null;

alter table public.property_media enable row level security;
alter table public.property_media force row level security;

drop policy if exists "property_media_read" on public.property_media;
create policy "property_media_read" on public.property_media
  for select using (
    deleted_at is null
    and auth.uid() is not null
  );

drop policy if exists "property_media_write" on public.property_media;
drop policy if exists "property_media_insert" on public.property_media;
create policy "property_media_insert" on public.property_media
  for insert with check (public.crm_can_write_inventory());

drop policy if exists "property_media_update" on public.property_media;
create policy "property_media_update" on public.property_media
  for update using (public.crm_can_write_inventory())
  with check (public.crm_can_write_inventory());

drop policy if exists "property_media_delete" on public.property_media;
create policy "property_media_delete" on public.property_media
  for delete using (public.crm_can_write_inventory());

-- Listing photos are served publicly; writes stay inventory-gated.
update storage.buckets
set public = true
where id = 'property-media';

drop policy if exists "property_media_bucket_read" on storage.objects;
create policy "property_media_bucket_read" on storage.objects
  for select using (bucket_id = 'property-media');

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
