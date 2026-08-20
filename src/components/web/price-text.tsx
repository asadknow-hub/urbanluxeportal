"use client";

import { useCurrency } from "@/components/web/currency-provider";
import type { ListingKind } from "@/lib/web/listings";

export function PriceText({
  amountAed,
  kind,
  className,
}: {
  amountAed: number;
  kind?: ListingKind;
  className?: string;
}) {
  const { format } = useCurrency();
  return <span className={className}>{format(amountAed, kind ? { kind } : undefined)}</span>;
}
