-- R5: staff mutations run as the user JWT. Write policies match operating staff
-- (admin / manager / reception / assigned agent). Accountant stays house-read.
-- Service role remains for public capture, webhook, cron, Auth admin, and notify.

create or replace function public.crm_is_operating_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.crm_can_write_inventory()
    or exists (
      select 1 from public.current_staff() s
      where s.role = 'agent' and s.is_active
    );
$$;

create or replace function public.crm_can_write_lead(p_assigned_to uuid, p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.crm_can_write_inventory()
    or p_assigned_to = auth.uid()
    or (
      p_assigned_to is null
      and public.crm_can_read_lead(p_assigned_to, p_team_id)
    );
$$;

create or replace function public.crm_can_write_lead_id(p_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select public.crm_can_write_lead(l.assigned_to, l.team_id)
      from public.leads l
      where l.id = p_lead_id
        and l.deleted_at is null
    ),
    false
  );
$$;

create or replace function public.crm_can_write_customer(p_assigned_to uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.crm_can_write_inventory()
    or p_assigned_to = auth.uid()
    or (
      p_assigned_to is null
      and exists (
        select 1 from public.current_staff() s
        where s.role = 'agent' and s.is_active
      )
    );
$$;

create or replace function public.crm_can_write_customer_id(p_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select public.crm_can_write_customer(c.assigned_to)
      from public.customers c
      where c.id = p_customer_id
        and c.deleted_at is null
    ),
    false
  );
$$;

create or replace function public.crm_can_write_viewing(p_lead_id uuid, p_deal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (p_lead_id is not null and public.crm_can_write_lead_id(p_lead_id))
    or (p_deal_id is not null and public.crm_can_write_deal_id(p_deal_id));
$$;

create or replace function public.crm_can_write_document(p_entity_type text, p_entity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_entity_type is null or p_entity_id is null
      then public.crm_can_write_inventory()
    when lower(p_entity_type) = 'lead'
      then public.crm_can_write_lead_id(p_entity_id)
    when lower(p_entity_type) = 'deal'
      then public.crm_can_write_deal_id(p_entity_id)
    when lower(p_entity_type) = 'customer'
      then public.crm_can_write_customer_id(p_entity_id)
    when lower(p_entity_type) in ('staff', 'profile')
      then public.crm_can_write_inventory() or p_entity_id = auth.uid()
    else public.crm_can_write_inventory()
  end;
$$;

create or replace function public.crm_least_loaded_agent(p_team_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  with desk as (
    select p.id
    from public.profiles p
    where p.role = 'agent'
      and p.is_active = true
      and p_team_id is not null
      and p.team_id = p_team_id
  ),
  house as (
    select p.id
    from public.profiles p
    where p.role = 'agent'
      and p.is_active = true
  ),
  pool as (
    select id from desk
    union all
    select id from house
    where not exists (select 1 from desk)
  ),
  loads as (
    select l.assigned_to, count(*)::int as n
    from public.leads l
    where l.deleted_at is null
      and l.assigned_to is not null
    group by l.assigned_to
  )
  select p.id
  from pool p
  left join loads x on x.assigned_to = p.id
  order by coalesce(x.n, 0) asc, p.id
  limit 1;
$$;

create or replace function public.crm_apply_lead_routing(
  p_lead_id uuid,
  p_assigned_to uuid,
  p_reason text,
  p_team_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agent uuid;
  v_desk uuid;
  v_now timestamptz := now();
begin
  if auth.role() is distinct from 'service_role' then
    if auth.uid() is null then
      raise exception 'not authenticated';
    end if;
    if not exists (
      select 1
      from public.leads l
      where l.id = p_lead_id
        and l.deleted_at is null
        and (
          public.crm_can_write_lead(l.assigned_to, l.team_id)
          or l.created_by = auth.uid()
        )
    ) then
      raise exception 'not allowed';
    end if;
  end if;

  if p_assigned_to is not null then
    select p.team_id into v_desk from public.profiles p where p.id = p_assigned_to;
    v_desk := coalesce(v_desk, p_team_id);
    update public.leads
    set team_id = v_desk, updated_at = v_now
    where id = p_lead_id;
    return p_assigned_to;
  end if;

  v_agent := public.crm_least_loaded_agent(p_team_id);
  select p.team_id into v_desk from public.profiles p where p.id = v_agent;
  v_desk := coalesce(v_desk, p_team_id);

  if v_agent is null then
    if v_desk is not null then
      update public.leads set team_id = v_desk, updated_at = v_now where id = p_lead_id;
    end if;
    return null;
  end if;

  update public.leads
  set assigned_to = v_agent, team_id = v_desk, updated_at = v_now
  where id = p_lead_id;

  insert into public.lead_assignments (lead_id, to_user, reason)
  values (p_lead_id, v_agent, 'round_robin:' || coalesce(p_reason, 'created'));

  return v_agent;
end;
$$;

revoke all on function public.crm_is_operating_staff() from public;
revoke all on function public.crm_can_write_lead(uuid, uuid) from public;
revoke all on function public.crm_can_write_lead_id(uuid) from public;
revoke all on function public.crm_can_write_customer(uuid) from public;
revoke all on function public.crm_can_write_customer_id(uuid) from public;
revoke all on function public.crm_can_write_viewing(uuid, uuid) from public;
revoke all on function public.crm_can_write_document(text, uuid) from public;
revoke all on function public.crm_least_loaded_agent(uuid) from public, authenticated;
revoke all on function public.crm_apply_lead_routing(uuid, uuid, text, uuid) from public;

grant execute on function public.crm_is_operating_staff() to authenticated, service_role;
grant execute on function public.crm_can_write_lead(uuid, uuid) to authenticated, service_role;
grant execute on function public.crm_can_write_lead_id(uuid) to authenticated, service_role;
grant execute on function public.crm_can_write_customer(uuid) to authenticated, service_role;
grant execute on function public.crm_can_write_customer_id(uuid) to authenticated, service_role;
grant execute on function public.crm_can_write_viewing(uuid, uuid) to authenticated, service_role;
grant execute on function public.crm_can_write_document(text, uuid) to authenticated, service_role;
grant execute on function public.crm_least_loaded_agent(uuid) to service_role;
grant execute on function public.crm_apply_lead_routing(uuid, uuid, text, uuid) to authenticated, service_role;

-- ============================================================
-- Ownable writes
-- ============================================================

drop policy if exists "leads_insert" on public.leads;
create policy "leads_insert" on public.leads
  for insert with check (
    public.crm_is_operating_staff()
    and (
      public.crm_can_write_inventory()
      or assigned_to is null
      or assigned_to = auth.uid()
    )
  );

drop policy if exists "leads_update" on public.leads;
drop policy if exists "leads_claim" on public.leads;
create policy "leads_update" on public.leads
  for update using (public.crm_can_write_lead(assigned_to, team_id))
  with check (public.crm_can_write_lead(assigned_to, team_id));

drop policy if exists "customers_insert" on public.customers;
create policy "customers_insert" on public.customers
  for insert with check (
    public.crm_is_operating_staff()
    and (
      public.crm_can_write_inventory()
      or assigned_to is null
      or assigned_to = auth.uid()
    )
  );

drop policy if exists "customers_update" on public.customers;
create policy "customers_update" on public.customers
  for update using (public.crm_can_write_customer(assigned_to))
  with check (public.crm_can_write_customer(assigned_to));

drop policy if exists "deals_insert" on public.deals;
create policy "deals_insert" on public.deals
  for insert with check (
    public.crm_is_operating_staff()
    and (
      public.crm_can_write_inventory()
      or assigned_to is null
      or assigned_to = auth.uid()
    )
  );

drop policy if exists "deals_update" on public.deals;
create policy "deals_update" on public.deals
  for update using (public.crm_can_write_deal(assigned_to))
  with check (public.crm_can_write_deal(assigned_to));

drop policy if exists "lead_activities_insert" on public.lead_activities;
create policy "lead_activities_insert" on public.lead_activities
  for insert with check (public.crm_can_write_lead_id(lead_id));

drop policy if exists "lead_events_insert" on public.lead_events;
create policy "lead_events_insert" on public.lead_events
  for insert with check (public.crm_can_write_lead_id(lead_id));

drop policy if exists "lead_assignments_insert" on public.lead_assignments;
create policy "lead_assignments_insert" on public.lead_assignments
  for insert with check (public.crm_can_write_lead_id(lead_id) or public.crm_can_write_inventory());

drop policy if exists "lead_viewings_insert" on public.lead_viewings;
create policy "lead_viewings_insert" on public.lead_viewings
  for insert with check (public.crm_can_write_viewing(lead_id, deal_id));

drop policy if exists "lead_viewings_update" on public.lead_viewings;
create policy "lead_viewings_update" on public.lead_viewings
  for update using (
    public.crm_can_write_viewing(lead_id, deal_id)
    or agent_id = auth.uid()
  )
  with check (
    public.crm_can_write_viewing(lead_id, deal_id)
    or agent_id = auth.uid()
  );

drop policy if exists "lead_tasks_insert" on public.lead_tasks;
create policy "lead_tasks_insert" on public.lead_tasks
  for insert with check (public.crm_can_write_lead_id(lead_id));

drop policy if exists "lead_tasks_update" on public.lead_tasks;
create policy "lead_tasks_update" on public.lead_tasks
  for update using (
    public.crm_can_write_lead_id(lead_id)
    or assignee_id = auth.uid()
  );

drop policy if exists "deal_activities_insert" on public.deal_activities;
create policy "deal_activities_insert" on public.deal_activities
  for insert with check (public.crm_can_write_deal_id(deal_id));

drop policy if exists "lead_follow_ups_write" on public.lead_follow_ups;
create policy "lead_follow_ups_write" on public.lead_follow_ups
  for all using (public.crm_can_write_lead_id(lead_id))
  with check (public.crm_can_write_lead_id(lead_id));

drop policy if exists "documents_insert" on public.documents;
create policy "documents_insert" on public.documents
  for insert with check (public.crm_can_write_document(entity_type, entity_id));

drop policy if exists "documents_update" on public.documents;
create policy "documents_update" on public.documents
  for update using (public.crm_can_write_document(entity_type, entity_id))
  with check (public.crm_can_write_document(entity_type, entity_id));

drop policy if exists "documents_delete" on public.documents;
create policy "documents_delete" on public.documents
  for delete using (public.crm_can_write_document(entity_type, entity_id));

drop policy if exists "customer_properties_insert" on public.customer_properties;
create policy "customer_properties_insert" on public.customer_properties
  for insert with check (
    public.crm_can_read_customer_id(customer_id)
    and (
      public.crm_can_write_inventory()
      or (deal_id is not null and public.crm_can_write_deal_id(deal_id))
    )
  );

drop policy if exists "customer_properties_update" on public.customer_properties;
create policy "customer_properties_update" on public.customer_properties
  for update using (
    public.crm_can_read_customer_id(customer_id)
    and (
      public.crm_can_write_inventory()
      or (deal_id is not null and public.crm_can_write_deal_id(deal_id))
    )
  )
  with check (
    public.crm_can_read_customer_id(customer_id)
    and (
      public.crm_can_write_inventory()
      or (deal_id is not null and public.crm_can_write_deal_id(deal_id))
    )
  );

drop policy if exists "staff_sessions_read_admin" on public.staff_sessions;
create policy "staff_sessions_read_admin" on public.staff_sessions
  for select using (public.crm_can_write_inventory());

drop policy if exists "activity_log_insert" on public.activity_log;
create policy "activity_log_insert" on public.activity_log
  for insert with check (actor_id = auth.uid());

create or replace function public.finalize_deal_to_customer(p_deal_id uuid, p_actor_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deal record;
  v_lead record;
  v_customer_id uuid;
  v_name text;
  v_phone text;
  v_email text;
begin
  if auth.role() is distinct from 'service_role' then
    if auth.uid() is null then
      raise exception 'not authenticated';
    end if;
    if not public.crm_can_write_deal_id(p_deal_id) then
      raise exception 'not allowed';
    end if;
  end if;

  select * into v_deal from public.deals where id = p_deal_id and deleted_at is null;
  if not found then return null; end if;
  if v_deal.property_title is null or trim(v_deal.property_title) = '' then
    raise exception 'Property title is required before finalizing';
  end if;

  v_name := coalesce(nullif(trim(v_deal.buyer_name), ''), 'Unknown buyer');
  v_phone := nullif(trim(v_deal.buyer_phone), '');
  v_email := nullif(trim(v_deal.buyer_email), '');

  if v_deal.lead_id is not null then
    select * into v_lead from public.leads where id = v_deal.lead_id;
  end if;

  v_name := coalesce(nullif(trim(v_deal.buyer_name), ''), case when v_lead.id is not null then v_lead.name else null end, v_name);
  v_phone := coalesce(v_phone, case when v_lead.id is not null then nullif(trim(v_lead.phone), '') else null end);
  v_email := coalesce(v_email, case when v_lead.id is not null then nullif(trim(v_lead.email), '') else null end);

  v_customer_id := coalesce(
    v_deal.customer_id,
    case when v_lead.id is not null then v_lead.customer_id else null end
  );

  if v_customer_id is null and v_phone is not null then
    select id into v_customer_id from public.customers
    where phone = v_phone and deleted_at is null
    limit 1;
  end if;

  if v_customer_id is null then
    insert into public.customers (
      type, name, phone, email, nationality, emirates_id, passport_no, trn,
      assigned_to, lead_id, status, lead_context, client_since, created_by
    )
    values (
      'individual',
      v_name,
      v_phone,
      v_email,
      coalesce(v_deal.kyc_nationality, case when v_lead.id is not null then v_lead.nationality else null end),
      v_deal.kyc_emirates_id,
      v_deal.kyc_passport_no,
      v_deal.kyc_trn,
      v_deal.assigned_to,
      v_deal.lead_id,
      'active',
      v_deal.lead_context,
      current_date,
      p_actor_id
    )
    returning id into v_customer_id;
  else
    update public.customers set
      status = 'active',
      client_since = coalesce(client_since, current_date),
      name = coalesce(nullif(trim(name), ''), v_name),
      phone = coalesce(phone, v_phone),
      email = coalesce(email, v_email),
      nationality = coalesce(nationality, v_deal.kyc_nationality, case when v_lead.id is not null then v_lead.nationality else null end),
      emirates_id = coalesce(emirates_id, v_deal.kyc_emirates_id),
      passport_no = coalesce(passport_no, v_deal.kyc_passport_no),
      trn = coalesce(trn, v_deal.kyc_trn),
      lead_id = coalesce(lead_id, v_deal.lead_id),
      lead_context = coalesce(lead_context, v_deal.lead_context),
      updated_at = now()
    where id = v_customer_id;
  end if;

  update public.deals set
    customer_id = v_customer_id,
    finalized_at = now(),
    updated_at = now()
  where id = p_deal_id;

  insert into public.customer_properties (
    customer_id, deal_id, deal_type, property_title, property_community,
    property_building, property_unit, property_ref, property_snapshot,
    value, payment_method, payment_snapshot
  )
  select
    v_customer_id,
    p_deal_id,
    v_deal.deal_type::text,
    v_deal.property_title,
    v_deal.property_community,
    v_deal.property_building,
    v_deal.property_unit,
    v_deal.property_ref,
    v_deal.property_snapshot,
    coalesce(v_deal.value, 0),
    v_deal.payment_method,
    jsonb_build_object(
      'deposit', v_deal.payment_deposit,
      'balance', v_deal.payment_balance,
      'schedule', v_deal.payment_schedule,
      'notes', v_deal.payment_notes
    )
  where not exists (
    select 1 from public.customer_properties cp where cp.deal_id = p_deal_id
  );

  if v_deal.lead_id is not null then
    update public.leads set
      customer_id = v_customer_id,
      converted_customer_id = v_customer_id,
      updated_at = now()
    where id = v_deal.lead_id;
  end if;

  return v_customer_id;
end;
$$;

revoke all on function public.finalize_deal_to_customer(uuid, uuid) from public;
grant execute on function public.finalize_deal_to_customer(uuid, uuid) to authenticated, service_role;

create or replace function public.upsert_staff_session(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_today date := current_date;
begin
  if auth.uid() is not null and p_user_id is distinct from auth.uid() then
    raise exception 'not allowed';
  end if;

  select id into v_session_id
  from public.staff_sessions
  where user_id = p_user_id
    and session_date = v_today
    and logout_at is null
  order by login_at desc
  limit 1;

  if v_session_id is not null then
    update public.staff_sessions
    set last_heartbeat_at = now()
    where id = v_session_id;
  else
    insert into public.staff_sessions (user_id, session_date, login_at, last_heartbeat_at)
    values (p_user_id, v_today, now(), now())
    returning id into v_session_id;
  end if;

  return v_session_id;
end;
$$;

create or replace function public.heartbeat_staff_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last timestamptz;
  v_elapsed int;
begin
  select last_heartbeat_at into v_last
  from public.staff_sessions
  where id = p_session_id
    and (auth.uid() is null or user_id = auth.uid());

  if v_last is null then return; end if;

  v_elapsed := extract(epoch from (now() - v_last))::int;
  v_elapsed := least(v_elapsed, 120);

  update public.staff_sessions
  set last_heartbeat_at = now(),
      total_active_seconds = total_active_seconds + v_elapsed
  where id = p_session_id
    and (auth.uid() is null or user_id = auth.uid());
end;
$$;

create or replace function public.close_staff_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.staff_sessions
  set logout_at = now(),
      last_heartbeat_at = now()
  where id = p_session_id
    and logout_at is null
    and (auth.uid() is null or user_id = auth.uid());
end;
$$;

notify pgrst, 'reload schema';
