-- Document categories can capture an expiry date or a free-text note (not both).
-- IDs, visas, and similar keep expiry; contracts and receipts default to a note.

alter table public.documents
  add column if not exists notes text;

comment on column public.documents.notes is
  'Optional note when the document category does not use an expiry date.';

update public.lead_field_options
set extra = coalesce(extra, '{}'::jsonb) || jsonb_build_object('capture', 'expiry')
where field_key = 'doc_category'
  and value in ('emirates_id', 'passport', 'visa', 'tenancy_contract', 'permit', 'noc', 'brn');

update public.lead_field_options
set extra = coalesce(extra, '{}'::jsonb) || jsonb_build_object('capture', 'note')
where field_key = 'doc_category'
  and coalesce(extra->>'capture', '') not in ('expiry', 'note');
