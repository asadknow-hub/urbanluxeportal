"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ComponentType, ReactNode } from "react";
import { assignDeal, updateDeal, updateDealTransaction } from "@/server/deals";
import {
  PAYMENT_METHODS,
  dealReadyToFinalize,
  type DealPaymentScheduleEntry,
} from "@/lib/deal-transaction";
import { isDealClosed, isDealLost } from "@/lib/deal-stages";
import { formatAED } from "@/lib/money";
import { toast } from "sonner";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type DealTransactionDeal = {
  id: string;
  stage: string;
  value: number;
  assigned_to: string | null;
  commission_amount: number | null;
  commission_rate: number | null;
  finalized_at?: string | null;
  expected_close_date?: string | null;
  ejari_no?: string | null;
  payment_schedule?: unknown;
  property_title: string | null;
  property_community: string | null;
  property_building: string | null;
  property_unit: string | null;
  property_ref: string | null;
  property_type: string | null;
  agency_commission_amount: number | null;
  agency_commission_rate: number | null;
  payment_method: string | null;
  payment_deposit: number | null;
  payment_balance: number | null;
  payment_notes: string | null;
  kyc_nationality: string | null;
  kyc_emirates_id: string | null;
  kyc_passport_no: string | null;
  kyc_trn: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  buyer_email: string | null;
};

function emptyPlaceholder(text = "Not captured") {
  return text;
}

function filsToAed(fils: number | null) {
  return fils != null && fils > 0 ? String(fils / 100) : "";
}

function parsePaymentSchedule(raw: unknown): DealPaymentScheduleEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((row): row is Record<string, unknown> => row != null && typeof row === "object")
    .map((row) => ({
      label: typeof row.label === "string" ? row.label : "",
      amount_fils: typeof row.amount_fils === "number" ? row.amount_fils : 0,
      due_date: typeof row.due_date === "string" ? row.due_date : null,
      status:
        row.status === "pending" || row.status === "received" || row.status === "overdue"
          ? row.status
          : "pending",
    }));
}

type ScheduleDraftRow = {
  label: string;
  amount: string;
  due_date: string;
  status: "pending" | "received" | "overdue";
};

export function DealTransactionForm({
  deal,
  canEdit,
  canManage,
  agents,
  documents = [],
}: {
  deal: DealTransactionDeal;
  canEdit: boolean;
  canManage: boolean;
  agents: { id: string; full_name: string; role: string }[];
  documents?: { category: string }[];
}) {
  const [draft, setDraft] = useState(deal);
  const [pending, startTransition] = useTransition();
  const serverDealRef = useRef(deal);

  useEffect(() => {
    serverDealRef.current = deal;
    setDraft(deal);
  }, [deal]);

  const locked = !!draft.finalized_at || isDealClosed(draft.stage);
  const editable = canEdit && !locked;
  const assigned = agents.find((a) => a.id === draft.assigned_to);
  const readiness = dealReadyToFinalize(draft, documents);

  function rollback() {
    setDraft(serverDealRef.current);
  }

  function saveTx(patch: Parameters<typeof updateDealTransaction>[1]) {
    const prev = draft;
    setDraft((current) => ({
      ...current,
      ...patch,
      payment_deposit:
        patch.payment_deposit !== undefined
          ? patch.payment_deposit != null
            ? Math.round(patch.payment_deposit * 100)
            : null
          : current.payment_deposit,
      payment_balance:
        patch.payment_balance !== undefined
          ? patch.payment_balance != null
            ? Math.round(patch.payment_balance * 100)
            : null
          : current.payment_balance,
    }));

    startTransition(async () => {
      const result = await updateDealTransaction(deal.id, patch);
      if (result.ok) {
        if (patch.payment_schedule !== undefined) toast.success("Payment schedule saved");
        serverDealRef.current = { ...prev, ...patch } as DealTransactionDeal;
      } else {
        rollback();
        toast.error(result.error ?? "Could not save");
      }
    });
  }

  function saveDeal(patch: Parameters<typeof updateDeal>[1]) {
    const prev = draft;
    setDraft((current) => ({
      ...current,
      ...patch,
      value: patch.value !== undefined ? Math.round(patch.value * 100) : current.value,
      commission_amount:
        patch.commission_amount !== undefined
          ? patch.commission_amount != null
            ? Math.round(patch.commission_amount * 100)
            : null
          : current.commission_amount,
      agency_commission_amount:
        patch.agency_commission_amount !== undefined
          ? patch.agency_commission_amount != null
            ? Math.round(patch.agency_commission_amount * 100)
            : null
          : current.agency_commission_amount,
    }));

    startTransition(async () => {
      const result = await updateDeal(deal.id, patch);
      if (result.ok) {
        serverDealRef.current = { ...prev, ...patch } as DealTransactionDeal;
      } else {
        rollback();
        toast.error(result.error ?? "Could not save");
      }
    });
  }

  function saveText(
    key:
      | "ejari_no"
      | "property_title"
      | "property_community"
      | "property_building"
      | "property_unit"
      | "property_ref"
      | "payment_notes"
      | "kyc_nationality"
      | "kyc_emirates_id"
      | "kyc_passport_no"
      | "kyc_trn"
      | "buyer_name"
      | "buyer_phone"
      | "buyer_email",
    next: string
  ) {
    const value = next.trim() || null;
    if ((draft[key] ?? null) === value) return;
    saveTx({ [key]: value });
  }

  function saveSelect<T extends string | null>(key: keyof DealTransactionDeal, next: T, via: "tx" | "deal" = "tx") {
    if ((draft[key] ?? null) === next) return;
    if (via === "deal") saveDeal({ [key]: next } as Parameters<typeof updateDeal>[1]);
    else saveTx({ [key]: next } as Parameters<typeof updateDealTransaction>[1]);
  }

  return (
    <div className="space-y-4">
      {!readiness.ok && !isDealClosed(draft.stage) && !isDealLost(draft.stage) && (
        <div className="rounded-[10px] border border-amber-200/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          Before marking closed: complete {readiness.missing.join(", ")}.
        </div>
      )}

      <Section icon={CreditCard} title="Payment">
        <PaymentGroup title="Deal terms">
          <FieldGrid>
            <LedgerRow label="Deal value">
              <QuietSaveInput
                type="number"
                value={draft.value ? String(draft.value / 100) : ""}
                disabled={!editable}
                placeholder={emptyPlaceholder("0")}
                suffix="AED"
                onSave={(v) => {
                  const next = v.trim() ? Number(v) : 0;
                  if (next === draft.value / 100) return;
                  saveDeal({ value: next });
                }}
              />
            </LedgerRow>
            <LedgerRow label="Expected close">
              <QuietSaveInput
                type="date"
                value={draft.expected_close_date?.slice(0, 10) ?? ""}
                disabled={!editable}
                placeholder={emptyPlaceholder()}
                onSave={(v) => {
                  const next = v.trim() || null;
                  const current = draft.expected_close_date?.slice(0, 10) ?? null;
                  if (next === current) return;
                  saveDeal({ expected_close_date: next });
                }}
              />
            </LedgerRow>
            <LedgerRow label="Method">
              <QuietSelect
                value={draft.payment_method ?? ""}
                disabled={!editable}
                placeholder="Select method"
                options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
                onChange={(v) => saveSelect("payment_method", v || null)}
              />
            </LedgerRow>
          </FieldGrid>
        </PaymentGroup>

        <PaymentGroup title="Amounts">
          <FieldGrid>
            <LedgerRow label="Deposit">
              <QuietSaveInput
                type="number"
                value={filsToAed(draft.payment_deposit)}
                disabled={!editable}
                placeholder={emptyPlaceholder("0")}
                suffix="AED"
                onSave={(v) => {
                  const next = v.trim() ? Number(v) : null;
                  const current =
                    draft.payment_deposit != null && draft.payment_deposit > 0
                      ? draft.payment_deposit / 100
                      : null;
                  if (next === current) return;
                  saveTx({ payment_deposit: next });
                }}
              />
            </LedgerRow>
            <LedgerRow label="Balance">
              <QuietSaveInput
                type="number"
                value={filsToAed(draft.payment_balance)}
                disabled={!editable}
                placeholder={emptyPlaceholder("0")}
                suffix="AED"
                onSave={(v) => {
                  const next = v.trim() ? Number(v) : null;
                  const current =
                    draft.payment_balance != null && draft.payment_balance > 0
                      ? draft.payment_balance / 100
                      : null;
                  if (next === current) return;
                  saveTx({ payment_balance: next });
                }}
              />
            </LedgerRow>
          </FieldGrid>
          <LedgerRow label="Notes">
            <QuietSaveInput
              value={draft.payment_notes ?? ""}
              disabled={!editable}
              placeholder={emptyPlaceholder()}
              onSave={(v) => saveText("payment_notes", v)}
            />
          </LedgerRow>
        </PaymentGroup>

        <PaymentGroup title="Commission">
          <FieldGrid>
            <LedgerRow label="Agency rate">
              <QuietSaveInput
                type="number"
                value={draft.agency_commission_rate != null ? String(draft.agency_commission_rate) : ""}
                disabled={!editable}
                placeholder={emptyPlaceholder("0")}
                suffix="%"
                onSave={(v) => {
                  const next = v.trim() ? Number(v) : null;
                  if (next === (draft.agency_commission_rate ?? null)) return;
                  saveDeal({ agency_commission_rate: next });
                }}
              />
            </LedgerRow>
            <LedgerRow label="Agency commission">
              <QuietSaveInput
                type="number"
                value={draft.agency_commission_amount ? String(draft.agency_commission_amount / 100) : ""}
                disabled={!editable}
                placeholder={
                  draft.agency_commission_rate != null && draft.value > 0 && !draft.agency_commission_amount
                    ? `Est. ${formatAED(Math.round((draft.value * draft.agency_commission_rate) / 100)).replace("AED ", "")}`
                    : emptyPlaceholder("0")
                }
                suffix="AED"
                onSave={(v) => {
                  const next = v.trim() ? Number(v) : null;
                  const current = draft.agency_commission_amount ? draft.agency_commission_amount / 100 : null;
                  if (next === current) return;
                  saveDeal({ agency_commission_amount: next });
                }}
              />
            </LedgerRow>
            <LedgerRow label="Agent">
              <QuietSelect
                value={draft.assigned_to ?? ""}
                disabled={!canManage || locked}
                placeholder="Unassigned"
                options={agents.map((a) => ({ value: a.id, label: a.full_name }))}
                onChange={(v) => {
                  const next = v || null;
                  if ((draft.assigned_to ?? null) === next) return;
                  setDraft((current) => ({ ...current, assigned_to: next }));
                  startTransition(async () => {
                    const result = await assignDeal(deal.id, next);
                    if (result.ok) {
                      serverDealRef.current = { ...serverDealRef.current, assigned_to: next };
                    } else {
                      rollback();
                      toast.error(result.error ?? "Could not assign");
                    }
                  });
                }}
              />
            </LedgerRow>
            <LedgerRow label="Agent rate">
              <QuietSaveInput
                type="number"
                value={draft.commission_rate != null ? String(draft.commission_rate) : ""}
                disabled={!editable}
                placeholder={emptyPlaceholder("0")}
                suffix="%"
                onSave={(v) => {
                  const next = v.trim() ? Number(v) : null;
                  if (next === (draft.commission_rate ?? null)) return;
                  saveDeal({ commission_rate: next });
                }}
              />
            </LedgerRow>
            <LedgerRow label="Agent commission">
              <QuietSaveInput
                type="number"
                value={draft.commission_amount ? String(draft.commission_amount / 100) : ""}
                disabled={!editable}
                placeholder={
                  draft.commission_rate != null && draft.value > 0 && !draft.commission_amount
                    ? `Est. ${formatAED(Math.round((draft.value * draft.commission_rate) / 100)).replace("AED ", "")}`
                    : emptyPlaceholder("0")
                }
                suffix="AED"
                onSave={(v) => {
                  const next = v.trim() ? Number(v) : null;
                  const current = draft.commission_amount ? draft.commission_amount / 100 : null;
                  if (next === current) return;
                  saveDeal({ commission_amount: next });
                }}
              />
            </LedgerRow>
          </FieldGrid>
          {assigned && draft.commission_amount ? (
            <p className="mt-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {assigned.full_name} · {formatAED(draft.commission_amount)}
              {draft.commission_rate != null ? ` (${draft.commission_rate}%)` : ""}
            </p>
          ) : null}
        </PaymentGroup>

        <PaymentScheduleEditor
          key={JSON.stringify(draft.payment_schedule ?? null)}
          schedule={draft.payment_schedule}
          disabled={!editable}
          onSave={(entries) => saveTx({ payment_schedule: entries.length ? entries : null })}
        />

        {pending ? <p className="text-[11px] text-muted-foreground">Saving…</p> : null}
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card">
      <div className="h-0.5 bg-primary" />
      <div className="px-[22px] py-4">
        <h3
          className="mb-3 text-center font-heading text-[1.12rem] text-foreground"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          <span className="inline-flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </span>
        </h3>
        {children}
      </div>
    </div>
  );
}

function PaymentGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4 border-b border-border pb-4 last:mb-0 last:border-b-0 last:pb-0">
      <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-primary">{title}</p>
      {children}
    </div>
  );
}

function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-4">{children}</div>;
}

function LedgerRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-center gap-0 border-b border-border py-[6px] last:border-b-0 sm:grid-cols-[108px_1fr]">
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:border-r sm:border-border sm:pr-3">
        {label}
      </span>
      <div className="min-w-0 sm:pl-3">{children}</div>
    </div>
  );
}

function QuietSaveInput({
  value,
  type = "text",
  disabled,
  placeholder,
  suffix,
  onSave,
}: {
  value: string;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
  suffix?: string;
  onSave: (next: string) => void;
}) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <input
        type={type}
        value={local}
        disabled={disabled}
        placeholder={placeholder}
        className="h-7 min-w-0 flex-1 rounded-md bg-transparent px-1 text-[0.86rem] text-foreground outline-none placeholder:text-[#B9B6AB] hover:bg-muted/70 focus:bg-muted/80 disabled:cursor-default"
        onChange={(e) => setLocal(e.target.value)}
        onBlur={(e) => {
          if (e.target.value.trim() === value.trim()) return;
          onSave(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setLocal(value);
            e.currentTarget.blur();
          }
        }}
      />
      {suffix ? (
        <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

function PaymentScheduleEditor({
  schedule,
  disabled,
  onSave,
}: {
  schedule: unknown;
  disabled?: boolean;
  onSave: (entries: DealPaymentScheduleEntry[]) => void;
}) {
  const parsed = useMemo(() => parsePaymentSchedule(schedule), [schedule]);
  const [rows, setRows] = useState<ScheduleDraftRow[]>(() =>
    parsed.length
      ? parsed.map((row) => ({
          label: row.label,
          amount: row.amount_fils > 0 ? String(row.amount_fils / 100) : "",
          due_date: row.due_date?.slice(0, 10) ?? "",
          status: row.status ?? "pending",
        }))
      : []
  );
  const [dirty, setDirty] = useState(false);

  function toEntries(draft: ScheduleDraftRow[]): DealPaymentScheduleEntry[] {
    return draft
      .filter((row) => row.label.trim() || row.amount.trim())
      .map((row) => ({
        label: row.label.trim() || "Milestone",
        amount_fils: row.amount.trim() ? Math.round(Number(row.amount) * 100) : 0,
        due_date: row.due_date.trim() || null,
        status: row.status,
      }));
  }

  function updateRow(index: number, patch: Partial<ScheduleDraftRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    setDirty(true);
  }

  function addRow() {
    setRows((prev) => [...prev, { label: "", amount: "", due_date: "", status: "pending" }]);
    setDirty(true);
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index);
    setRows(next);
    if (!disabled) {
      onSave(toEntries(next));
      setDirty(false);
    } else {
      setDirty(true);
    }
  }

  function handleSave() {
    onSave(toEntries(rows));
    setDirty(false);
  }

  return (
    <div className="pt-1">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-primary">
          Payment schedule
        </span>
        {!disabled && (
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={addRow}>
            <Plus className="h-3 w-3" />
            Add milestone
          </Button>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No milestones yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-2 rounded-md border border-border/70 bg-muted/20 p-2 sm:grid-cols-[1fr_88px_120px_96px_28px]"
            >
              <input
                value={row.label}
                disabled={disabled}
                placeholder="Label"
                className="h-7 rounded-md bg-background px-2 text-xs outline-none placeholder:text-muted-foreground disabled:opacity-60"
                onChange={(e) => updateRow(index, { label: e.target.value })}
              />
              <input
                type="number"
                value={row.amount}
                disabled={disabled}
                placeholder="AED"
                className="h-7 rounded-md bg-background px-2 text-xs outline-none placeholder:text-muted-foreground disabled:opacity-60"
                onChange={(e) => updateRow(index, { amount: e.target.value })}
              />
              <input
                type="date"
                value={row.due_date}
                disabled={disabled}
                className="h-7 rounded-md bg-background px-2 text-xs outline-none disabled:opacity-60"
                onChange={(e) => updateRow(index, { due_date: e.target.value })}
              />
              <select
                value={row.status}
                disabled={disabled}
                onChange={(e) =>
                  updateRow(index, {
                    status: e.target.value as ScheduleDraftRow["status"],
                  })
                }
                className="h-7 rounded-md bg-background px-1 text-xs outline-none disabled:opacity-60"
              >
                <option value="pending">Pending</option>
                <option value="received">Received</option>
                <option value="overdue">Overdue</option>
              </select>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                  aria-label="Remove milestone"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {!disabled && dirty && (
        <Button type="button" size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={handleSave}>
          Save schedule
        </Button>
      )}
    </div>
  );
}

function QuietSelect({
  value,
  disabled,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full cursor-pointer appearance-none rounded-md border border-transparent bg-muted/30 px-2 text-[0.86rem] text-foreground outline-none transition-colors hover:border-border hover:bg-muted/50 focus:border-primary/40 focus:bg-background disabled:cursor-default disabled:opacity-60"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
