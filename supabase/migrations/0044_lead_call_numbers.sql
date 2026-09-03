-- Call numbers on leads (dial phones; WhatsApp stays on phone). Multiple values.

alter table public.leads
  add column if not exists call_numbers text[] not null default '{}'::text[];

comment on column public.leads.call_numbers is
  'Additional dial numbers (not WhatsApp). Primary WhatsApp stays in phone.';

create index if not exists idx_leads_call_numbers on public.leads using gin (call_numbers);
