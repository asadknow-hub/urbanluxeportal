-- Social links on company_settings + careers CV storage

alter table public.company_settings
  add column if not exists linkedin_url text,
  add column if not exists instagram_url text;

comment on column public.company_settings.linkedin_url is 'Public LinkedIn company page URL';
comment on column public.company_settings.instagram_url is 'Public Instagram profile URL';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'careers',
  'careers',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

-- Service role uploads from Next.js; no public write policies required.
drop policy if exists "careers_bucket_admin_read" on storage.objects;
create policy "careers_bucket_admin_read" on storage.objects
  for select using (
    bucket_id = 'careers' and public.is_admin()
  );
