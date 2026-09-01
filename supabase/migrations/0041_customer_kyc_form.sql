-- Extended individual KYC form (Urban Luxe PDF fields beyond core identity columns).
alter table public.customers
  add column if not exists kyc_form jsonb not null default '{}'::jsonb;

comment on column public.customers.kyc_form is
  'Individual KYC application fields (PEP, address, financial, employment) for PDF export.';
