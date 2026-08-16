-- Drop other-department tables entirely while CRM + org structure are finalized.
-- Keep: leads/deals/customers + related CRM, profiles/staff, documents, notifications,
-- email_templates, company_settings, activity_log, counters, lead_* config tables.

drop table if exists public.property_media cascade;
drop table if exists public.properties cascade;
drop table if exists public.property_owners cascade;

drop table if exists public.quotation_items cascade;
drop table if exists public.quotations cascade;
drop table if exists public.invoice_items cascade;
drop table if exists public.invoices cascade;
drop table if exists public.payments cascade;
drop table if exists public.cheques cascade;
drop table if exists public.expenses cascade;

drop table if exists public.approvals cascade;
drop table if exists public.automation_rules cascade;

drop table if exists public.campaigns cascade;
drop table if exists public.form_submissions cascade;
drop table if exists public.import_batches cascade;
drop table if exists public.routing_rules cascade;

-- Soft UUID leftovers on CRM tables (no FKs to dropped tables)
alter table public.deals drop column if exists property_id;
alter table public.lead_viewings drop column if exists property_id;

-- Enums used only by dropped modules
drop type if exists public.property_purpose cascade;
drop type if exists public.property_category cascade;
drop type if exists public.property_status cascade;
drop type if exists public.quotation_status cascade;
drop type if exists public.invoice_status cascade;
drop type if exists public.payment_method cascade;
drop type if exists public.cheque_direction cascade;
drop type if exists public.cheque_status cascade;
drop type if exists public.approval_kind cascade;
drop type if exists public.approval_status cascade;
drop type if exists public.campaign_status cascade;

notify pgrst, 'reload schema';
