-- Migration 0050: Count in_person / phone contacts for first-response SLA
-- Aligns crm_stamp_first_responded with HUMAN_LEAD_ACTIVITY_TYPES (contact UI).

create or replace function public.crm_stamp_first_responded()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'lead_activities' then
    if new.type not in (
      'note',
      'call',
      'whatsapp',
      'email',
      'phone',
      'in_person',
      'follow_up_done',
      'follow_up_scheduled'
    ) then
      return new;
    end if;
    update public.leads
    set first_responded_at = coalesce(first_responded_at, now())
    where id = new.lead_id
      and first_responded_at is null
      and deleted_at is null;
  elsif tg_table_name = 'lead_viewings' and new.lead_id is not null then
    update public.leads
    set first_responded_at = coalesce(first_responded_at, now())
    where id = new.lead_id
      and first_responded_at is null
      and deleted_at is null;
  end if;
  return new;
end;
$$;

-- Backfill leads that already had in_person / phone contact but never stamped.
update public.leads l
set first_responded_at = sub.first_at
from (
  select a.lead_id, min(a.occurred_at) as first_at
  from public.lead_activities a
  where a.type in ('phone', 'in_person')
  group by a.lead_id
) sub
where l.id = sub.lead_id
  and l.first_responded_at is null
  and l.deleted_at is null;
