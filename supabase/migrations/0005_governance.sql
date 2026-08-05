-- Migration 0005: Documents, approvals, notifications, automation, email templates

-- ============================================================
-- DOCUMENTS
-- ============================================================

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  storage_path text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0,
  category doc_category not null default 'other',
  entity_type text,
  entity_id uuid,
  expiry_date date,
  ai_extracted jsonb,
  uploaded_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_documents_category on public.documents (category);
create index idx_documents_entity on public.documents (entity_type, entity_id);
create index idx_documents_expiry on public.documents (expiry_date);
create index idx_documents_deleted on public.documents (deleted_at);

-- ============================================================
-- APPROVALS
-- ============================================================

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  kind approval_kind not null default 'other',
  entity_type text not null,
  entity_id uuid not null,
  requested_by uuid not null references public.profiles on delete cascade,
  status approval_status not null default 'pending',
  amount bigint,
  reason text,
  decided_by uuid references public.profiles on delete set null,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now()
);

create index idx_approvals_status on public.approvals (status);
create index idx_approvals_requested_by on public.approvals (requested_by);
create index idx_approvals_entity on public.approvals (entity_type, entity_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  title text not null,
  body text not null,
  kind text not null default 'general',
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications (user_id, read_at);
create index idx_notifications_created on public.notifications (created_at desc);

-- ============================================================
-- AUTOMATION RULES
-- ============================================================

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  trigger text not null,
  conditions jsonb,
  actions jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_automation_rules_updated_at
  before update on public.automation_rules
  for each row execute function public.set_updated_at();

-- ============================================================
-- EMAIL TEMPLATES
-- ============================================================

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  subject text not null default '',
  body_html text not null default '',
  updated_at timestamptz not null default now()
);

create trigger trg_email_templates_updated_at
  before update on public.email_templates
  for each row execute function public.set_updated_at();

-- Default email templates
insert into public.email_templates (key, subject, body_html) values
  ('followup_1', 'Following up on your property inquiry', '<p>Dear {{name}},</p><p>Thank you for your interest in {{property}}. I wanted to follow up to see if you have any questions or would like to schedule a viewing.</p><p>Best regards,<br/>{{agent_name}}</p>'),
  ('lead_assigned', 'New lead assigned to you', '<p>A new lead has been assigned to you: {{lead_name}}</p>'),
  ('approval_request', 'Approval required: {{kind}}', '<p>{{requester}} has requested approval for {{entity_type}} {{entity_id}}.</p><p>Amount: {{amount}}</p><p>Reason: {{reason}}</p>'),
  ('cheque_due', 'Cheque due reminder', '<p>A cheque ({{cheque_no}}) for {{amount}} is due on {{due_date}}.</p>'),
  ('invoice_overdue', 'Invoice overdue: {{invoice_no}}', '<p>Invoice {{invoice_no}} for {{amount}} is now overdue (due date: {{due_date}}).</p>')
on conflict (key) do nothing;

-- Default automation rules
insert into public.automation_rules (name, is_active, trigger, conditions, actions) values
  ('New lead notification + round-robin', true, 'lead_created', '{}'::jsonb, '[{"type":"notify","role":"manager"},{"type":"assign_round_robin"}]'::jsonb),
  ('Deal won notification', true, 'deal_stage_changed', '{"stage":"won"}'::jsonb, '[{"type":"notify","role":"admin"}]'::jsonb),
  ('Cheque due in 7 days', true, 'cheque_due_in_7d', '{}'::jsonb, '[{"type":"notify","role":"accountant"}]'::jsonb),
  ('Document expiring in 30 days', true, 'doc_expiring_30d', '{}'::jsonb, '[{"type":"notify","role":"admin"}]'::jsonb);

-- ============================================================
-- RLS
-- ============================================================

alter table public.documents enable row level security;
create policy "documents_read" on public.documents
  for select using (deleted_at is null);
create policy "documents_write" on public.documents
  for all using (auth.uid() is not null);

alter table public.approvals enable row level security;
create policy "approvals_read" on public.approvals
  for select using (
    requested_by = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager'))
  );
create policy "approvals_insert" on public.approvals
  for insert with check (auth.uid() is not null);
create policy "approvals_decide" on public.approvals
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager'))
  );

alter table public.notifications enable row level security;
create policy "notifications_read" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications_insert" on public.notifications
  for insert with check (auth.uid() is not null);
create policy "notifications_update" on public.notifications
  for update using (user_id = auth.uid());

alter table public.automation_rules enable row level security;
create policy "automation_rules_read" on public.automation_rules
  for select using (true);
create policy "automation_rules_write" on public.automation_rules
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

alter table public.email_templates enable row level security;
create policy "email_templates_read" on public.email_templates
  for select using (true);
create policy "email_templates_write" on public.email_templates
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
