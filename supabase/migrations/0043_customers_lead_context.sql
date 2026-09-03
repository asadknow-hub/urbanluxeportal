-- Repair: customers.lead_context was missing in production (finalize_deal_to_customer needs it).

alter table public.customers
  add column if not exists lead_context jsonb;

create index if not exists idx_customers_lead_context on public.customers using gin (lead_context);

comment on column public.customers.lead_context is
  'Snapshot of lead preference fields carried through convert / finalize.';
