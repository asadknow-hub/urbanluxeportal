-- Remove silent/unused lead columns and the old lost_reasons table.
-- Agent-facing CRM data lives in Lead Settings → Fields + lead_field_options.
-- Keep only columns that are either in that catalog or required system plumbing.

alter table public.leads drop column if exists language;
alter table public.leads drop column if exists custom;
alter table public.leads drop column if exists score_reason;
alter table public.leads drop column if exists pipeline_id;
alter table public.leads drop column if exists no_show_count;
alter table public.leads drop column if exists first_response_due_at;
alter table public.leads drop column if exists first_responded_at;
alter table public.leads drop column if exists last_inquiry_at;
alter table public.leads drop column if exists merged_into_id;
alter table public.leads drop column if exists campaign_id;
alter table public.leads drop column if exists external_ref;
alter table public.leads drop column if exists import_batch_id;

drop table if exists public.lost_reasons cascade;

notify pgrst, 'reload schema';
