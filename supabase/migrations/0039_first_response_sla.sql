-- First-response SLA: clock starts on assignment. Website / portal / social =
-- 15 minutes; manual, import, and other sources = 24 hours. Human activity or
-- a booked viewing stamps first_responded_at. At 1x notify; at 2x reclaim to pool.

alter table public.leads
  add column if not exists first_response_due_at timestamptz,
  add column if not exists first_responded_at timestamptz,
  add column if not exists first_response_minutes integer,
  add column if not exists first_response_breached_at timestamptz;

create index if not exists leads_first_response_due_idx
  on public.leads (first_response_due_at)
  where first_responded_at is null
    and assigned_to is not null
    and deleted_at is null;

create or replace function public.crm_first_response_minutes(p_source text)
returns integer
language sql
immutable
as $$
  select case
    when lower(coalesce(p_source, '')) like 'website%' then 15
    when lower(coalesce(p_source, '')) in (
      'whatsapp', 'social', 'instagram', 'facebook', 'tiktok',
      'portal', 'bayut', 'propertyfinder', 'dubizzle'
    ) then 15
    else 1440
  end;
$$;

create or replace function public.crm_leads_first_response_due()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.deleted_at is not null or new.first_responded_at is not null then
    return new;
  end if;

  if new.assigned_to is null then
    new.first_response_due_at := null;
    new.first_response_minutes := null;
    return new;
  end if;

  if tg_op = 'INSERT' or old.assigned_to is distinct from new.assigned_to then
    new.first_response_minutes := public.crm_first_response_minutes(new.source);
    new.first_response_due_at := now() + make_interval(mins => new.first_response_minutes);
    new.first_response_breached_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_leads_first_response_due on public.leads;
create trigger trg_leads_first_response_due
  before insert or update of assigned_to, source, deleted_at, first_responded_at
  on public.leads
  for each row
  execute function public.crm_leads_first_response_due();

create or replace function public.crm_stamp_first_responded()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'lead_activities' then
    if new.type not in (
      'note', 'call', 'whatsapp', 'email', 'follow_up_done', 'follow_up_scheduled'
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

drop trigger if exists trg_lead_activities_first_responded on public.lead_activities;
create trigger trg_lead_activities_first_responded
  after insert on public.lead_activities
  for each row
  execute function public.crm_stamp_first_responded();

drop trigger if exists trg_lead_viewings_first_responded on public.lead_viewings;
create trigger trg_lead_viewings_first_responded
  after insert on public.lead_viewings
  for each row
  execute function public.crm_stamp_first_responded();

create or replace function public.crm_sweep_first_response()
returns table (
  lead_id uuid,
  lead_name text,
  user_id uuid,
  action text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with reclaim_src as (
    select l.id, l.name, l.assigned_to
    from public.leads l
    left join public.lead_stages st on st.id = l.stage_id
    where l.deleted_at is null
      and l.first_responded_at is null
      and l.assigned_to is not null
      and l.first_response_due_at is not null
      and coalesce(l.first_response_minutes, 15) > 0
      and now() >= l.first_response_due_at
        + make_interval(mins => coalesce(l.first_response_minutes, 15))
      and coalesce(st.kind, 'open') = 'open'
  ),
  reclaim_upd as (
    update public.leads l
    set assigned_to = null,
        first_response_due_at = null,
        first_response_minutes = null,
        updated_at = now()
    from reclaim_src s
    where l.id = s.id
    returning s.id, s.name, s.assigned_to
  ),
  reclaim_log as (
    insert into public.lead_assignments (lead_id, from_user, to_user, reason)
    select ru.id, ru.assigned_to, null, 'sla_reclaim'
    from reclaim_upd ru
    returning lead_id
  )
  select ru.id, ru.name, ru.assigned_to, 'reclaim'::text
  from reclaim_upd ru;

  return query
  with breach_src as (
    select l.id, l.name, l.assigned_to
    from public.leads l
    left join public.lead_stages st on st.id = l.stage_id
    where l.deleted_at is null
      and l.first_responded_at is null
      and l.assigned_to is not null
      and l.first_response_due_at is not null
      and l.first_response_breached_at is null
      and now() >= l.first_response_due_at
      and coalesce(st.kind, 'open') = 'open'
  ),
  breach_upd as (
    update public.leads l
    set first_response_breached_at = now()
    from breach_src s
    where l.id = s.id
    returning s.id, s.name, s.assigned_to
  )
  select bu.id, bu.name, bu.assigned_to, 'breach'::text
  from breach_upd bu;
end;
$$;

revoke all on function public.crm_first_response_minutes(text) from public;
revoke all on function public.crm_sweep_first_response() from public;
grant execute on function public.crm_first_response_minutes(text) to authenticated, service_role;
grant execute on function public.crm_sweep_first_response() to authenticated, service_role;

notify pgrst, 'reload schema';
