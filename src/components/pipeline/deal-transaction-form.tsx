"use client";

import { useMemo, useState, useTransition } from "react";
import type { ComponentType, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { assignDeal, updateDeal, updateDealTransaction } from "@/server/deals";
import {
  PAYMENT_METHODS,
  dealReadyToFinalize,
  type DealPaymentScheduleEntry,
} from "@/lib/deal-transaction";
import { isDealClosed, isDealLost } from "@/lib/deal-stages";
import { formatAED } from "@/lib/money";
import { toast } from "sonner";
import { Building2, CreditCard, Plus, Trash2, UserRound } from "lucide-react";
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
}: {
  deal: DealTransactionDeal;
  canEdit: boolean;
  canManage: boolean;
  agents: { id: string; full_name: string; role: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const locked = !!deal.finalized_at || isDealClosed(deal.stage);
  const editable = canEdit && !locked;
  const assigned = agents.find((a) => a.id === deal.assigned_to);
  const readiness = dealReadyToFinalize(deal);

  function saveTx(patch: Parameters<typeof updateDealTransaction>[1]) {
    startTransition(async () => {
      const result = await updateDealTransaction(deal.id, patch);
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not save");
      }
    });
  }

  function saveDeal(patch: Parameters<typeof updateDeal>[1]) {
    startTransition(async () => {
      const result = await updateDeal(deal.id, patch);
      if (result.ok) {
        router.refresh();
      } else {
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
    if ((deal[key] ?? null) === value) return;
    saveTx({ [key]: value });
  }

  return (
    <div className="space-y-4">
      {!readiness.ok && !isDealClosed(deal.stage) && !isDealLost(deal.stage) && (
        <div className="rounded-[10px] border border-amber-200/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          Before marking closed: complete {readiness.missing.join(", ")}.
        </div>
      )}

      <Section icon={Building2} title="Property details">
        <LedgerRow label="Title">
          <QuietSaveInput
            value={deal.property_title ?? ""}
            disabled={!editable}
            placeholder={emptyPlaceholder("Property title")}
            onSave={(v) => saveText("property_title", v)}
          />
        </LedgerRow>
        <LedgerRow label="Community">
          <QuietSaveInput
            value={deal.property_community ?? ""}
            disabled={!editable}
            placeholder={emptyPlaceholder()}
            onSave={(v) => saveText("property_community", v)}
          />
        </LedgerRow>
        <LedgerRow label="Building">
          <QuietSaveInput
            value={deal.property_building ?? ""}
            disabled={!editable}
            placeholder={emptyPlaceholder()}
            onSave={(v) => saveText("property_building", v)}
          />
        </LedgerRow>
        <LedgerRow label="Unit">
          <QuietSaveInput
            value={deal.property_unit ?? ""}
            disabled={!editable}
            placeholder={emptyPlaceholder()}
            onSave={(v) => saveText("property_unit", v)}
          />
        </LedgerRow>
        <LedgerRow label="Reference">
          <QuietSaveInput
            value={deal.property_ref ?? ""}
            disabled={!editable}
            placeholder={emptyPlaceholder("Permit / ref no.")}
            onSave={(v) => saveText("property_ref", v)}
          />
        </LedgerRow>
        <LedgerRow label="Ejari no.">
          <QuietSaveInput
            value={deal.ejari_no ?? ""}
            disabled={!editable}
            placeholder={emptyPlaceholder("Rental Ejari")}
            onSave={(v) => saveText("ejari_no", v)}
          />
        </LedgerRow>
      </Section>

      <Section icon={UserRound} title="Customer details">
        <LedgerRow label="Name">
          <QuietSaveInput
            value={deal.buyer_name ?? ""}
            disabled={!editable}
            placeholder={emptyPlaceholder("Buyer name")}
            onSave={(v) => saveText("buyer_name", v)}
          />
        </LedgerRow>
        <LedgerRow label="Phone">
          <QuietSaveInput
            value={deal.buyer_phone ?? ""}
            disabled={!editable}
            placeholder={emptyPlaceholder()}
            onSave={(v) => saveText("buyer_phone", v)}
          />
        </LedgerRow>
        <LedgerRow label="Email">
          <QuietSaveInput
            value={deal.buyer_email ?? ""}
            disabled={!editable}
            placeholder={emptyPlaceholder()}
            onSave={(v) => saveText("buyer_email", v)}
          />
        </LedgerRow>
        <LedgerRow label="Nationality">
          <QuietSaveInput
            value={deal.kyc_nationality ?? ""}
            disabled={!editable}
            placeholder={emptyPlaceholder()}
            onSave={(v) => saveText("kyc_nationality", v)}
          />
        </LedgerRow>
        <LedgerRow label="Emirates ID">
          <QuietSaveInput
            value={deal.kyc_emirates_id ?? ""}
            disabled={!editable}
            placeholder={emptyPlaceholder()}
            onSave={(v) => saveText("kyc_emirates_id", v)}
          />
        </LedgerRow>
        <LedgerRow label="Passport">
          <QuietSaveInput
            value={deal.kyc_passport_no ?? ""}
            disabled={!editable}
            placeholder={emptyPlaceholder()}
            onSave={(v) => saveText("kyc_passport_no", v)}
          />
        </LedgerRow>
        <LedgerRow label="TRN">
          <QuietSaveInput
            value={deal.kyc_trn ?? ""}
            disabled={!editable}
            placeholder={emptyPlaceholder()}
            onSave={(v) => saveText("kyc_trn", v)}
          />
        </LedgerRow>
      </Section>

      <Section icon={CreditCard} title="Payment & agent">
        <LedgerRow label="Expected close">
          <QuietSaveInput
            type="date"
            value={deal.expected_close_date?.slice(0, 10) ?? ""}
            disabled={!editable}
            placeholder={emptyPlaceholder()}
            onSave={(v) => {
              const next = v.trim() || null;
              const current = deal.expected_close_date?.slice(0, 10) ?? null;
              if (next === current) return;
              saveDeal({ expected_close_date: next });
            }}
          />
        </LedgerRow>
        <LedgerRow label="Method">
          <QuietSelect
            value={deal.payment_method ?? ""}
            disabled={!editable}
            placeholder="Not captured"
            options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
            onChange={(v) => saveTx({ payment_method: v || null })}
          />
        </LedgerRow>
        <LedgerRow label="Deposit">
          <QuietSaveInput
            type="number"
            value={filsToAed(deal.payment_deposit)}
            disabled={!editable}
            placeholder={emptyPlaceholder("AED")}
            onSave={(v) => {
              const next = v.trim() ? Number(v) : null;
              const current = deal.payment_deposit != null && deal.payment_deposit > 0 ? deal.payment_deposit / 100 : null;
              if (next === current) return;
              saveTx({ payment_deposit: next });
            }}
          />
        </LedgerRow>
        <LedgerRow label="Balance">
          <QuietSaveInput
            type="number"
            value={filsToAed(deal.payment_balance)}
            disabled={!editable}
            placeholder={emptyPlaceholder("AED")}
            onSave={(v) => {
              const next = v.trim() ? Number(v) : null;
              const current = deal.payment_balance != null && deal.payment_balance > 0 ? deal.payment_balance / 100 : null;
              if (next === current) return;
              saveTx({ payment_balance: next });
            }}
          />
        </LedgerRow>
        <LedgerRow label="Deal value">
          <QuietSaveInput
            type="number"
            value={deal.value ? String(deal.value / 100) : ""}
            disabled={!editable}
            placeholder={emptyPlaceholder("AED")}
            onSave={(v) => {
              const next = v.trim() ? Number(v) : 0;
              if (next === deal.value / 100) return;
              saveDeal({ value: next });
            }}
          />
        </LedgerRow>
        <LedgerRow label="Notes">
          <QuietSaveInput
            value={deal.payment_notes ?? ""}
            disabled={!editable}
            placeholder={emptyPlaceholder()}
            onSave={(v) => saveText("payment_notes", v)}
          />
        </LedgerRow>
        <PaymentScheduleEditor
          key={JSON.stringify(deal.payment_schedule ?? null)}
          schedule={deal.payment_schedule}
          disabled={!editable}
          onSave={(entries) => saveTx({ payment_schedule: entries.length ? entries : null })}
        />
        <LedgerRow label="Agent">
          <QuietSelect
            value={deal.assigned_to ?? ""}
            disabled={!canManage || locked}
            placeholder="Unassigned"
            options={agents.map((a) => ({ value: a.id, label: a.full_name }))}
            onChange={(v) => {
              startTransition(async () => {
                const result = await assignDeal(deal.id, v || null);
                if (result.ok) router.refresh();
                else toast.error(result.error ?? "Could not assign");
              });
            }}
          />
        </LedgerRow>
        <LedgerRow label="Comm. rate">
          <QuietSaveInput
            type="number"
            value={deal.commission_rate != null ? String(deal.commission_rate) : ""}
            disabled={!editable}
            placeholder={emptyPlaceholder("%")}
            onSave={(v) => {
              const next = v.trim() ? Number(v) : null;
              if (next === (deal.commission_rate ?? null)) return;
              saveDeal({ commission_rate: next });
            }}
          />
        </LedgerRow>
        <LedgerRow label="Commission">
          <QuietSaveInput
            type="number"
            value={deal.commission_amount ? String(deal.commission_amount / 100) : ""}
            disabled={!editable}
            placeholder={
              deal.commission_rate != null && deal.value > 0 && !deal.commission_amount
                ? `Est. ${formatAED(Math.round((deal.value * deal.commission_rate) / 100)).replace("AED ", "")}`
                : emptyPlaceholder("AED")
            }
            onSave={(v) => {
              const next = v.trim() ? Number(v) : null;
              const current = deal.commission_amount ? deal.commission_amount / 100 : null;
              if (next === current) return;
              saveDeal({ commission_amount: next });
            }}
          />
        </LedgerRow>
        {assigned && deal.commission_amount ? (
          <p className="pt-2 text-xs text-muted-foreground">
            {assigned.full_name} · {formatAED(deal.commission_amount)}
            {deal.commission_rate != null ? ` (${deal.commission_rate}%)` : ""}
          </p>
        ) : null}
        {pending ? <p className="pt-1 text-[11px] text-muted-foreground">Saving…</p> : null}
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
  onSave,
}: {
  value: string;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
  onSave: (next: string) => void;
}) {
  return (
    <input
      key={`${type}-${value}`}
      type={type}
      defaultValue={value}
      disabled={disabled}
      placeholder={placeholder}
      className="h-7 w-full rounded-md bg-transparent px-1 text-[0.86rem] text-foreground outline-none placeholder:text-[#B9B6AB] hover:bg-muted/70 focus:bg-muted/80 disabled:cursor-default"
      onBlur={(e) => {
        if (e.target.value.trim() === value.trim()) return;
        onSave(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
        if (e.key === "Escape") {
          e.currentTarget.value = value;
          e.currentTarget.blur();
        }
      }}
    />
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
    setRows((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }

  function handleSave() {
    onSave(toEntries(rows));
    setDirty(false);
  }

  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Payment schedule
        </span>
        {!disabled && (
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={addRow}>
            <Plus className="h-3 w-3" />
            Add
          </Button>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No milestones yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 rounded-md border border-border/70 p-2 sm:grid-cols-[1fr_88px_120px_96px_28px]">
              <input
                value={row.label}
                disabled={disabled}
                placeholder="Label"
                className="h-7 rounded-md bg-transparent px-2 text-xs outline-none placeholder:text-muted-foreground disabled:opacity-60"
                onChange={(e) => updateRow(index, { label: e.target.value })}
              />
              <input
                type="number"
                value={row.amount}
                disabled={disabled}
                placeholder="AED"
                className="h-7 rounded-md bg-transparent px-2 text-xs outline-none placeholder:text-muted-foreground disabled:opacity-60"
                onChange={(e) => updateRow(index, { amount: e.target.value })}
              />
              <input
                type="date"
                value={row.due_date}
                disabled={disabled}
                className="h-7 rounded-md bg-transparent px-2 text-xs outline-none disabled:opacity-60"
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
                className="h-7 rounded-md bg-transparent px-1 text-xs outline-none disabled:opacity-60"
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
      className="h-7 w-full cursor-pointer appearance-none rounded-md bg-transparent px-1 text-[0.86rem] text-foreground outline-none hover:bg-muted/70 focus:bg-muted/80 disabled:cursor-default disabled:hover:bg-transparent"
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
