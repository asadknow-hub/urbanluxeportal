/**
 * Money utilities — all amounts stored as integer fils (1 AED = 100 fils).
 * Never use floats for money.
 */

export function filsToAED(fils: number | bigint | null | undefined): number {
  if (fils === null || fils === undefined) return 0;
  return Number(fils) / 100;
}

export function aedToFils(aed: number): number {
  return Math.round(aed * 100);
}

export function formatAED(
  fils: number | bigint | null | undefined,
  opts?: { decimals?: number }
): string {
  const decimals = opts?.decimals ?? 0;
  const aed = filsToAED(fils);
  return `AED ${aed.toLocaleString("en-AE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatAEDCompact(
  fils: number | bigint | null | undefined
): string {
  const aed = filsToAED(fils);
  if (aed >= 1_000_000) return `AED ${(aed / 1_000_000).toFixed(1)}M`;
  if (aed >= 1_000) return `AED ${(aed / 1_000).toFixed(0)}K`;
  return formatAED(fils);
}

export function formatAEDRange(
  min: number | bigint | null | undefined,
  max: number | bigint | null | undefined
): string | null {
  if (min == null && max == null) return null;
  const strip = (value: number | bigint) => formatAEDCompact(value).replace(/^AED\s/, "");
  if (min != null && max != null) return `AED ${strip(min)}–${strip(max)}`;
  if (min != null) return `From ${formatAEDCompact(min)}`;
  return `Up to ${formatAEDCompact(max)}`;
}

export function calculateVAT(
  subtotal: number,
  vatRate: number = 5.0
): number {
  return Math.round((subtotal * vatRate) / 100);
}

export function calculateTotals(
  subtotal: number,
  discount: number,
  vatRate: number = 5.0
): { subtotal: number; discount: number; vatAmount: number; total: number } {
  const afterDiscount = subtotal - discount;
  const vatAmount = calculateVAT(afterDiscount, vatRate);
  return {
    subtotal,
    discount,
    vatAmount,
    total: afterDiscount + vatAmount,
  };
}
