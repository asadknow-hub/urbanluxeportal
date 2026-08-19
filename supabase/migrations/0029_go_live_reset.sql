-- Go-live reset: wipe demo CRM records and demo staff. Keep Admin and Lead Settings catalogs.

do $$
declare
  v_admin uuid;
begin
  select id into v_admin
  from public.profiles
  where email = 'admin@urbanluxe.ae' and role = 'admin'
  limit 1;

  if v_admin is null then
    raise exception 'Admin profile admin@urbanluxe.ae not found — aborting go-live reset';
  end if;

  delete from public.deal_activities;
  delete from public.customer_properties;
  delete from public.documents;
  delete from public.lead_activities;
  delete from public.lead_events;
  delete from public.lead_assignments;
  delete from public.lead_viewings;
  delete from public.lead_tasks;
  delete from public.lead_follow_ups;
  delete from public.deals;
  delete from public.customers;
  delete from public.leads;
  delete from public.notifications;
  delete from public.staff_sessions;
  delete from public.saved_filters;
  delete from public.activity_log;
  delete from public.team_members;

  delete from auth.users where id <> v_admin;
end $$;

notify pgrst, 'reload schema';
