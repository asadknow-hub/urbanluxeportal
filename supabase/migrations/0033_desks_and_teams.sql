-- Desks (teams) as org structure. profiles.team_id is the working assignment.
-- Existing public.teams / team_members stay; we add lead + profile columns.

alter table public.teams
  add column if not exists lead_id uuid references public.profiles on delete set null,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

alter table public.profiles
  add column if not exists team_id uuid references public.teams on delete set null;

create index if not exists idx_profiles_team on public.profiles (team_id);
create index if not exists idx_teams_active on public.teams (is_active) where deleted_at is null;

update public.profiles p
set team_id = tm.team_id
from public.team_members tm
where p.team_id is null
  and tm.user_id = p.id;

insert into public.teams (name)
values ('Secondary'), ('Off-plan')
on conflict (name) do nothing;

notify pgrst, 'reload schema';
