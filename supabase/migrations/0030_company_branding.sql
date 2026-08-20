-- Branding extras on company_settings + public logo storage bucket

alter table public.company_settings
  add column if not exists whatsapp text,
  add column if not exists tagline text,
  add column if not exists logo_dark_url text;

comment on column public.company_settings.logo_url is 'Primary logo (public header + admin)';
comment on column public.company_settings.logo_dark_url is 'Optional logo for dark backgrounds (footer)';
comment on column public.company_settings.whatsapp is 'WhatsApp number digits, country code without +';
comment on column public.company_settings.tagline is 'Public site tagline';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branding',
  'branding',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/x-icon']
)
on conflict (id) do nothing;

drop policy if exists "branding_bucket_public_read" on storage.objects;
create policy "branding_bucket_public_read" on storage.objects
  for select using (bucket_id = 'branding');

drop policy if exists "branding_bucket_admin_write" on storage.objects;
create policy "branding_bucket_admin_write" on storage.objects
  for insert with check (
    bucket_id = 'branding' and public.is_admin()
  );

drop policy if exists "branding_bucket_admin_update" on storage.objects;
create policy "branding_bucket_admin_update" on storage.objects
  for update using (
    bucket_id = 'branding' and public.is_admin()
  );

drop policy if exists "branding_bucket_admin_delete" on storage.objects;
create policy "branding_bucket_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'branding' and public.is_admin()
  );
