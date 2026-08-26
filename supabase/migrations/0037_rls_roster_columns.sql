-- R4: roster column-minimisation.
-- authenticated may SELECT only directory columns on profiles (names, role, desk).
-- Email, phone, BRN, and commission_rate come from SECURITY DEFINER RPCs
-- for the signed-in user or for CRM managers (admin / manager / reception).

create or replace function public.crm_my_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

create or replace function public.crm_staff_roster()
returns setof public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.profiles p
  where public.crm_can_write_inventory()
  order by p.created_at;
$$;

create or replace function public.crm_staff_profile(p_id uuid)
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.profiles p
  where p.id = p_id
    and (
      p.id = auth.uid()
      or public.crm_can_write_inventory()
    )
  limit 1;
$$;

revoke all on function public.crm_my_profile() from public;
revoke all on function public.crm_staff_roster() from public;
revoke all on function public.crm_staff_profile(uuid) from public;

grant execute on function public.crm_my_profile() to authenticated, service_role;
grant execute on function public.crm_staff_roster() to authenticated, service_role;
grant execute on function public.crm_staff_profile(uuid) to authenticated, service_role;

-- Directory columns only for the JWT role. service_role keeps table privileges.
revoke all on table public.profiles from public, anon, authenticated;
grant select (
  id,
  full_name,
  avatar_url,
  role,
  is_active,
  team_id
) on table public.profiles to authenticated;

-- Org-wide row read stays so assignee embeds resolve; extra columns are not granted.
drop policy if exists "profiles_org_read" on public.profiles;
create policy "profiles_org_read" on public.profiles
  for select using (auth.uid() is not null);

notify pgrst, 'reload schema';
