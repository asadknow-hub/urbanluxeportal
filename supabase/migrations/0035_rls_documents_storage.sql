-- R2: documents + documents-bucket inherit parent ownable reads.
-- Metadata writes still use the service role until R5; browser uploads and
-- signed URLs run as the user JWT, so storage policies must match SELECT.

-- ============================================================
-- Helpers
-- ============================================================

create or replace function public.crm_can_read_customer_id(p_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select public.crm_can_read_customer(c.assigned_to)
      from public.customers c
      where c.id = p_customer_id
        and c.deleted_at is null
    ),
    false
  );
$$;

create or replace function public.crm_can_read_document(p_entity_type text, p_entity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_entity_type is null or p_entity_id is null
      then public.crm_is_house()
    when lower(p_entity_type) = 'lead'
      then public.crm_can_read_lead_id(p_entity_id)
    when lower(p_entity_type) = 'deal'
      then public.crm_can_read_deal_id(p_entity_id)
    when lower(p_entity_type) = 'customer'
      then public.crm_can_read_customer_id(p_entity_id)
    when lower(p_entity_type) in ('staff', 'profile')
      then public.crm_is_house() or p_entity_id = auth.uid()
    else public.crm_is_house()
  end;
$$;

-- Canonical object key: {entity_type}/{entity_id}/...
create or replace function public.crm_can_read_storage_object(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_name is null or btrim(p_name) = ''
      then false
    when nullif(split_part(p_name, '/', 1), '') is null
      or split_part(p_name, '/', 1) in ('unfiled')
      or nullif(split_part(p_name, '/', 2), '') is null
      or split_part(p_name, '/', 2) in ('unassigned')
      then public.crm_is_house()
    when split_part(p_name, '/', 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.crm_can_read_document(
        split_part(p_name, '/', 1),
        split_part(p_name, '/', 2)::uuid
      )
    else false
  end;
$$;

revoke all on function public.crm_can_read_customer_id(uuid) from public;
revoke all on function public.crm_can_read_document(text, uuid) from public;
revoke all on function public.crm_can_read_storage_object(text) from public;

grant execute on function public.crm_can_read_customer_id(uuid) to authenticated, service_role;
grant execute on function public.crm_can_read_document(text, uuid) to authenticated, service_role;
grant execute on function public.crm_can_read_storage_object(text) to authenticated, service_role;

-- ============================================================
-- documents table
-- ============================================================

drop policy if exists "documents_read" on public.documents;
create policy "documents_read" on public.documents
  for select using (
    deleted_at is null
    and public.crm_can_read_document(entity_type, entity_id)
  );

drop policy if exists "documents_write" on public.documents;
drop policy if exists "documents_insert" on public.documents;
create policy "documents_insert" on public.documents
  for insert with check (public.crm_can_read_document(entity_type, entity_id));

drop policy if exists "documents_update" on public.documents;
create policy "documents_update" on public.documents
  for update using (public.crm_can_read_document(entity_type, entity_id))
  with check (public.crm_can_read_document(entity_type, entity_id));

drop policy if exists "documents_delete" on public.documents;
create policy "documents_delete" on public.documents
  for delete using (public.crm_can_read_document(entity_type, entity_id));

alter table public.documents force row level security;

-- ============================================================
-- documents bucket (browser upload + user-JWT signed URLs)
-- ============================================================

drop policy if exists "documents_bucket_read" on storage.objects;
create policy "documents_bucket_read" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (
      public.crm_can_read_storage_object(name)
      or exists (
        select 1
        from public.documents d
        where d.storage_path = name
          and d.deleted_at is null
          and public.crm_can_read_document(d.entity_type, d.entity_id)
      )
    )
  );

drop policy if exists "documents_bucket_write" on storage.objects;
create policy "documents_bucket_write" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and public.crm_can_read_storage_object(name)
  );

drop policy if exists "documents_bucket_update" on storage.objects;
create policy "documents_bucket_update" on storage.objects
  for update using (
    bucket_id = 'documents'
    and public.crm_can_read_storage_object(name)
  )
  with check (
    bucket_id = 'documents'
    and public.crm_can_read_storage_object(name)
  );

drop policy if exists "documents_bucket_delete" on storage.objects;
create policy "documents_bucket_delete" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and public.crm_can_read_storage_object(name)
  );

notify pgrst, 'reload schema';
