-- Document categories become a managed picklist (same as other lead field options).
-- Remove unused Lead Settings tabs: capture sources, field mapping, doc requirements.

alter table public.documents alter column category drop default;
alter table public.documents
  alter column category type text using category::text;
alter table public.documents alter column category set default 'other';

insert into public.lead_field_options (field_key, value, label, sort) values
  ('doc_category', 'emirates_id', 'Emirates ID', 10),
  ('doc_category', 'passport', 'Passport', 20),
  ('doc_category', 'visa', 'Visa', 30),
  ('doc_category', 'title_deed', 'Title deed', 40),
  ('doc_category', 'mou', 'MOU', 50),
  ('doc_category', 'tenancy_contract', 'Tenancy contract', 60),
  ('doc_category', 'noc', 'N.O.C.', 70),
  ('doc_category', 'cheque_copy', 'Cheque copy', 80),
  ('doc_category', 'permit', 'Permit', 90),
  ('doc_category', 'contract', 'Contract', 100),
  ('doc_category', 'brn', 'BRN', 110),
  ('doc_category', 'invoice', 'Invoice', 120),
  ('doc_category', 'receipt', 'Receipt', 130),
  ('doc_category', 'marketing', 'Marketing', 140),
  ('doc_category', 'other', 'Other', 150)
on conflict (field_key, value) do nothing;

drop table if exists public.lead_doc_requirements cascade;
drop table if exists public.web_forms cascade;

alter table public.leads drop column if exists source_id;
alter table public.form_submissions drop column if exists source_id;

drop table if exists public.lead_sources cascade;

drop type if exists public.doc_category;

notify pgrst, 'reload schema';
