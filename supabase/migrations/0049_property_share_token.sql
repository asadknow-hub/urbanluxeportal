-- Public share tokens for inventory units (client brochure links).

alter table public.properties
  add column if not exists share_token uuid;

create unique index if not exists idx_properties_share_token
  on public.properties (share_token)
  where share_token is not null and deleted_at is null;

notify pgrst, 'reload schema';
