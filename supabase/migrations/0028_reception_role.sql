-- Reception inherits manager access in has_role().

do $$ begin
  alter type public.user_role add value 'reception';
exception when duplicate_object then null;
end $$;

create or replace function public.has_role(p_roles text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (
        p.role::text = any(p_roles)
        or (p.role::text = 'reception' and 'manager' = any(p_roles))
      )
  );
$$;

notify pgrst, 'reload schema';
