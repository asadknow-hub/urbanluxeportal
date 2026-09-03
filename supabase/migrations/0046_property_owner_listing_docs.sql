-- Properties: owner, Buy/Rent/Off-plan listing fields, document linking, RLS.

alter table public.properties
  add column if not exists owner_id uuid references public.customers on delete set null;

create index if not exists idx_properties_owner on public.properties (owner_id);

alter table public.listings
  add column if not exists rent_frequency text
    check (rent_frequency is null or rent_frequency in ('yearly', 'monthly', 'weekly')),
  add column if not exists security_deposit bigint,
  add column if not exists cheques int,
  add column if not exists service_charge bigint,
  add column if not exists payment_plan text,
  add column if not exists handover_date date,
  add column if not exists mortgage_available boolean;

alter table public.documents
  add column if not exists property_id uuid references public.properties on delete set null;

create index if not exists idx_documents_property on public.documents (property_id)
  where deleted_at is null;

-- Document categories: Individual (KYC/person) vs Property.
update public.lead_field_options
set extra = coalesce(extra, '{}'::jsonb) || jsonb_build_object('scope', 'individual')
where field_key = 'doc_category'
  and value in ('emirates_id', 'passport', 'visa', 'brn');

update public.lead_field_options
set extra = coalesce(extra, '{}'::jsonb) || jsonb_build_object('scope', 'property')
where field_key = 'doc_category'
  and value in ('title_deed', 'mou', 'tenancy_contract', 'noc', 'permit', 'contract', 'cheque_copy');

update public.lead_field_options
set extra = coalesce(extra, '{}'::jsonb) || jsonb_build_object('scope', 'individual')
where field_key = 'doc_category'
  and extra->>'scope' is null;

create or replace function public.crm_can_read_document(p_entity_type text, p_entity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_entity_type is null or p_entity_id is null
      then public.crm_is_house()
    when lower(p_entity_type) = 'lead'
      then public.crm_can_read_lead_id(p_entity_id)
    when lower(p_entity_type) = 'deal'
      then public.crm_can_read_deal_id(p_entity_id)
    when lower(p_entity_type) = 'customer'
      then public.crm_can_read_customer_id(p_entity_id)
    when lower(p_entity_type) = 'property'
      then auth.uid() is not null
    when lower(p_entity_type) in ('staff', 'profile')
      then public.crm_is_house() or p_entity_id = auth.uid()
    else public.crm_is_house()
  end;
$$;

create or replace function public.crm_can_write_document(p_entity_type text, p_entity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_entity_type is null or p_entity_id is null
      then public.crm_can_write_inventory()
    when lower(p_entity_type) = 'lead'
      then public.crm_can_write_lead_id(p_entity_id)
    when lower(p_entity_type) = 'deal'
      then public.crm_can_write_deal_id(p_entity_id)
    when lower(p_entity_type) = 'customer'
      then public.crm_can_write_customer_id(p_entity_id)
    when lower(p_entity_type) = 'property'
      then public.crm_can_write_inventory()
    when lower(p_entity_type) in ('staff', 'profile')
      then public.crm_can_write_inventory() or p_entity_id = auth.uid()
    else public.crm_can_write_inventory()
  end;
$$;

-- Lead docs tagged with property_id must surface on the property page even when
-- the viewer cannot open that lead (inventory house staff).
create or replace function public.crm_can_read_document_row(
  p_entity_type text,
  p_entity_id uuid,
  p_property_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.crm_can_read_document(p_entity_type, p_entity_id)
    or (p_property_id is not null and auth.uid() is not null);
$$;

create or replace function public.crm_can_write_document_row(
  p_entity_type text,
  p_entity_id uuid,
  p_property_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.crm_can_write_document(p_entity_type, p_entity_id)
    or (p_property_id is not null and public.crm_can_write_inventory());
$$;

revoke all on function public.crm_can_read_document_row(text, uuid, uuid) from public;
revoke all on function public.crm_can_write_document_row(text, uuid, uuid) from public;
grant execute on function public.crm_can_read_document_row(text, uuid, uuid) to authenticated, service_role;
grant execute on function public.crm_can_write_document_row(text, uuid, uuid) to authenticated, service_role;

drop policy if exists "documents_read" on public.documents;
create policy "documents_read" on public.documents
  for select using (
    deleted_at is null
    and public.crm_can_read_document_row(entity_type, entity_id, property_id)
  );

drop policy if exists "documents_insert" on public.documents;
create policy "documents_insert" on public.documents
  for insert with check (
    public.crm_can_write_document_row(entity_type, entity_id, property_id)
  );

drop policy if exists "documents_update" on public.documents;
create policy "documents_update" on public.documents
  for update using (
    public.crm_can_write_document_row(entity_type, entity_id, property_id)
  )
  with check (
    public.crm_can_write_document_row(entity_type, entity_id, property_id)
  );

drop policy if exists "documents_delete" on public.documents;
create policy "documents_delete" on public.documents
  for delete using (
    public.crm_can_write_document_row(entity_type, entity_id, property_id)
  );

drop policy if exists "documents_bucket_read" on storage.objects;
create policy "documents_bucket_read" on storage.objects
  for select using (
    bucket_id = 'documents'
    and auth.uid() is not null
    and exists (
      select 1
      from public.documents d
      where d.storage_path = name
        and d.deleted_at is null
        and public.crm_can_read_document_row(d.entity_type, d.entity_id, d.property_id)
    )
  );

notify pgrst, 'reload schema';
