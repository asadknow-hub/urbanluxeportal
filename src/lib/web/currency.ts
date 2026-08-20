import { CURRENCIES } from "@/lib/web/site";

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const CURRENCY_STORAGE_KEY = "urbanluxe-currency";
export const CURRENCY_COOKIE = "urbanluxe-currency";

/** Approximate mid-market rates vs AED for display (not live FX). */
export const AED_TO: Record<CurrencyCode, number> = {
  AED: 1,
  USD: 1 / 3.6725,
  GBP: 1 / 4.65,
  EUR: 1 / 3.98,
};

export function isCurrencyCode(value: string | null | undefined): value is CurrencyCode {
  return !!value && CURRENCIES.some((c) => c.code === value);
}

export function convertFromAed(amountAed: number, currency: CurrencyCode) {
  return amountAed * AED_TO[currency];
}

export function formatMoney(
  amountAed: number,
  currency: CurrencyCode = "AED",
  opts?: { kind?: "sale" | "rent" | "offplan"; maximumFractionDigits?: number }
) {
  const value = convertFromAed(amountAed, currency);
  const formatted = new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    maximumFractionDigits: opts?.maximumFractionDigits ?? 0,
  }).format(value);

  if (opts?.kind === "rent") return `${formatted} / year`;
  return formatted;
}
