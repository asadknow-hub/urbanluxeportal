-- Lead Flow: preserve lead snapshot on customer and deal at conversion time
alter table public.customers
  add column if not exists lead_id uuid references public.leads on delete set null,
  add column if not exists status text not null default 'active',
  add column if not exists lead_context jsonb;

alter table public.deals
  add column if not exists lead_id uuid references public.leads on delete set null,
  add column if not exists lead_context jsonb;

create index if not exists idx_customers_lead_context on public.customers using gin (lead_context);
create index if not exists idx_deals_lead_context on public.deals using gin (lead_context);
