-- Restore agent commission snapshot on finalize (regression from 0038 vs 0024)

create or replace function public.finalize_deal_to_customer(p_deal_id uuid, p_actor_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deal record;
  v_lead record;
  v_customer_id uuid;
  v_name text;
  v_phone text;
  v_email text;
  v_agent_name text;
  v_commission_amount bigint;
begin
  if auth.role() is distinct from 'service_role' then
    if auth.uid() is null then
      raise exception 'not authenticated';
    end if;
    if not public.crm_can_write_deal_id(p_deal_id) then
      raise exception 'not allowed';
    end if;
  end if;

  select * into v_deal from public.deals where id = p_deal_id and deleted_at is null;
  if not found then return null; end if;
  if v_deal.property_title is null or trim(v_deal.property_title) = '' then
    raise exception 'Property title is required before finalizing';
  end if;

  v_name := coalesce(nullif(trim(v_deal.buyer_name), ''), 'Unknown buyer');
  v_phone := nullif(trim(v_deal.buyer_phone), '');
  v_email := nullif(trim(v_deal.buyer_email), '');

  if v_deal.lead_id is not null then
    select * into v_lead from public.leads where id = v_deal.lead_id;
  end if;

  v_name := coalesce(nullif(trim(v_deal.buyer_name), ''), case when v_lead.id is not null then v_lead.name else null end, v_name);
  v_phone := coalesce(v_phone, case when v_lead.id is not null then nullif(trim(v_lead.phone), '') else null end);
  v_email := coalesce(v_email, case when v_lead.id is not null then nullif(trim(v_lead.email), '') else null end);

  if v_deal.assigned_to is not null then
    select full_name into v_agent_name from public.profiles where id = v_deal.assigned_to;
  end if;

  v_commission_amount := v_deal.commission_amount;
  if v_commission_amount is null and v_deal.commission_rate is not null and coalesce(v_deal.value, 0) > 0 then
    v_commission_amount := round(v_deal.value * v_deal.commission_rate / 100.0);
  end if;

  v_customer_id := coalesce(
    v_deal.customer_id,
    case when v_lead.id is not null then v_lead.customer_id else null end
  );

  if v_customer_id is null and v_phone is not null then
    select id into v_customer_id from public.customers
    where phone = v_phone and deleted_at is null
    limit 1;
  end if;

  if v_customer_id is null then
    insert into public.customers (
      type, name, phone, email, nationality, emirates_id, passport_no, trn,
      assigned_to, lead_id, status, lead_context, client_since, created_by
    )
    values (
      'individual',
      v_name,
      v_phone,
      v_email,
      coalesce(v_deal.kyc_nationality, case when v_lead.id is not null then v_lead.nationality else null end),
      v_deal.kyc_emirates_id,
      v_deal.kyc_passport_no,
      v_deal.kyc_trn,
      v_deal.assigned_to,
      v_deal.lead_id,
      'active',
      v_deal.lead_context,
      current_date,
      p_actor_id
    )
    returning id into v_customer_id;
  else
    update public.customers set
      status = 'active',
      client_since = coalesce(client_since, current_date),
      name = coalesce(nullif(trim(name), ''), v_name),
      phone = coalesce(phone, v_phone),
      email = coalesce(email, v_email),
      nationality = coalesce(nationality, v_deal.kyc_nationality, case when v_lead.id is not null then v_lead.nationality else null end),
      emirates_id = coalesce(emirates_id, v_deal.kyc_emirates_id),
      passport_no = coalesce(passport_no, v_deal.kyc_passport_no),
      trn = coalesce(trn, v_deal.kyc_trn),
      lead_id = coalesce(lead_id, v_deal.lead_id),
      lead_context = coalesce(lead_context, v_deal.lead_context),
      updated_at = now()
    where id = v_customer_id;
  end if;

  update public.deals set
    customer_id = v_customer_id,
    finalized_at = now(),
    updated_at = now()
  where id = p_deal_id;

  insert into public.customer_properties (
    customer_id, deal_id, deal_type, property_title, property_community,
    property_building, property_unit, property_ref, property_snapshot,
    value, payment_method, payment_snapshot,
    assigned_to, agent_name, agent_commission_amount, agent_commission_rate
  )
  select
    v_customer_id,
    p_deal_id,
    v_deal.deal_type::text,
    v_deal.property_title,
    v_deal.property_community,
    v_deal.property_building,
    v_deal.property_unit,
    v_deal.property_ref,
    v_deal.property_snapshot,
    coalesce(v_deal.value, 0),
    v_deal.payment_method,
    jsonb_build_object(
      'deposit', v_deal.payment_deposit,
      'balance', v_deal.payment_balance,
      'schedule', v_deal.payment_schedule,
      'notes', v_deal.payment_notes
    ),
    v_deal.assigned_to,
    v_agent_name,
    v_commission_amount,
    v_deal.commission_rate
  where not exists (
    select 1 from public.customer_properties cp where cp.deal_id = p_deal_id
  );

  if v_deal.lead_id is not null then
    update public.leads set
      customer_id = v_customer_id,
      converted_customer_id = v_customer_id,
      updated_at = now()
    where id = v_deal.lead_id;
  end if;

  return v_customer_id;
end;
$$;

revoke all on function public.finalize_deal_to_customer(uuid, uuid) from public;
grant execute on function public.finalize_deal_to_customer(uuid, uuid) to authenticated, service_role;
