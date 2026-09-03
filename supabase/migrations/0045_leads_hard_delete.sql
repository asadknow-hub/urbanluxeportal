-- Allow admin/manager/reception to hard-delete leads they can write.
-- App deleteLead previously only soft-set deleted_at; product expects a real delete.

drop policy if exists "leads_delete" on public.leads;
create policy "leads_delete" on public.leads
  for delete using (
    public.has_role(array['admin', 'manager'])
    and public.crm_can_write_lead(assigned_to, team_id)
  );

notify pgrst, 'reload schema';
