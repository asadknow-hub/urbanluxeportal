import { formatAED } from "@/lib/money";
import type { DealPaymentScheduleEntry } from "@/lib/deal-transaction";

type PaymentSnapshot = {
  deposit?: number | null;
  balance?: number | null;
  schedule?: DealPaymentScheduleEntry[] | null;
  notes?: string | null;
};

export function parsePaymentSnapshot(raw: unknown): PaymentSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  return {
    deposit: typeof row.deposit === "number" ? row.deposit : null,
    balance: typeof row.balance === "number" ? row.balance : null,
    schedule: Array.isArray(row.schedule) ? (row.schedule as DealPaymentScheduleEntry[]) : null,
    notes: typeof row.notes === "string" ? row.notes : null,
  };
}

export function paymentSnapshotLines(snapshot: PaymentSnapshot | null): string[] {
  if (!snapshot) return [];
  const lines: string[] = [];
  if (snapshot.deposit != null && snapshot.deposit > 0) {
    lines.push(`Deposit ${formatAED(snapshot.deposit)}`);
  }
  if (snapshot.balance != null && snapshot.balance > 0) {
    lines.push(`Balance ${formatAED(snapshot.balance)}`);
  }
  if (snapshot.schedule?.length) {
    lines.push(`${snapshot.schedule.length} scheduled payment${snapshot.schedule.length === 1 ? "" : "s"}`);
  }
  if (snapshot.notes?.trim()) {
    lines.push(snapshot.notes.trim());
  }
  return lines;
}
