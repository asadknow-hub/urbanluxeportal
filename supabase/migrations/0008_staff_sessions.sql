-- Migration 0008: Staff session tracking for employee activity insights

-- ============================================================
-- STAFF SESSIONS
-- ============================================================
-- Tracks each day a staff member logs in and their active time
-- One row per login session. Heartbeat updates last_heartbeat_at.
-- Daily aggregation done in queries (no materialized views needed).

create table if not exists public.staff_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  session_date date not null default current_date,
  login_at timestamptz not null default now(),
  logout_at timestamptz,
  last_heartbeat_at timestamptz not null default now(),
  total_active_seconds int not null default 0,
  ip_address text,
  user_agent text
);

create index idx_staff_sessions_user on public.staff_sessions (user_id);
create index idx_staff_sessions_date on public.staff_sessions (session_date desc);
create index idx_staff_sessions_user_date on public.staff_sessions (user_id, session_date desc);

-- ============================================================
-- RLS
-- ============================================================

alter table public.staff_sessions enable row level security;

-- Admins and managers can see all sessions
create policy "staff_sessions_read_admin" on public.staff_sessions
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager'))
  );

-- Users can see their own sessions
create policy "staff_sessions_read_own" on public.staff_sessions
  for select using (user_id = auth.uid());

-- Users can insert their own sessions
create policy "staff_sessions_insert_own" on public.staff_sessions
  for insert with check (user_id = auth.uid());

-- Users can update their own sessions (heartbeat, logout)
create policy "staff_sessions_update_own" on public.staff_sessions
  for update using (user_id = auth.uid());

-- ============================================================
-- HELPER: upsert daily session
-- ============================================================
-- Called from server action on login: creates a session row if
-- none exists for today, or reactivates an existing one.

create or replace function public.upsert_staff_session(p_user_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_session_id uuid;
  v_today date := current_date;
begin
  -- Find today's session for this user that's still open (no logout)
  select id into v_session_id
  from public.staff_sessions
  where user_id = p_user_id
    and session_date = v_today
    and logout_at is null
  order by login_at desc
  limit 1;

  if v_session_id is not null then
    -- Update heartbeat on existing session
    update public.staff_sessions
    set last_heartbeat_at = now()
    where id = v_session_id;
  else
    -- Create new session
    insert into public.staff_sessions (user_id, session_date, login_at, last_heartbeat_at)
    values (p_user_id, v_today, now(), now())
    returning id into v_session_id;
  end if;

  return v_session_id;
end;
$$;

-- ============================================================
-- HELPER: heartbeat - update active time
-- ============================================================
-- Called every 60s from client. Adds elapsed seconds since last
-- heartbeat, capped at 120s to avoid inflated counts.

create or replace function public.heartbeat_staff_session(p_session_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_last timestamptz;
  v_elapsed int;
begin
  select last_heartbeat_at into v_last
  from public.staff_sessions
  where id = p_session_id;

  if v_last is null then return; end if;

  v_elapsed := extract(epoch from (now() - v_last))::int;
  -- Cap at 120 seconds to prevent inflated counts if tab was backgrounded
  v_elapsed := least(v_elapsed, 120);

  update public.staff_sessions
  set last_heartbeat_at = now(),
      total_active_seconds = total_active_seconds + v_elapsed
  where id = p_session_id;
end;
$$;

-- ============================================================
-- HELPER: close session on logout
-- ============================================================

create or replace function public.close_staff_session(p_session_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.staff_sessions
  set logout_at = now(),
      last_heartbeat_at = now()
  where id = p_session_id and logout_at is null;
end;
$$;
