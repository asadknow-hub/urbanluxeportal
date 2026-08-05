-- Migration 0004: Commercial documents (quotations, invoices, payments, cheques, expenses)

-- ============================================================
-- QUOTATIONS
-- ============================================================

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quote_no text unique not null default 'QT-PENDING',
  customer_id uuid not null references public.customers on delete cascade,
  deal_id uuid references public.deals on delete set null,
  status quotation_status not null default 'draft',
  issue_date date not null default current_date,
  valid_until date,
  subtotal bigint not null default 0,
  discount bigint not null default 0,
  vat_amount bigint not null default 0,
  total bigint not null default 0,
  notes text,
  terms text,
  approval_id uuid,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_quotations_customer on public.quotations (customer_id);
create index idx_quotations_status on public.quotations (status);
create index idx_quotations_deal on public.quotations (deal_id);
create index idx_quotations_deleted on public.quotations (deleted_at);

create trigger trg_quotations_updated_at
  before update on public.quotations
  for each row execute function public.set_updated_at();

create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations on delete cascade,
  sort_order int not null default 0,
  description text not null,
  qty numeric not null default 1,
  unit_price bigint not null default 0,
  line_total bigint not null default 0
);

create index idx_quotation_items_quote on public.quotation_items (quotation_id);
create index idx_quotation_items_sort on public.quotation_items (quotation_id, sort_order);

-- ============================================================
-- INVOICES
-- ============================================================

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text unique not null default 'INV-PENDING',
  customer_id uuid not null references public.customers on delete cascade,
  deal_id uuid references public.deals on delete set null,
  quotation_id uuid references public.quotations on delete set null,
  status invoice_status not null default 'draft',
  issue_date date not null default current_date,
  due_date date not null default current_date + interval '30 days',
  subtotal bigint not null default 0,
  discount bigint not null default 0,
  vat_amount bigint not null default 0,
  total bigint not null default 0,
  amount_paid bigint not null default 0,
  notes text,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_invoices_customer on public.invoices (customer_id);
create index idx_invoices_status on public.invoices (status);
create index idx_invoices_due_date on public.invoices (due_date);
create index idx_invoices_deleted on public.invoices (deleted_at);

create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices on delete cascade,
  sort_order int not null default 0,
  description text not null,
  qty numeric not null default 1,
  unit_price bigint not null default 0,
  line_total bigint not null default 0
);

create index idx_invoice_items_invoice on public.invoice_items (invoice_id);
create index idx_invoice_items_sort on public.invoice_items (invoice_id, sort_order);

-- ============================================================
-- PAYMENTS
-- ============================================================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices on delete set null,
  customer_id uuid not null references public.customers on delete cascade,
  method payment_method not null default 'cash',
  amount bigint not null default 0,
  received_date date not null default current_date,
  reference text,
  notes text,
  cheque_id uuid,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_payments_invoice on public.payments (invoice_id);
create index idx_payments_customer on public.payments (customer_id);
create index idx_payments_method on public.payments (method);
create index idx_payments_date on public.payments (received_date);
create index idx_payments_deleted on public.payments (deleted_at);

create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ============================================================
-- CHEQUES
-- ============================================================

create table if not exists public.cheques (
  id uuid primary key default gen_random_uuid(),
  direction cheque_direction not null default 'incoming',
  customer_id uuid references public.customers on delete set null,
  payee text,
  bank_name text not null default '',
  cheque_no text not null default '',
  amount bigint not null default 0,
  due_date date not null default current_date,
  status cheque_status not null default 'pending',
  invoice_id uuid references public.invoices on delete set null,
  deal_id uuid references public.deals on delete set null,
  property_id uuid references public.properties on delete set null,
  bounce_reason text,
  replaced_by_cheque_id uuid,
  notes text,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_cheques_due_date on public.cheques (due_date, status);
create index idx_cheques_status on public.cheques (status);
create index idx_cheques_direction on public.cheques (direction);
create index idx_cheques_customer on public.cheques (customer_id);
create index idx_cheques_invoice on public.cheques (invoice_id);
create index idx_cheques_deleted on public.cheques (deleted_at);

create trigger trg_cheques_updated_at
  before update on public.cheques
  for each row execute function public.set_updated_at();

-- ============================================================
-- EXPENSES
-- ============================================================

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'other',
  description text not null,
  amount bigint not null default 0,
  expense_date date not null default current_date,
  vendor text,
  payment_method payment_method not null default 'cash',
  receipt_document_id uuid,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_expenses_category on public.expenses (category);
create index idx_expenses_date on public.expenses (expense_date);
create index idx_expenses_deleted on public.expenses (deleted_at);

create trigger trg_expenses_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

alter table public.quotations enable row level security;
create policy "quotations_read" on public.quotations
  for select using (deleted_at is null);
create policy "quotations_write" on public.quotations
  for all using (auth.uid() is not null);

alter table public.quotation_items enable row level security;
create policy "quotation_items_read" on public.quotation_items
  for select using (true);
create policy "quotation_items_write" on public.quotation_items
  for all using (auth.uid() is not null);

alter table public.invoices enable row level security;
create policy "invoices_read" on public.invoices
  for select using (deleted_at is null);
create policy "invoices_write" on public.invoices
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager', 'accountant'))
  );

alter table public.invoice_items enable row level security;
create policy "invoice_items_read" on public.invoice_items
  for select using (true);
create policy "invoice_items_write" on public.invoice_items
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager', 'accountant'))
  );

alter table public.payments enable row level security;
create policy "payments_read" on public.payments
  for select using (deleted_at is null);
create policy "payments_write" on public.payments
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'accountant'))
  );

alter table public.cheques enable row level security;
create policy "cheques_read" on public.cheques
  for select using (deleted_at is null);
create policy "cheques_write" on public.cheques
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager', 'accountant'))
  );

alter table public.expenses enable row level security;
create policy "expenses_read" on public.expenses
  for select using (deleted_at is null);
create policy "expenses_write" on public.expenses
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'accountant'))
  );
