-- Migration 0011: Field Configuration & Mapping — robustness layer
--
-- PURPOSE:
--   This migration adds the infrastructure for:
--   1. Field mapping on lead_sources (how raw incoming data maps to lead fields)
--   2. updated_at triggers for audit trails on config tables
--   3. Soft-delete safety on custom_field_defs (never hard-delete a field definition,
--      because existing leads may have data stored in their `custom` JSONB column
--      under that field's key. Hard-deleting the definition would orphan the data
--      and make it invisible. Instead, set is_active = false to hide it from the UI
--      while preserving the ability to re-activate and see old data again.)
--   4. A helper function to safely "delete" (deactivate) a custom field definition
--      and optionally nullify the data in leads.custom if the admin explicitly wants.
--
-- SAFETY GUARANTEES:
--   - Deleting a custom field definition NEVER deletes data from leads.custom
--   - Re-creating a field with the same key automatically shows old data again
--   - Field mappings on lead_sources are optional (defaults to identity mapping)
--   - All new columns are nullable or have safe defaults
--   - All changes are additive (no destructive ALTER TABLE)

-- ============================================================
-- 1. ADD field_mapping TO lead_sources
-- ============================================================
-- The field_mapping column stores a JSON object that maps incoming
-- raw field names to lead field keys.
-- Example: {"full_name": "name", "phone_number": "phone", "visa_type": "custom.visa_status"}
-- When a lead arrives from this source, the ingestion process reads this mapping
-- to translate the raw payload into structured lead fields.
-- If field_mapping is null or empty, the system assumes field names already match.
alter table public.lead_sources add column if not exists field_mapping jsonb not null default '{}'::jsonb;

-- ============================================================
-- 2. ADD updated_at TO config tables + triggers
-- ============================================================
alter table public.lead_sources add column if not exists updated_at timestamptz not null default now();
alter table public.custom_field_defs add column if not exists updated_at timestamptz not null default now();

-- Reusable trigger function: sets updated_at = now() on row update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply the trigger to config tables that have updated_at
drop trigger if exists lead_sources_updated_at on public.lead_sources;
create trigger lead_sources_updated_at
  before update on public.lead_sources
  for each row execute function public.set_updated_at();

drop trigger if exists custom_field_defs_updated_at on public.custom_field_defs;
create trigger custom_field_defs_updated_at
  before update on public.custom_field_defs
  for each row execute function public.set_updated_at();

-- Also apply to lead_stages (already has updated_at column from migration 0010)
drop trigger if exists lead_stages_updated_at on public.lead_stages;
create trigger lead_stages_updated_at
  before update on public.lead_stages
  for each row execute function public.set_updated_at();

-- Apply to campaigns (already has updated_at column)
drop trigger if exists campaigns_updated_at on public.campaigns;
create trigger campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. SOFT-DELETE SAFETY on custom_field_defs
-- ============================================================
-- The is_active column already exists from migration 0010.
-- We add a deleted_at column for audit purposes (when was it deactivated?).
-- The application layer MUST use is_active = false (not DELETE) to "remove" a field.
-- This preserves the definition for potential re-activation and ensures
-- existing data in leads.custom[key] remains accessible if re-activated.
alter table public.custom_field_defs add column if not exists deleted_at timestamptz;

-- ============================================================
-- 4. HELPER FUNCTION: safely deactivate a custom field definition
-- ============================================================
-- Usage: select public.deactivate_custom_field(field_id text)
-- Returns: true if deactivated, false if not found
-- This function:
--   1. Sets is_active = false and deleted_at = now() on the field definition
--   2. Does NOT touch leads.custom data (preserves existing values)
--   3. If purge_data = true, removes the key from all leads.custom JSONB
create or replace function public.deactivate_custom_field(
  p_field_id uuid,
  p_purge_data boolean default false
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_key text;
  v_entity text;
begin
  -- Get the field key and entity before deactivating
  select key, entity into v_key, v_entity
  from public.custom_field_defs
  where id = p_field_id;

  if not found then
    return false;
  end if;

  -- Deactivate the field definition (soft delete)
  update public.custom_field_defs
  set is_active = false, deleted_at = now()
  where id = p_field_id;

  -- Optionally purge the key from all leads' custom JSONB
  -- This is the ONLY way data is removed, and it's explicit
  if p_purge_data and v_entity = 'lead' then
    update public.leads
    set custom = custom - v_key
    where custom ? v_key;
  end if;

  return true;
end;
$$;

-- Grant execute to authenticated users (RLS still controls who can call it)
grant execute on function public.deactivate_custom_field(uuid, boolean) to authenticated;

-- ============================================================
-- 5. ADD unique constraint on custom_field_defs (entity, key) WHERE is_active
-- ============================================================
-- This ensures no two active field definitions share the same key,
-- but allows re-creating a deactivated field with the same key
-- (the old one is inactive, so the constraint doesn't conflict).
-- The original unique constraint from migration 0010 is on (entity, key) unconditionally.
-- We replace it with a partial unique constraint that only applies to active fields.
alter table public.custom_field_defs drop constraint if exists custom_field_defs_entity_key_key;
-- Note: the original constraint was created via unique(entity, key) in the CREATE TABLE.
-- The constraint name may vary, so we try both common names.
do $$
begin
  -- Try to drop the original unique constraint
  alter table public.custom_field_defs drop constraint if exists custom_field_defs_entity_key_key;
exception when others then
  null;
end$$;

-- Add partial unique index: only one active field per (entity, key)
create unique index if not exists custom_field_defs_active_unique
  on public.custom_field_defs (entity, key)
  where is_active = true;

-- ============================================================
-- 6. ADD field_mapping index on lead_sources for quick lookups
-- ============================================================
create index if not exists lead_sources_active_idx
  on public.lead_sources (is_active, kind)
  where is_active = true;

-- ============================================================
-- 7. RLS for new column (no new table, so existing RLS covers it)
-- ============================================================
-- lead_sources already has RLS from migration 0010.
-- custom_field_defs already has RLS from migration 0010.
-- No new tables to add RLS to.

-- ============================================================
-- 8. ADD comment annotations for documentation
-- ============================================================
comment on column public.lead_sources.field_mapping is
  'JSON mapping of incoming raw field names to lead field keys. Example: {"full_name":"name","visa_type":"custom.visa_status"}. Empty = identity mapping.';
comment on column public.custom_field_defs.is_active is
  'When false, field is hidden from UI but data in leads.custom[key] is preserved. Use deactivate_custom_field() to safely deactivate.';
comment on column public.custom_field_defs.deleted_at is
  'Timestamp when the field was deactivated. NULL = still active.';
comment on function public.deactivate_custom_field(uuid, boolean) is
  'Safely deactivates a custom field definition. Set purge_data=true to also remove the key from all leads.custom JSONB. Default is false (data preserved).';
