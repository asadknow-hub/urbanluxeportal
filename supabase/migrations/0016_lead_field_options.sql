-- Managed picklists for lead snapshot fields (Interest, Source, Budget, etc.).
-- leads.source and leads.interest become text so settings can add values
-- without ALTER TYPE.

alter table public.leads alter column source drop default;
alter table public.leads
  alter column source type text using source::text;
alter table public.leads alter column source set default 'other';

alter table public.leads alter column interest drop default;
alter table public.leads
  alter column interest type text using interest::text;
alter table public.leads alter column interest set default 'buy';

create table if not exists public.lead_field_options (
  id uuid primary key default gen_random_uuid(),
  field_key text not null,
  value text not null,
  label text not null,
  sort int not null default 0,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint lead_field_options_field_value unique (field_key, value)
);

create index if not exists lead_field_options_field_sort_idx
  on public.lead_field_options (field_key, sort, label);

alter table public.lead_field_options enable row level security;

drop policy if exists "lead_field_options_read" on public.lead_field_options;
create policy "lead_field_options_read" on public.lead_field_options
  for select using (auth.uid() is not null);

drop policy if exists "lead_field_options_write" on public.lead_field_options;
create policy "lead_field_options_write" on public.lead_field_options
  for all using (public.has_role(array['admin','manager']));

comment on table public.lead_field_options is
  'Picklist values for lead fields shown in Lead Settings → Fields and on lead detail/create.';

insert into public.lead_field_options (field_key, value, label, sort) values
  ('source', 'website', 'Website', 10),
  ('source', 'bayut', 'Bayut', 20),
  ('source', 'property_finder', 'Property Finder', 30),
  ('source', 'dubizzle', 'Dubizzle', 40),
  ('source', 'referral', 'Referral', 50),
  ('source', 'walk_in', 'Walk-in', 60),
  ('source', 'social', 'Social', 70),
  ('source', 'other', 'Other', 80),
  ('interest', 'buy', 'Buy', 10),
  ('interest', 'rent', 'Rent', 20),
  ('interest', 'sell', 'Sell', 30),
  ('interest', 'off_plan', 'Off-plan', 40),
  ('interest', 'commercial', 'Commercial', 50),
  ('category', 'apartment', 'Apartment', 10),
  ('category', 'villa', 'Villa', 20),
  ('category', 'townhouse', 'Townhouse', 30),
  ('category', 'penthouse', 'Penthouse', 40),
  ('category', 'plot', 'Plot', 50),
  ('category', 'commercial', 'Commercial', 60),
  ('category', 'off_plan', 'Off-plan', 70),
  ('bedrooms', 'studio', 'Studio', 10),
  ('bedrooms', '1', '1', 20),
  ('bedrooms', '2', '2', 30),
  ('bedrooms', '3', '3', 40),
  ('bedrooms', '4', '4', 50),
  ('bedrooms', '5+', '5+', 60),
  ('purpose', 'end_user', 'End user', 10),
  ('purpose', 'investment', 'Investment', 20),
  ('purpose', 'both', 'Both', 30),
  ('timeframe', 'immediate', 'Immediate', 10),
  ('timeframe', '1_month', '1 month', 20),
  ('timeframe', '3_months', '3 months', 30),
  ('timeframe', '6_months', '6 months', 40),
  ('timeframe', '12_months', '12 months', 50),
  ('financing', 'cash', 'Cash', 10),
  ('financing', 'mortgage', 'Mortgage', 20),
  ('financing', 'pre_approved', 'Pre-approved', 30),
  ('financing', 'undecided', 'Undecided', 40)
on conflict (field_key, value) do nothing;

-- Budget bands in fils (AED × 100), covering the seeded lead ranges.
insert into public.lead_field_options (field_key, value, label, sort, extra) values
  ('budget', '50k_100k', 'AED 50K – 100K', 10, '{"min_fils": 5000000, "max_fils": 10000000}'::jsonb),
  ('budget', '100k_500k', 'AED 100K – 500K', 20, '{"min_fils": 10000000, "max_fils": 50000000}'::jsonb),
  ('budget', '500k_1m', 'AED 500K – 1.0M', 30, '{"min_fils": 50000000, "max_fils": 100000000}'::jsonb),
  ('budget', '1m_2m', 'AED 1.0M – 2.0M', 40, '{"min_fils": 100000000, "max_fils": 200000000}'::jsonb),
  ('budget', '1_5m_2_5m', 'AED 1.5M – 2.5M', 50, '{"min_fils": 150000000, "max_fils": 250000000}'::jsonb),
  ('budget', '2m_3_5m', 'AED 2.0M – 3.5M', 60, '{"min_fils": 200000000, "max_fils": 350000000}'::jsonb),
  ('budget', '3m_5m', 'AED 3.0M – 5.0M', 70, '{"min_fils": 300000000, "max_fils": 500000000}'::jsonb),
  ('budget', '4m_6m', 'AED 4.0M – 6.0M', 80, '{"min_fils": 400000000, "max_fils": 600000000}'::jsonb)
on conflict (field_key, value) do nothing;
