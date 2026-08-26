-- R0 + R1: RLS helpers and ownable SELECT (live schema, not a greenfield rebuild).
-- House reads: admin / manager / reception (via has_role) / accountant.
-- Agents: assigned rows, plus unassigned leads in their desk (leads.team_id) or the
-- house unassigned pool when they have no desk / the lead has no desk.

-- ============================================================
-- leads.team_id (desk stamp for unassigned pool)
-- ============================================================

alter table public.leads
  add column if not exists team_id uuid references public.teams on delete set null;

create index if not exists idx_leads_team on public.leads (team_id)
  where deleted_at is null;

update public.leads l
set team_id = coalesce(
  (select p.team_id from public.profiles p where p.id = l.assigned_to),
  (select p.team_id from public.profiles p where p.id = l.created_by)
)
where l.team_id is null
  and l.deleted_at is null;

-- ============================================================
-- R0 helpers (SECURITY DEFINER so they do not recurse into profiles RLS)
-- ============================================================

create or replace function public.current_staff()
returns table (id uuid, role text, team_id uuid, is_active boolean)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.role::text, p.team_id, p.is_active
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

create or replace function public.current_staff_team_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.team_id from public.profiles p where p.id = auth.uid()
$$;

create or replace function public.crm_is_house()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- reception inherits manager inside has_role()
  select public.has_role(array['admin', 'manager', 'accountant']);
$$;

create or replace function public.crm_can_read_lead(p_assigned_to uuid, p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.crm_is_house()
    or p_assigned_to = auth.uid()
    or (
      p_assigned_to is null
      and (
        public.current_staff_team_id() is null
        or p_team_id is null
        or p_team_id = public.current_staff_team_id()
      )
    );
$$;

create or replace function public.crm_can_read_lead_id(p_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select public.crm_can_read_lead(l.assigned_to, l.team_id)
      from public.leads l
      where l.id = p_lead_id
        and l.deleted_at is null
    ),
    false
  );
$$;

create or replace function public.crm_can_read_deal(p_assigned_to uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.crm_is_house() or p_assigned_to = auth.uid();
$$;

create or replace function public.crm_can_read_deal_id(p_deal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select public.crm_can_read_deal(d.assigned_to)
      from public.deals d
      where d.id = p_deal_id
        and d.deleted_at is null
    ),
    false
  );
$$;

create or replace function public.crm_can_read_customer(p_assigned_to uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.crm_is_house()
    or p_assigned_to = auth.uid()
    or p_assigned_to is null;
$$;

create or replace function public.crm_can_read_viewing(p_lead_id uuid, p_deal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (p_lead_id is not null and public.crm_can_read_lead_id(p_lead_id))
    or (p_deal_id is not null and public.crm_can_read_deal_id(p_deal_id));
$$;

revoke all on function public.current_staff() from public;
revoke all on function public.current_staff_team_id() from public;
revoke all on function public.crm_is_house() from public;
revoke all on function public.crm_can_read_lead(uuid, uuid) from public;
revoke all on function public.crm_can_read_lead_id(uuid) from public;
revoke all on function public.crm_can_read_deal(uuid) from public;
revoke all on function public.crm_can_read_deal_id(uuid) from public;
revoke all on function public.crm_can_read_customer(uuid) from public;
revoke all on function public.crm_can_read_viewing(uuid, uuid) from public;

grant execute on function public.current_staff() to authenticated, service_role;
grant execute on function public.current_staff_team_id() to authenticated, service_role;
grant execute on function public.crm_is_house() to authenticated, service_role;
grant execute on function public.crm_can_read_lead(uuid, uuid) to authenticated, service_role;
grant execute on function public.crm_can_read_lead_id(uuid) to authenticated, service_role;
grant execute on function public.crm_can_read_deal(uuid) to authenticated, service_role;
grant execute on function public.crm_can_read_deal_id(uuid) to authenticated, service_role;
grant execute on function public.crm_can_read_customer(uuid) to authenticated, service_role;
grant execute on function public.crm_can_read_viewing(uuid, uuid) to authenticated, service_role;

-- ============================================================
-- R1 ownable SELECT (+ child tables)
-- ============================================================

drop policy if exists "leads_read" on public.leads;
create policy "leads_read" on public.leads
  for select using (
    deleted_at is null
    and public.crm_can_read_lead(assigned_to, team_id)
  );

drop policy if exists "deals_read" on public.deals;
create policy "deals_read" on public.deals
  for select using (
    deleted_at is null
    and public.crm_can_read_deal(assigned_to)
  );

drop policy if exists "customers_read" on public.customers;
create policy "customers_read" on public.customers
  for select using (
    deleted_at is null
    and public.crm_can_read_customer(assigned_to)
  );

drop policy if exists "lead_viewings_read" on public.lead_viewings;
create policy "lead_viewings_read" on public.lead_viewings
  for select using (public.crm_can_read_viewing(lead_id, deal_id));

drop policy if exists "lead_follow_ups_read" on public.lead_follow_ups;
create policy "lead_follow_ups_read" on public.lead_follow_ups
  for select using (public.crm_can_read_lead_id(lead_id));

drop policy if exists "lead_follow_ups_write" on public.lead_follow_ups;
create policy "lead_follow_ups_write" on public.lead_follow_ups
  for all using (public.crm_can_read_lead_id(lead_id))
  with check (public.crm_can_read_lead_id(lead_id));

drop policy if exists "lead_activities_read" on public.lead_activities;
create policy "lead_activities_read" on public.lead_activities
  for select using (public.crm_can_read_lead_id(lead_id));

drop policy if exists "lead_events_read" on public.lead_events;
create policy "lead_events_read" on public.lead_events
  for select using (public.crm_can_read_lead_id(lead_id));

drop policy if exists "lead_assignments_read" on public.lead_assignments;
create policy "lead_assignments_read" on public.lead_assignments
  for select using (public.crm_can_read_lead_id(lead_id));

drop policy if exists "lead_tasks_read" on public.lead_tasks;
create policy "lead_tasks_read" on public.lead_tasks
  for select using (public.crm_can_read_lead_id(lead_id));

drop policy if exists "deal_activities_read" on public.deal_activities;
create policy "deal_activities_read" on public.deal_activities
  for select using (public.crm_can_read_deal_id(deal_id));

drop policy if exists "deal_properties_read" on public.deal_properties;
create policy "deal_properties_read" on public.deal_properties
  for select using (public.crm_can_read_deal_id(deal_id));

-- Directory read so assignee names and /viewings agent filter work on user JWT.
-- Writes stay self-or-admin (R4/R5 will narrow columns via a view if needed).
drop policy if exists "profiles_org_read" on public.profiles;
create policy "profiles_org_read" on public.profiles
  for select using (auth.uid() is not null);

drop policy if exists "activity_log_read" on public.activity_log;
create policy "activity_log_read" on public.activity_log
  for select using (auth.uid() is not null);

drop policy if exists "rate_limits_all" on public.rate_limits;
drop policy if exists "rate_limits_service" on public.rate_limits;
create policy "rate_limits_service" on public.rate_limits
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Table owners must also obey these policies (service_role still BYPASSRLS).
alter table public.leads force row level security;
alter table public.deals force row level security;
alter table public.customers force row level security;
alter table public.lead_viewings force row level security;
alter table public.lead_follow_ups force row level security;
alter table public.lead_activities force row level security;
alter table public.lead_events force row level security;
alter table public.lead_assignments force row level security;
alter table public.lead_tasks force row level security;
alter table public.deal_activities force row level security;
alter table public.deal_properties force row level security;
alter table public.profiles force row level security;
alter table public.activity_log force row level security;
alter table public.rate_limits force row level security;

notify pgrst, 'reload schema';
