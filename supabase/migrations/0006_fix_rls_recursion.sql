-- ============================================================
-- Fix: Infinite recursion in RLS policies
-- 
-- Root cause: Policies on `profiles` and other tables query `profiles`
-- inside RLS, which triggers RLS on `profiles` again → infinite recursion.
--
-- Fix: Create SECURITY DEFINER functions that bypass RLS to check roles,
-- then replace all inline subqueries with calls to these functions.
-- ============================================================

-- ============================================================
-- Helper functions (SECURITY DEFINER = runs as owner, bypasses RLS)
-- ============================================================

create or replace function public.has_role(p_roles text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role::text = any(p_roles)
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- ============================================================
-- Fix profiles policies
-- ============================================================

drop policy if exists "profiles_admin_all" on public.profiles;

create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin());

-- ============================================================
-- Fix company_settings policies
-- ============================================================

drop policy if exists "company_settings_admin_write" on public.company_settings;

create policy "company_settings_admin_write" on public.company_settings
  for all using (public.is_admin());

-- ============================================================
-- Fix leads policies (0002_crm.sql)
-- ============================================================

drop policy if exists "leads_read" on public.leads;
drop policy if exists "leads_update" on public.leads;

create policy "leads_read" on public.leads
  for select using (
    deleted_at is null and (
      public.has_role(array['admin', 'manager', 'accountant'])
      or assigned_to = auth.uid()
      or assigned_to is null
    )
  );

create policy "leads_update" on public.leads
  for update using (
    public.has_role(array['admin', 'manager'])
    or assigned_to = auth.uid()
  );

-- ============================================================
-- Fix customers policies
-- ============================================================

drop policy if exists "customers_read" on public.customers;
drop policy if exists "customers_update" on public.customers;

create policy "customers_read" on public.customers
  for select using (
    deleted_at is null and (
      public.has_role(array['admin', 'manager', 'accountant'])
      or assigned_to = auth.uid()
      or assigned_to is null
    )
  );

create policy "customers_update" on public.customers
  for update using (
    public.has_role(array['admin', 'manager'])
    or assigned_to = auth.uid()
  );

-- ============================================================
-- Fix deals policies
-- ============================================================

drop policy if exists "deals_read" on public.deals;
drop policy if exists "deals_update" on public.deals;

create policy "deals_read" on public.deals
  for select using (
    deleted_at is null and (
      public.has_role(array['admin', 'manager', 'accountant'])
      or assigned_to = auth.uid()
    )
  );

create policy "deals_update" on public.deals
  for update using (
    public.has_role(array['admin', 'manager'])
    or assigned_to = auth.uid()
  );

-- ============================================================
-- Fix property_owners policies (0003_properties.sql)
-- ============================================================

drop policy if exists "property_owners_write" on public.property_owners;

create policy "property_owners_write" on public.property_owners
  for all using (
    public.has_role(array['admin', 'manager', 'agent'])
  );

-- ============================================================
-- Fix properties policies
-- ============================================================

drop policy if exists "properties_write" on public.properties;

create policy "properties_write" on public.properties
  for all using (
    public.has_role(array['admin', 'manager', 'agent'])
  );

-- ============================================================
-- Fix property_media policies
-- ============================================================

drop policy if exists "property_media_write" on public.property_media;

create policy "property_media_write" on public.property_media
  for all using (
    public.has_role(array['admin', 'manager', 'agent'])
  );

-- ============================================================
-- Fix invoices policies (0004_commercial.sql)
-- ============================================================

drop policy if exists "invoices_write" on public.invoices;

create policy "invoices_write" on public.invoices
  for all using (
    public.has_role(array['admin', 'manager', 'accountant'])
  );

-- ============================================================
-- Fix invoice_items policies
-- ============================================================

drop policy if exists "invoice_items_write" on public.invoice_items;

create policy "invoice_items_write" on public.invoice_items
  for all using (
    public.has_role(array['admin', 'manager', 'accountant'])
  );

-- ============================================================
-- Fix payments policies
-- ============================================================

drop policy if exists "payments_write" on public.payments;

create policy "payments_write" on public.payments
  for all using (
    public.has_role(array['admin', 'accountant'])
  );

-- ============================================================
-- Fix cheques policies
-- ============================================================

drop policy if exists "cheques_write" on public.cheques;

create policy "cheques_write" on public.cheques
  for all using (
    public.has_role(array['admin', 'manager', 'accountant'])
  );

-- ============================================================
-- Fix expenses policies
-- ============================================================

drop policy if exists "expenses_write" on public.expenses;

create policy "expenses_write" on public.expenses
  for all using (
    public.has_role(array['admin', 'accountant'])
  );

-- ============================================================
-- Fix approvals policies (0005_governance.sql)
-- ============================================================

drop policy if exists "approvals_read" on public.approvals;
drop policy if exists "approvals_decide" on public.approvals;

create policy "approvals_read" on public.approvals
  for select using (
    requested_by = auth.uid()
    or public.has_role(array['admin', 'manager'])
  );

create policy "approvals_decide" on public.approvals
  for update using (
    public.has_role(array['admin', 'manager'])
  );

-- ============================================================
-- Fix automation_rules policies
-- ============================================================

drop policy if exists "automation_rules_write" on public.automation_rules;

create policy "automation_rules_write" on public.automation_rules
  for all using (public.is_admin());

-- ============================================================
-- Fix email_templates policies
-- ============================================================

drop policy if exists "email_templates_write" on public.email_templates;

create policy "email_templates_write" on public.email_templates
  for all using (public.is_admin());
