-- Collapse deal pipeline to New → Negotiations → Contract → Closed (lost stays off the bar).

do $$ begin
  alter type public.deal_stage add value 'new';
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type public.deal_stage add value 'negotiations';
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type public.deal_stage add value 'closed';
exception when duplicate_object then null;
end $$;

update public.deals set stage = 'new' where stage in ('inquiry', 'viewing');
update public.deals set stage = 'negotiations' where stage in ('negotiation', 'offer');
update public.deals set stage = 'closed' where stage = 'won';

alter table public.deals alter column stage set default 'new';

notify pgrst, 'reload schema';
