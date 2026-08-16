-- Remaining lead picklists: tags, score bands, lost/junk reasons.
-- Drop leftover enums now that those columns are (or become) text.

alter table public.leads alter column status drop default;
alter table public.leads
  alter column status type text using status::text;
alter table public.leads alter column status set default 'new';

insert into public.lead_field_options (field_key, value, label, sort, extra) values
  ('score', 'cold', 'Cold', 10, '{"min_score": 0, "max_score": 39}'::jsonb),
  ('score', 'warm', 'Warm', 20, '{"min_score": 40, "max_score": 69}'::jsonb),
  ('score', 'hot', 'Hot', 30, '{"min_score": 70, "max_score": 100}'::jsonb)
on conflict (field_key, value) do nothing;

insert into public.lead_field_options (field_key, value, label, sort)
select
  'tags',
  left(trim(both '_' from regexp_replace(lower(tag), '[^a-z0-9]+', '_', 'g')), 64),
  tag,
  10 * row_number() over (order by tag)
from (
  select distinct trim(tag) as tag
  from public.leads, unnest(coalesce(tags, '{}'::text[])) as tag
  where trim(tag) <> ''
) named
where left(trim(both '_' from regexp_replace(lower(tag), '[^a-z0-9]+', '_', 'g')), 64) <> ''
on conflict (field_key, value) do nothing;

insert into public.lead_field_options (field_key, value, label, sort) values
  ('tags', 'vip', 'VIP', 1000),
  ('tags', 'investor', 'Investor', 1010),
  ('tags', 'viewing_booked', 'Viewing booked', 1020)
on conflict (field_key, value) do nothing;

insert into public.lead_field_options (field_key, value, label, sort)
select
  case when kind = 'junk' then 'junk_reason' else 'lost_reason' end,
  left(trim(both '_' from regexp_replace(lower(label), '[^a-z0-9]+', '_', 'g')), 64),
  label,
  sort
from public.lost_reasons
where is_active
  and left(trim(both '_' from regexp_replace(lower(label), '[^a-z0-9]+', '_', 'g')), 64) <> ''
on conflict (field_key, value) do nothing;

drop type if exists public.lead_source;
drop type if exists public.lead_interest;
drop type if exists public.lead_status;

notify pgrst, 'reload schema';
