-- Agents must claim (or be assigned) before mutating a lead.
-- House roles keep full write via crm_can_write_inventory().
-- Separate claim policy: unassigned + readable → assign self only.

create or replace function public.crm_can_write_lead(p_assigned_to uuid, p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.crm_can_write_inventory()
    or p_assigned_to = auth.uid();
$$;

comment on function public.crm_can_write_lead(uuid, uuid) is
  'House staff or the assigned agent. Unassigned pool is claim-only for agents.';

drop policy if exists "leads_claim" on public.leads;
create policy "leads_claim" on public.leads
  for update
  using (
    assigned_to is null
    and deleted_at is null
    and public.crm_can_read_lead(assigned_to, team_id)
    and exists (
      select 1 from public.current_staff() s
      where s.role = 'agent' and s.is_active
    )
  )
  with check (
    assigned_to = auth.uid()
    and deleted_at is null
  );
