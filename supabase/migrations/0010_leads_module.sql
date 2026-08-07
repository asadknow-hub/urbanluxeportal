-- Migration 0010: Leads Module — deep rebuild per LEADS_MODULE_SPEC.md
-- Adds: lead_stages, communities, lead_events, lead_assignments, lead_viewings,
--       lead_tasks, campaigns, custom_field_defs, lead_sources, lost_reasons,
--       saved_filters, teams, team_members, form_submissions, import_batches,
--       rate_limits, lead_doc_requirements, routing_rules, web_forms
-- Modifies: leads table (add stage_id, custom jsonb, phone_norm, email_norm, SLA fields, tags, etc.)
-- Seeds: stages, communities, lost/junk reasons, custom fields, doc requirements

-- ============================================================
-- STAGE KIND ENUM
-- ============================================================
create type stage_kind as enum ('open', 'won', 'lost', 'junk');

-- ============================================================
-- LEAD STAGES (config-driven, replaces lead_status enum)
-- ============================================================
create table if not exists public.lead_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default 'blue',
  kind stage_kind not null default 'open',
  sort int not null default 0,
  stale_after_days int,
  required_fields jsonb not null default '[]'::jsonb,
  helper_text text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index lead_stages_kind_singleton on public.lead_stages (kind) where kind in ('won', 'lost', 'junk');

-- ============================================================
-- COMMUNITIES (Dubai reference data)
-- ============================================================
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  area_group text not null default 'Other',
  created_at timestamptz not null default now()
);

create index communities_name_idx on public.communities (name);
create index communities_group_idx on public.communities (area_group);

-- ============================================================
-- TEAMS (for round-robin routing)
-- ============================================================
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  rr_cursor int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  daily_cap int not null default 15,
  primary key (team_id, user_id)
);

-- ============================================================
-- LEAD SOURCES (config-driven, replaces lead_source enum)
-- ============================================================
create table if not exists public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('website_form','whatsapp','meta','tiktok','google','other_webhook','import','manual','walk_in','referral')),
  name text not null,
  token uuid unique default gen_random_uuid(),
  secret text,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- WEB FORMS (form definitions for website capture)
-- ============================================================
create table if not exists public.web_forms (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.lead_sources on delete cascade,
  name text not null,
  fields jsonb not null default '[]'::jsonb,
  hidden_defaults jsonb not null default '{}'::jsonb,
  campaign_id uuid,
  success_message text,
  redirect_url text,
  turnstile_key text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- CUSTOM FIELD DEFINITIONS
-- ============================================================
create table if not exists public.custom_field_defs (
  id uuid primary key default gen_random_uuid(),
  entity text not null default 'lead',
  key text not null,
  label text not null,
  type text not null check (type in ('text','textarea','number','money','select','multiselect','date','checkbox','phone','url')),
  options jsonb,
  required boolean not null default false,
  show_on_card boolean not null default false,
  show_in_list boolean not null default false,
  group_name text,
  sort int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(entity, key)
);

-- ============================================================
-- LEAD DOC REQUIREMENTS
-- ============================================================
create table if not exists public.lead_doc_requirements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slots jsonb not null default '[]'::jsonb,
  applies_when jsonb not null default '{}'::jsonb,
  required boolean not null default false,
  allowed_types text[] not null default '{pdf,jpg,jpeg,png}',
  max_mb int not null default 20,
  sort int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROUTING RULES
-- ============================================================
create table if not exists public.routing_rules (
  id uuid primary key default gen_random_uuid(),
  sort int not null default 0,
  conditions jsonb not null default '{}'::jsonb,
  action jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- LOST / JUNK REASONS
-- ============================================================
create table if not exists public.lost_reasons (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('lost','junk')),
  label text not null,
  sort int not null default 0,
  is_active boolean not null default true
);

-- ============================================================
-- CAMPAIGNS
-- ============================================================
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null check (channel in ('meta','google','tiktok','whatsapp','email','outdoor','event','portal','other')),
  tracking_code text not null unique,
  budget bigint,
  spend bigint,
  starts_on date,
  ends_on date,
  target jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','active','paused','ended')),
  notes text,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index campaigns_tracking_code_idx on public.campaigns (tracking_code);

-- ============================================================
-- FORM SUBMISSIONS (immutable raw payloads)
-- ============================================================
create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.lead_sources on delete set null,
  raw jsonb not null default '{}'::jsonb,
  ip inet,
  lead_id uuid references public.leads on delete set null,
  status text not null default 'pending' check (status in ('pending','created','error','duplicate')),
  error text,
  created_at timestamptz not null default now()
);

create index form_submissions_source_idx on public.form_submissions (source_id, created_at desc);
create index form_submissions_lead_idx on public.form_submissions (lead_id);

-- ============================================================
-- IMPORT BATCHES
-- ============================================================
create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  mapping jsonb not null default '{}'::jsonb,
  totals jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SAVED FILTERS (per user)
-- ============================================================
create table if not exists public.saved_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  name text not null,
  params jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index saved_filters_user_idx on public.saved_filters (user_id);

-- ============================================================
-- RATE LIMITS (simple sliding window)
-- ============================================================
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count int not null default 0
);

-- ============================================================
-- LEAD EVENTS (insert-only audit trail)
-- ============================================================
create table if not exists public.lead_events (
  id bigserial primary key,
  lead_id uuid not null references public.leads on delete cascade,
  kind text not null,
  actor_id uuid references public.profiles on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index lead_events_lead_idx on public.lead_events (lead_id, id desc);
create index lead_events_kind_idx on public.lead_events (kind);

-- ============================================================
-- LEAD ASSIGNMENTS (full assignment history)
-- ============================================================
create table if not exists public.lead_assignments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads on delete cascade,
  from_user uuid references public.profiles on delete set null,
  to_user uuid references public.profiles on delete set null,
  reason text not null default 'manual',
  created_at timestamptz not null default now()
);

create index lead_assignments_lead_idx on public.lead_assignments (lead_id, created_at desc);

-- ============================================================
-- LEAD VIEWINGS
-- ============================================================
create table if not exists public.lead_viewings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads on delete cascade,
  property_id uuid,
  scheduled_at timestamptz not null,
  agent_id uuid references public.profiles on delete set null,
  note text,
  outcome text check (outcome in ('attended','no_show','cancelled')),
  outcome_note text,
  reminded_at timestamptz,
  created_at timestamptz not null default now()
);

create index lead_viewings_lead_idx on public.lead_viewings (lead_id, scheduled_at desc);
create index lead_viewings_agent_idx on public.lead_viewings (agent_id, scheduled_at desc);

-- ============================================================
-- LEAD TASKS
-- ============================================================
create table if not exists public.lead_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads on delete cascade,
  title text not null,
  due_at timestamptz,
  assignee_id uuid references public.profiles on delete set null,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create index lead_tasks_lead_idx on public.lead_tasks (lead_id);
create index lead_tasks_assignee_idx on public.lead_tasks (assignee_id, due_at);

-- ============================================================
-- MODIFY LEADS TABLE — add new columns
-- ============================================================
-- Add stage_id (FK to lead_stages, will replace status enum usage)
alter table public.leads add column if not exists stage_id uuid references public.lead_stages on delete set null;

-- Add custom fields jsonb
alter table public.leads add column if not exists custom jsonb not null default '{}'::jsonb;

-- Add campaign link
alter table public.leads add column if not exists campaign_id uuid references public.campaigns on delete set null;

-- Add source link (to lead_sources config table)
alter table public.leads add column if not exists source_id uuid references public.lead_sources on delete set null;

-- Add external ref (for WhatsApp message IDs etc)
alter table public.leads add column if not exists external_ref text;

-- Add normalized phone/email for dedup
alter table public.leads add column if not exists phone_norm text generated always as (
  case
    when phone is null then null
    else regexp_replace(regexp_replace(phone, '[\s\-\(\)]', '', 'g'), '^00', '+')
  end
) stored;

alter table public.leads add column if not exists email_norm text generated always as (
  case
    when email is null then null
    else lower(trim(email))
  end
) stored;

-- Add requirement fields
alter table public.leads add column if not exists language text default 'en';
alter table public.leads add column if not exists financing text;
alter table public.leads add column if not exists timeframe text;
alter table public.leads add column if not exists purpose text;
alter table public.leads add column if not exists bedrooms text;
alter table public.leads add column if not exists category text;

-- Add SLA / circulation fields
alter table public.leads add column if not exists no_show_count int not null default 0;
alter table public.leads add column if not exists first_response_due_at timestamptz;
alter table public.leads add column if not exists first_responded_at timestamptz;
alter table public.leads add column if not exists last_activity_at timestamptz;
alter table public.leads add column if not exists last_inquiry_at timestamptz;

-- Add import / merge fields
alter table public.leads add column if not exists import_batch_id uuid references public.import_batches on delete set null;
alter table public.leads add column if not exists merged_into_id uuid references public.leads on delete set null;

-- Add tags
alter table public.leads add column if not exists tags text[] not null default '{}';

-- Add pipeline_id (nullable, for future multi-pipeline)
alter table public.leads add column if not exists pipeline_id uuid;

-- Add lost/junk reason
alter table public.leads add column if not exists lost_reason text;
alter table public.leads add column if not exists junk_reason text;

-- ============================================================
-- INDEXES (per spec §14.2)
-- ============================================================
create index if not exists leads_board_idx on public.leads (stage_id, updated_at desc, id desc) where deleted_at is null;
create index if not exists leads_assignee_idx on public.leads (assigned_to, stage_id) where deleted_at is null;
create index if not exists leads_pool_idx on public.leads (created_at desc) where assigned_to is null and deleted_at is null;
create index if not exists leads_phone_norm_idx on public.leads (phone_norm);
create index if not exists leads_email_norm_idx on public.leads (email_norm);
create index if not exists leads_followup_idx on public.leads (next_follow_up_at) where deleted_at is null and next_follow_up_at is not null;
create index if not exists leads_sla_idx on public.leads (first_response_due_at) where first_responded_at is null and deleted_at is null;
create index if not exists leads_campaign_idx on public.leads (campaign_id);
create index if not exists leads_custom_gin on public.leads using gin (custom jsonb_path_ops);
create index if not exists leads_stage_idx on public.leads (stage_id);

-- pg_trgm for fuzzy search
create extension if not exists pg_trgm;
create index if not exists leads_search_trgm on public.leads using gin ((name || ' ' || coalesce(email,'') || ' ' || coalesce(phone,'')) gin_trgm_ops);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- lead_stages: read all authed, write admin/manager
alter table public.lead_stages enable row level security;
create policy "lead_stages_read" on public.lead_stages for select using (auth.uid() is not null);
create policy "lead_stages_write" on public.lead_stages for all using (public.has_role(array['admin','manager']));

-- communities: read all authed, write admin/manager
alter table public.communities enable row level security;
create policy "communities_read" on public.communities for select using (auth.uid() is not null);
create policy "communities_write" on public.communities for all using (public.has_role(array['admin','manager']));

-- teams + team_members: read all authed, write admin/manager
alter table public.teams enable row level security;
create policy "teams_read" on public.teams for select using (auth.uid() is not null);
create policy "teams_write" on public.teams for all using (public.has_role(array['admin','manager']));

alter table public.team_members enable row level security;
create policy "team_members_read" on public.team_members for select using (auth.uid() is not null);
create policy "team_members_write" on public.team_members for all using (public.has_role(array['admin','manager']));

-- lead_sources: read all authed, write admin/manager
alter table public.lead_sources enable row level security;
create policy "lead_sources_read" on public.lead_sources for select using (auth.uid() is not null);
create policy "lead_sources_write" on public.lead_sources for all using (public.has_role(array['admin','manager']));

-- web_forms: read all authed, write admin/manager
alter table public.web_forms enable row level security;
create policy "web_forms_read" on public.web_forms for select using (auth.uid() is not null);
create policy "web_forms_write" on public.web_forms for all using (public.has_role(array['admin','manager']));

-- custom_field_defs: read all authed, write admin/manager
alter table public.custom_field_defs enable row level security;
create policy "custom_field_defs_read" on public.custom_field_defs for select using (auth.uid() is not null);
create policy "custom_field_defs_write" on public.custom_field_defs for all using (public.has_role(array['admin','manager']));

-- lead_doc_requirements: read all authed, write admin/manager
alter table public.lead_doc_requirements enable row level security;
create policy "lead_doc_req_read" on public.lead_doc_requirements for select using (auth.uid() is not null);
create policy "lead_doc_req_write" on public.lead_doc_requirements for all using (public.has_role(array['admin','manager']));

-- routing_rules: read all authed, write admin/manager
alter table public.routing_rules enable row level security;
create policy "routing_rules_read" on public.routing_rules for select using (auth.uid() is not null);
create policy "routing_rules_write" on public.routing_rules for all using (public.has_role(array['admin','manager']));

-- lost_reasons: read all authed, write admin/manager
alter table public.lost_reasons enable row level security;
create policy "lost_reasons_read" on public.lost_reasons for select using (auth.uid() is not null);
create policy "lost_reasons_write" on public.lost_reasons for all using (public.has_role(array['admin','manager']));

-- campaigns: read all authed (agents see own + all for attribution), write admin/manager
alter table public.campaigns enable row level security;
create policy "campaigns_read" on public.campaigns for select using (auth.uid() is not null);
create policy "campaigns_write" on public.campaigns for all using (public.has_role(array['admin','manager']));

-- form_submissions: read admin/manager, insert anyone (webhook), update admin/manager
alter table public.form_submissions enable row level security;
create policy "form_submissions_read" on public.form_submissions for select using (public.has_role(array['admin','manager']));
create policy "form_submissions_insert" on public.form_submissions for insert with check (true);

-- import_batches: read admin/manager/agent (own), write admin/manager/agent (own)
alter table public.import_batches enable row level security;
create policy "import_batches_read" on public.import_batches for select using (
  public.has_role(array['admin','manager']) or created_by = auth.uid()
);
create policy "import_batches_insert" on public.import_batches for insert with check (auth.uid() is not null);

-- saved_filters: read/write own only
alter table public.saved_filters enable row level security;
create policy "saved_filters_read" on public.saved_filters for select using (user_id = auth.uid());
create policy "saved_filters_write" on public.saved_filters for all using (user_id = auth.uid());

-- rate_limits: no RLS needed (only used server-side with service role)
alter table public.rate_limits enable row level security;
create policy "rate_limits_all" on public.rate_limits for all using (true);

-- lead_events: insert-only for everyone, read for those who can see the lead
alter table public.lead_events enable row level security;
create policy "lead_events_read" on public.lead_events for select using (
  exists (
    select 1 from public.leads l
    where l.id = lead_id
    and l.deleted_at is null
    and (
      public.has_role(array['admin','manager','accountant'])
      or l.assigned_to = auth.uid()
      or l.assigned_to is null
    )
  )
);
create policy "lead_events_insert" on public.lead_events for insert with check (auth.uid() is not null);

-- lead_assignments: read for those who can see the lead, insert authed
alter table public.lead_assignments enable row level security;
create policy "lead_assignments_read" on public.lead_assignments for select using (
  exists (
    select 1 from public.leads l
    where l.id = lead_id
    and l.deleted_at is null
    and (
      public.has_role(array['admin','manager','accountant'])
      or l.assigned_to = auth.uid()
      or l.assigned_to is null
    )
  )
);
create policy "lead_assignments_insert" on public.lead_assignments for insert with check (auth.uid() is not null);

-- lead_viewings: read for those who can see the lead, insert authed, update for assigned/manager
alter table public.lead_viewings enable row level security;
create policy "lead_viewings_read" on public.lead_viewings for select using (
  exists (
    select 1 from public.leads l
    where l.id = lead_id
    and l.deleted_at is null
    and (
      public.has_role(array['admin','manager','accountant'])
      or l.assigned_to = auth.uid()
      or l.assigned_to is null
    )
  )
);
create policy "lead_viewings_insert" on public.lead_viewings for insert with check (auth.uid() is not null);
create policy "lead_viewings_update" on public.lead_viewings for update using (
  public.has_role(array['admin','manager']) or agent_id = auth.uid()
);

-- lead_tasks: read for those who can see the lead, insert/update authed
alter table public.lead_tasks enable row level security;
create policy "lead_tasks_read" on public.lead_tasks for select using (
  exists (
    select 1 from public.leads l
    where l.id = lead_id
    and l.deleted_at is null
    and (
      public.has_role(array['admin','manager','accountant'])
      or l.assigned_to = auth.uid()
      or l.assigned_to is null
    )
  )
);
create policy "lead_tasks_insert" on public.lead_tasks for insert with check (auth.uid() is not null);
create policy "lead_tasks_update" on public.lead_tasks for update using (
  public.has_role(array['admin','manager']) or assignee_id = auth.uid()
);

-- ============================================================
-- SEED: LEAD STAGES
-- ============================================================
insert into public.lead_stages (name, color, kind, sort, stale_after_days, required_fields, helper_text) values
  ('New', 'blue', 'open', 1, null, '[]'::jsonb, 'Untouched. Exit = any logged contact attempt'),
  ('Contacted', 'cyan', 'open', 2, 2, '[]'::jsonb, 'Spoke or messaged; qualifying'),
  ('Qualified', 'teal', 'open', 3, 5, '["budget_min","interest","preferred_areas"]'::jsonb, 'Requirement captured; genuine intent'),
  ('Viewing Scheduled', 'purple', 'open', 4, 3, '["viewing_scheduled"]'::jsonb, 'Viewing booked'),
  ('Viewing Done / Offer', 'indigo', 'open', 5, 2, '[]'::jsonb, 'Attended; negotiating'),
  ('Converted', 'green', 'won', 6, null, '[]'::jsonb, 'Handed to Deal pipeline'),
  ('Lost', 'slate', 'lost', 7, null, '["lost_reason"]'::jsonb, 'Genuine lead, didnt proceed'),
  ('Junk', 'gray', 'junk', 8, null, '["junk_reason"]'::jsonb, 'Spam/wrong number/duplicate')
on conflict do nothing;

-- ============================================================
-- SEED: LOST / JUNK REASONS
-- ============================================================
insert into public.lost_reasons (kind, label, sort) values
  ('lost', 'Price too high', 1),
  ('lost', 'Chose competitor', 2),
  ('lost', 'Financing failed', 3),
  ('lost', 'Unresponsive', 4),
  ('lost', 'Postponed', 5),
  ('junk', 'Spam', 1),
  ('junk', 'Wrong number', 2),
  ('junk', 'Duplicate', 3),
  ('junk', 'Agent test', 4)
on conflict do nothing;

-- ============================================================
-- SEED: CUSTOM FIELDS
-- ============================================================
insert into public.custom_field_defs (entity, key, label, type, options, required, show_on_card, show_in_list, group_name, sort) values
  ('lead', 'visa_status', 'Visa status', 'select', jsonb_build_array(
    jsonb_build_object('value','tourist','label','Tourist'),
    jsonb_build_object('value','resident','label','Resident'),
    jsonb_build_object('value','investor','label','Investor'),
    jsonb_build_object('value','golden','label','Golden Visa')
  ), false, false, false, 'Background', 1),
  ('lead', 'referred_by', 'Referred by', 'text', null, false, false, false, 'Background', 2),
  ('lead', 'pre_approval_amount', 'Pre-approval amount', 'money', null, false, false, false, 'Financing', 3)
on conflict (entity, key) do nothing;

-- ============================================================
-- SEED: LEAD DOC REQUIREMENTS
-- ============================================================
insert into public.lead_doc_requirements (name, slots, applies_when, required, allowed_types, max_mb, sort) values
  ('Emirates ID', jsonb_build_array(
    jsonb_build_object('key','front','label','Front side'),
    jsonb_build_object('key','back','label','Back side')
  ), jsonb_build_object('interest', jsonb_build_array('buy','rent')), true,
  '{pdf,jpg,jpeg,png}'::text[], 20, 1),
  ('Passport', jsonb_build_array(
    jsonb_build_object('key','photo','label','Photo page'),
    jsonb_build_object('key','visa','label','Visa page')
  ), jsonb_build_object('interest', jsonb_build_array('buy','rent')), true,
  '{pdf,jpg,jpeg,png}'::text[], 20, 2),
  ('Proof of funds / Pre-approval', jsonb_build_array(
    jsonb_build_object('key','doc','label','Document')
  ), jsonb_build_object('financing', jsonb_build_array('mortgage')), false,
  '{pdf,jpg,jpeg,png}'::text[], 20, 3),
  ('Signed booking form', jsonb_build_array(
    jsonb_build_object('key','form','label','Booking form')
  ), jsonb_build_object('stage_gte', 'Viewing Done / Offer'), false,
  '{pdf}'::text[], 20, 4)
on conflict do nothing;

-- ============================================================
-- SEED: COMMUNITIES (~60 Dubai communities)
-- ============================================================
insert into public.communities (name, area_group) values
  ('Dubai Marina', 'Waterfront'),
  ('Jumeirah Beach Residence (JBR)', 'Waterfront'),
  ('Palm Jumeirah', 'Waterfront'),
  ('Bluewaters Island', 'Waterfront'),
  ('Dubai Creek Harbour', 'Waterfront'),
  ('Emaar Beachfront', 'Waterfront'),
  ('Port de La Mer', 'Waterfront'),
  ('La Mer', 'Waterfront'),
  ('Dubai Harbour', 'Waterfront'),
  ('Jumeirah Lakes Towers (JLT)', 'Business'),
  ('Business Bay', 'Business'),
  ('DIFC', 'Business'),
  ('Sheikh Zayed Road', 'Business'),
  ('Trade Centre', 'Business'),
  ('Barsha Heights (Tecom)', 'Business'),
  ('Downtown Dubai', 'Central'),
  ('Business Bay', 'Central'),
  ('DIFC', 'Central'),
  ('Old Town', 'Central'),
  ('Sheikh Zayed Road', 'Central'),
  ('World Trade Centre', 'Central'),
  ('Za''abeel', 'Central'),
  ('Al Kifaf', 'Central'),
  ('Jumeirah Village Circle (JVC)', 'Suburban'),
  ('Jumeirah Village Triangle (JVT)', 'Suburban'),
  ('Dubai Sports City', 'Suburban'),
  ('Dubai Motor City', 'Suburban'),
  ('Arabian Ranches', 'Suburban'),
  ('Arabian Ranches 2', 'Suburban'),
  ('The Springs', 'Suburban'),
  ('The Meadows', 'Suburban'),
  ('The Lakes', 'Suburban'),
  ('The Greens', 'Suburban'),
  ('The Views', 'Suburban'),
  ('Dubai Hills Estate', 'Suburban'),
  ('Damac Hills', 'Suburban'),
  ('Damac Hills 2', 'Suburban'),
  ('Town Square', 'Suburban'),
  ('Mudon', 'Suburban'),
  ('Remraam', 'Suburban'),
  ('Akoya by Damac', 'Suburban'),
  ('Jumeirah', 'Coastal'),
  ('Umm Suqeim', 'Coastal'),
  ('Al Sufouh', 'Coastal'),
  ('Dubai Knowledge Park', 'Coastal'),
  ('Dubai Internet City', 'Coastal'),
  ('Dubai Media City', 'Coastal'),
  ('Al Barsha', 'Residential'),
  ('Al Barsha South', 'Residential'),
  ('Al Nahda', 'Residential'),
  ('Al Qusais', 'Residential'),
  ('Deira', 'Residential'),
  ('Bur Dubai', 'Residential'),
  ('Karama', 'Residential'),
  ('Oud Metha', 'Residential'),
  ('Dubai Silicon Oasis', 'Residential'),
  ('Dubailand', 'Residential'),
  ('Mirdif', 'Residential'),
  ('Warqa', 'Residential'),
  ('Muhaisnah', 'Residential'),
  ('International City', 'Residential'),
  ('Discovery Gardens', 'Residential'),
  ('Festival City', 'Residential'),
  ('Culture Village', 'Residential'),
  ('Dubai Production City', 'Residential'),
  ('Dubai Investment Park', 'Residential'),
  ('Jebel Ali', 'Residential'),
  ('Damac Hills', 'Residential')
on conflict (name) do nothing;

-- ============================================================
-- MIGRATE EXISTING LEADS: map status enum → stage_id
-- ============================================================
-- Create a mapping from old status to new stage
update public.leads set stage_id = (
  select id from public.lead_stages where name = 'New' and kind = 'open' limit 1
) where status = 'new' and stage_id is null;

update public.leads set stage_id = (
  select id from public.lead_stages where name = 'Contacted' and kind = 'open' limit 1
) where status = 'contacted' and stage_id is null;

update public.leads set stage_id = (
  select id from public.lead_stages where name = 'Qualified' and kind = 'open' limit 1
) where status = 'qualified' and stage_id is null;

update public.leads set stage_id = (
  select id from public.lead_stages where name = 'Converted' and kind = 'won' limit 1
) where status = 'converted' and stage_id is null;

update public.leads set stage_id = (
  select id from public.lead_stages where name = 'Lost' and kind = 'lost' limit 1
) where status = 'unqualified' and stage_id is null;

-- Any leads with no status get 'New'
update public.leads set stage_id = (
  select id from public.lead_stages where name = 'New' and kind = 'open' limit 1
) where stage_id is null and deleted_at is null;

-- ============================================================
-- UPDATE LEADS RLS to work with stage_id
-- ============================================================
-- Drop old leads_read policy and recreate with has_role function
drop policy if exists "leads_read" on public.leads;
create policy "leads_read" on public.leads
  for select using (
    deleted_at is null and (
      public.has_role(array['admin','manager','accountant'])
      or assigned_to = auth.uid()
      or assigned_to is null
    )
  );

-- Drop old leads_update policy and recreate
drop policy if exists "leads_update" on public.leads;
create policy "leads_update" on public.leads
  for update using (
    public.has_role(array['admin','manager'])
    or assigned_to = auth.uid()
  );

-- Add claim policy: agents can update unassigned leads (for claiming)
create policy "leads_claim" on public.leads
  for update using (assigned_to is null and auth.uid() is not null);

-- ============================================================
-- SEED: DEFAULT TEAM
-- ============================================================
insert into public.teams (name)
select 'All Agents' where not exists (select 1 from public.teams);

-- Seed team members: all active agents
insert into public.team_members (team_id, user_id, daily_cap)
select t.id, p.id, 15
from public.teams t, public.profiles p
where t.name = 'All Agents'
and p.role = 'agent'
and p.is_active = true
on conflict (team_id, user_id) do nothing;

-- ============================================================
-- SEED: DEFAULT ROUTING RULE
-- ============================================================
insert into public.routing_rules (sort, conditions, action, is_active)
select 1, '{}'::jsonb, jsonb_build_object('type','round_robin','team_id',(select id from public.teams where name='All Agents' limit 1)), true
where not exists (select 1 from public.routing_rules);
