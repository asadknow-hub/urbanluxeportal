-- Wipe other-department operational data while CRM + org structure are finalized.
-- Schema stays (parked modules still compile); rows are removed.
-- Keep: CRM (leads/deals/customers/…), Staff (profiles), documents for lead|profile|customer|deal, System settings.

truncate table
  public.property_media,
  public.properties,
  public.property_owners,
  public.quotation_items,
  public.quotations,
  public.invoice_items,
  public.invoices,
  public.payments,
  public.cheques,
  public.expenses,
  public.approvals,
  public.campaigns,
  public.form_submissions,
  public.import_batches,
  public.routing_rules,
  public.automation_rules
restart identity cascade;

delete from public.documents
where entity_type is not null
  and entity_type not in ('lead', 'profile', 'customer', 'deal');

delete from public.activity_log
where entity_type in (
  'property',
  'property_owner',
  'quotation',
  'invoice',
  'payment',
  'cheque',
  'expense',
  'approval',
  'campaign'
);

delete from public.notifications
where entity_type in (
  'property',
  'quotation',
  'invoice',
  'payment',
  'cheque',
  'expense',
  'approval',
  'campaign'
);

notify pgrst, 'reload schema';
