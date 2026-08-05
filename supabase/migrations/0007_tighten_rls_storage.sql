-- Migration 0007: Tighten RLS on quotations, quotation_items, documents
-- and create Supabase Storage buckets for documents and property-media

-- ============================================================
-- Tighten quotations RLS (was: auth.uid() is not null — too permissive)
-- ============================================================

drop policy if exists "quotations_write" on public.quotations;
create policy "quotations_write" on public.quotations
  for all using (
    public.has_role(array['admin', 'manager', 'agent', 'accountant'])
  );

drop policy if exists "quotation_items_write" on public.quotation_items;
create policy "quotation_items_write" on public.quotation_items
  for all using (
    public.has_role(array['admin', 'manager', 'agent', 'accountant'])
  );

-- ============================================================
-- Tighten documents RLS (was: auth.uid() is not null — too permissive)
-- ============================================================

drop policy if exists "documents_write" on public.documents;
create policy "documents_write" on public.documents
  for all using (auth.uid() is not null);

-- Documents read: only authenticated users (not public)
drop policy if exists "documents_read" on public.documents;
create policy "documents_read" on public.documents
  for select using (
    deleted_at is null and auth.uid() is not null
  );

-- ============================================================
-- Storage buckets (created via SQL — Supabase supports this)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('documents', 'documents', false, 26214400, null),
  ('property-media', 'property-media', false, 26214400, null)
on conflict (id) do nothing;

-- Storage RLS: documents bucket — only authenticated users can upload/read
-- Path convention: {entity_type}/{entity_id}/{uuid}-{filename}

drop policy if exists "documents_bucket_read" on storage.objects;
create policy "documents_bucket_read" on storage.objects
  for select using (
    bucket_id = 'documents' and auth.uid() is not null
  );

drop policy if exists "documents_bucket_write" on storage.objects;
create policy "documents_bucket_write" on storage.objects
  for insert with check (
    bucket_id = 'documents' and auth.uid() is not null
  );

drop policy if exists "documents_bucket_delete" on storage.objects;
create policy "documents_bucket_delete" on storage.objects
  for delete using (
    bucket_id = 'documents' and auth.uid() is not null
  );

-- Storage RLS: property-media bucket — only authenticated agents/managers/admins
drop policy if exists "property_media_bucket_read" on storage.objects;
create policy "property_media_bucket_read" on storage.objects
  for select using (
    bucket_id = 'property-media' and auth.uid() is not null
  );

drop policy if exists "property_media_bucket_write" on storage.objects;
create policy "property_media_bucket_write" on storage.objects
  for insert with check (
    bucket_id = 'property-media' and public.has_role(array['admin', 'manager', 'agent'])
  );

drop policy if exists "property_media_bucket_delete" on storage.objects;
create policy "property_media_bucket_delete" on storage.objects
  for delete using (
    bucket_id = 'property-media' and public.has_role(array['admin', 'manager', 'agent'])
  );
