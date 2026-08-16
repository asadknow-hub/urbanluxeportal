-- Clock for stage SLA: how long a lead has sat in the current stage.

alter table public.leads
  add column if not exists stage_entered_at timestamptz;

update public.leads l
set stage_entered_at = coalesce(
  (
    select max(a.occurred_at)
    from public.lead_activities a
    where a.lead_id = l.id
      and a.type in ('stage_change', 'status_change')
  ),
  l.created_at,
  now()
)
where l.stage_entered_at is null;

alter table public.leads
  alter column stage_entered_at set default now();

alter table public.leads
  alter column stage_entered_at set not null;

comment on column public.leads.stage_entered_at is
  'When the lead entered the current pipeline stage. Used for day X of Y SLA.';

-- Give every open stage a dwell limit so the clock works for all live leads.
update public.lead_stages
set stale_after_days = 1
where kind = 'open'
  and name = 'New'
  and stale_after_days is null;

update public.lead_stages
set stale_after_days = 3
where kind = 'open'
  and stale_after_days is null;
