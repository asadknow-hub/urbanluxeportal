-- Migration 0051: Allow deleting/updating person docs from a writable lead/deal.
-- Lead Documents merges customer KYC files onto the lead page; agents who can write
-- the lead were blocked by crm_can_write_customer_id when the person was assigned
-- differently. Soft-delete cannot use UPDATE…RETURNING under deleted_at-null SELECT.

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
        or exists (
          select 1
          from public.leads l
          where l.deleted_at is null
            and (
              l.customer_id = p_entity_id
              or l.converted_customer_id = p_entity_id
            )
            and public.crm_can_write_lead(l.assigned_to, l.team_id)
        )
        or exists (
          select 1
          from public.deals d
          where d.deleted_at is null
            and d.customer_id = p_entity_id
            and public.crm_can_write_deal_id(d.id)
        )
    when lower(p_entity_type) = 'property'
      then public.crm_can_write_inventory()
    when lower(p_entity_type) in ('staff', 'profile')
      then public.crm_can_write_inventory() or p_entity_id = auth.uid()
    else public.crm_can_write_inventory()
  end;
$$;

create or replace function public.crm_soft_delete_document(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity_type text;
  v_entity_id uuid;
  v_property_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select d.entity_type, d.entity_id, d.property_id
    into v_entity_type, v_entity_id, v_property_id
  from public.documents d
  where d.id = p_id
    and d.deleted_at is null;

  if not found then
    return false;
  end if;

  if not public.crm_can_write_document_row(v_entity_type, v_entity_id, v_property_id) then
    raise exception 'not authorized to delete this document' using errcode = '42501';
  end if;

  update public.documents
  set deleted_at = now()
  where id = p_id
    and deleted_at is null;

  return found;
end;
$$;

revoke all on function public.crm_soft_delete_document(uuid) from public;
grant execute on function public.crm_soft_delete_document(uuid) to authenticated, service_role;
