-- Nationality lookup (CRUD in Lead Settings) plus follow-up history rows.

alter table public.leads add column if not exists nationality text;

create table if not exists public.lead_nationalities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_norm text generated always as (lower(btrim(name))) stored,
  created_at timestamptz not null default now(),
  constraint lead_nationalities_name_norm_key unique (name_norm)
);

create index if not exists lead_nationalities_name_idx on public.lead_nationalities (name);

alter table public.lead_nationalities enable row level security;

drop policy if exists "lead_nationalities_read" on public.lead_nationalities;
create policy "lead_nationalities_read" on public.lead_nationalities
  for select using (auth.uid() is not null);

drop policy if exists "lead_nationalities_write" on public.lead_nationalities;
create policy "lead_nationalities_write" on public.lead_nationalities
  for all using (public.has_role(array['admin','manager']));

insert into public.lead_nationalities (name) values
  ('Afghan'), ('Albanian'), ('Algerian'), ('American'), ('Andorran'), ('Angolan'),
  ('Antiguan'), ('Argentine'), ('Armenian'), ('Australian'), ('Austrian'), ('Azerbaijani'),
  ('Bahamian'), ('Bahraini'), ('Bangladeshi'), ('Barbadian'), ('Belarusian'), ('Belgian'),
  ('Belizean'), ('Beninese'), ('Bhutanese'), ('Bolivian'), ('Bosnian'), ('Botswanan'),
  ('Brazilian'), ('British'), ('Bruneian'), ('Bulgarian'), ('Burkinabe'), ('Burundian'),
  ('Cabo Verdean'), ('Cambodian'), ('Cameroonian'), ('Canadian'), ('Central African'),
  ('Chadian'), ('Chilean'), ('Chinese'), ('Colombian'), ('Comorian'), ('Congolese'),
  ('Costa Rican'), ('Croatian'), ('Cuban'), ('Cypriot'), ('Czech'), ('Danish'),
  ('Djiboutian'), ('Dominican'), ('Dutch'), ('Ecuadorian'), ('Egyptian'), ('Emirati'),
  ('Equatorial Guinean'), ('Eritrean'), ('Estonian'), ('Eswatini'), ('Ethiopian'),
  ('Fijian'), ('Filipino'), ('Finnish'), ('French'), ('Gabonese'), ('Gambian'),
  ('Georgian'), ('German'), ('Ghanaian'), ('Greek'), ('Grenadian'), ('Guatemalan'),
  ('Guinean'), ('Guyanese'), ('Haitian'), ('Honduran'), ('Hungarian'), ('Icelandic'),
  ('Indian'), ('Indonesian'), ('Iranian'), ('Iraqi'), ('Irish'), ('Israeli'),
  ('Italian'), ('Ivorian'), ('Jamaican'), ('Japanese'), ('Jordanian'), ('Kazakh'),
  ('Kenyan'), ('Kiribati'), ('Kuwaiti'), ('Kyrgyz'), ('Lao'), ('Latvian'),
  ('Lebanese'), ('Lesotho'), ('Liberian'), ('Libyan'), ('Liechtensteiner'),
  ('Lithuanian'), ('Luxembourgish'), ('Malagasy'), ('Malawian'), ('Malaysian'),
  ('Maldivian'), ('Malian'), ('Maltese'), ('Marshallese'), ('Mauritanian'),
  ('Mauritian'), ('Mexican'), ('Micronesian'), ('Moldovan'), ('Monegasque'),
  ('Mongolian'), ('Montenegrin'), ('Moroccan'), ('Mozambican'), ('Myanmar'),
  ('Namibian'), ('Nauruan'), ('Nepali'), ('New Zealander'), ('Nicaraguan'),
  ('Nigerian'), ('Nigerien'), ('North Korean'), ('North Macedonian'), ('Norwegian'),
  ('Omani'), ('Pakistani'), ('Palauan'), ('Palestinian'), ('Panamanian'),
  ('Papua New Guinean'), ('Paraguayan'), ('Peruvian'), ('Polish'), ('Portuguese'),
  ('Qatari'), ('Romanian'), ('Russian'), ('Rwandan'), ('Saint Lucian'),
  ('Salvadoran'), ('Samoan'), ('San Marinese'), ('Sao Tomean'), ('Saudi'),
  ('Senegalese'), ('Serbian'), ('Seychellois'), ('Sierra Leonean'), ('Singaporean'),
  ('Slovak'), ('Slovenian'), ('Solomon Islander'), ('Somali'), ('South African'),
  ('South Korean'), ('South Sudanese'), ('Spanish'), ('Sri Lankan'), ('Sudanese'),
  ('Surinamese'), ('Swedish'), ('Swiss'), ('Syrian'), ('Taiwanese'), ('Tajik'),
  ('Tanzanian'), ('Thai'), ('Timorese'), ('Togolese'), ('Tongan'), ('Trinidadian'),
  ('Tunisian'), ('Turkish'), ('Turkmen'), ('Tuvaluan'), ('Ugandan'), ('Ukrainian'),
  ('Uruguayan'), ('Uzbek'), ('Vanuatuan'), ('Venezuelan'), ('Vietnamese'),
  ('Yemeni'), ('Zambian'), ('Zimbabwean')
on conflict (name_norm) do nothing;

create table if not exists public.lead_follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  scheduled_at timestamptz not null,
  completed_at timestamptz,
  status text not null default 'scheduled',
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_follow_ups_status_check check (status in ('scheduled', 'done', 'snoozed', 'skipped'))
);

create index if not exists lead_follow_ups_lead_idx on public.lead_follow_ups (lead_id, scheduled_at desc);
create index if not exists lead_follow_ups_open_idx on public.lead_follow_ups (lead_id) where status = 'scheduled';

alter table public.lead_follow_ups enable row level security;

drop policy if exists "lead_follow_ups_read" on public.lead_follow_ups;
create policy "lead_follow_ups_read" on public.lead_follow_ups
  for select using (auth.uid() is not null);

drop policy if exists "lead_follow_ups_write" on public.lead_follow_ups;
create policy "lead_follow_ups_write" on public.lead_follow_ups
  for all using (auth.uid() is not null);

insert into public.lead_follow_ups (lead_id, scheduled_at, status, notes, created_by)
select l.id, l.next_follow_up_at, 'scheduled', 'Imported from next follow-up', l.created_by
from public.leads l
where l.next_follow_up_at is not null
  and l.deleted_at is null
  and not exists (
    select 1 from public.lead_follow_ups f
    where f.lead_id = l.id and f.status = 'scheduled'
  );

comment on table public.lead_nationalities is
  'Managed nationality dropdown for leads. Seeded with world demonyms; editable in Lead Settings.';
comment on table public.lead_follow_ups is
  'Follow-up history per lead. leads.next_follow_up_at is the current open slot.';
comment on column public.leads.nationality is
  'Selected nationality name from lead_nationalities.';
