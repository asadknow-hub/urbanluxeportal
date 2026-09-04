-- Restore primary inventory link on deals (dropped in 0021).

alter table public.deals
  add column if not exists property_id uuid references public.properties (id) on delete set null;

create index if not exists idx_deals_property on public.deals (property_id)
  where property_id is not null;

-- Allow "confirmed" as the deal's chosen inventory unit (alongside shortlist roles).
alter table public.deal_properties drop constraint if exists deal_properties_role_check;
alter table public.deal_properties
  add constraint deal_properties_role_check
  check (role in ('requirement', 'suggested', 'shortlisted', 'viewed', 'offered', 'confirmed'));

-- Prefer an explicit confirmed/offered shortlist row; otherwise earliest link.
update public.deals d
set property_id = src.property_id
from (
  select distinct on (dp.deal_id)
    dp.deal_id,
    dp.property_id
  from public.deal_properties dp
  order by
    dp.deal_id,
    case
      when dp.role in ('confirmed', 'offered') then 0
      else 1
    end,
    dp.created_at asc
) src
where d.id = src.deal_id
  and d.property_id is null
  and d.deleted_at is null;

notify pgrst, 'reload schema';
