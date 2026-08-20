"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CURRENCY_COOKIE,
  CURRENCY_STORAGE_KEY,
  formatMoney,
  isCurrencyCode,
  type CurrencyCode,
} from "@/lib/web/currency";

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  format: (
    amountAed: number,
    opts?: { kind?: "sale" | "rent" | "offplan"; maximumFractionDigits?: number }
  ) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function persist(code: CurrencyCode) {
  window.localStorage.setItem(CURRENCY_STORAGE_KEY, code);
  document.cookie = `${CURRENCY_COOKIE}=${code};path=/;max-age=31536000;samesite=lax`;
  window.dispatchEvent(new CustomEvent("urbanluxe-currency", { detail: code }));
}

export function CurrencyProvider({
  initial = "AED",
  children,
}: {
  initial?: CurrencyCode;
  children: ReactNode;
}) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(initial);

  useEffect(() => {
    const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (isCurrencyCode(stored)) setCurrencyState(stored);

    function onExternal(e: Event) {
      const code = (e as CustomEvent<string>).detail;
      if (isCurrencyCode(code)) setCurrencyState(code);
    }
    window.addEventListener("urbanluxe-currency", onExternal);
    return () => window.removeEventListener("urbanluxe-currency", onExternal);
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    persist(code);
  }, []);

  const format = useCallback(
    (
      amountAed: number,
      opts?: { kind?: "sale" | "rent" | "offplan"; maximumFractionDigits?: number }
    ) => formatMoney(amountAed, currency, opts),
    [currency]
  );

  const value = useMemo(
    () => ({ currency, setCurrency, format }),
    [currency, setCurrency, format]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    return {
      currency: "AED" as CurrencyCode,
      setCurrency: (_code: CurrencyCode) => {},
      format: (
        amountAed: number,
        opts?: { kind?: "sale" | "rent" | "offplan"; maximumFractionDigits?: number }
      ) => formatMoney(amountAed, "AED", opts),
    };
  }
  return ctx;
}
