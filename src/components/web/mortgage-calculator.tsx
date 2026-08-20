"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useCurrency } from "@/components/web/currency-provider";

const PRICE_MIN = 200_000;
const PRICE_MAX = 35_000_000;
const DOWN_PCT_MIN = 10;
const DOWN_PCT_MAX = 60;
const YEARS_MIN = 1;
const YEARS_MAX = 30;
const RATE_MIN = 1;
const RATE_MAX = 20;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function monthlyPayment(principal: number, annualRate: number, years: number) {
  if (principal <= 0 || years <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat("en-AE", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

function parseNumber(raw: string) {
  const cleaned = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function CompactField({
  id,
  label,
  control,
  minLabel,
  maxLabel,
  min,
  max,
  step,
  value,
  onChange,
}: {
  id: string;
  label: string;
  control: ReactNode;
  minLabel: string;
  maxLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-[#0B1D3D]">
        {label}
      </label>
      {control}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamp(value, min, max)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ul-mortgage-range mt-2.5 w-full"
        aria-label={`${label} slider`}
      />
      <div className="mt-1 flex items-center justify-between text-[0.65rem] text-[#0B1D3D]/40">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

export function MortgageCalculator() {
  const { format } = useCurrency();
  const [price, setPrice] = useState(1_000_000);
  const [downPct, setDownPct] = useState(20);
  const [years, setYears] = useState(25);
  const [rate, setRate] = useState(3.89);
  const [priceText, setPriceText] = useState("1,000,000");
  const [downAmountText, setDownAmountText] = useState("200,000");
  const [downPctText, setDownPctText] = useState("20");
  const [yearsText, setYearsText] = useState("25");
  const [rateText, setRateText] = useState("3.89");

  const downAmount = useMemo(
    () => Math.round((price * clamp(downPct, DOWN_PCT_MIN, DOWN_PCT_MAX)) / 100),
    [price, downPct]
  );

  const downSliderMin = Math.round(price * (DOWN_PCT_MIN / 100));
  const downSliderMax = Math.round(price * (DOWN_PCT_MAX / 100));

  const monthly = useMemo(() => {
    const loan = Math.max(0, price - downAmount);
    return monthlyPayment(loan, rate, years);
  }, [price, downAmount, rate, years]);

  function setPriceValue(next: number) {
    const v = clamp(Math.round(next), PRICE_MIN, PRICE_MAX);
    setPrice(v);
    setPriceText(formatNumber(v));
    setDownAmountText(formatNumber(Math.round((v * downPct) / 100)));
  }

  function setDownFromPct(pct: number) {
    const p = clamp(Math.round(pct), DOWN_PCT_MIN, DOWN_PCT_MAX);
    setDownPct(p);
    setDownPctText(String(p));
    setDownAmountText(formatNumber(Math.round((price * p) / 100)));
  }

  function setDownFromAmount(amount: number) {
    const clamped = clamp(Math.round(amount), downSliderMin, downSliderMax);
    const pct =
      price > 0
        ? clamp(Math.round((clamped / price) * 100), DOWN_PCT_MIN, DOWN_PCT_MAX)
        : DOWN_PCT_MIN;
    setDownPct(pct);
    setDownPctText(String(pct));
    setDownAmountText(formatNumber(Math.round((price * pct) / 100)));
  }

  const inputClass =
    "h-9 w-full rounded-md border border-[#d1d5db] bg-white px-2.5 text-sm font-medium text-[#0B1D3D] outline-none transition-colors hover:border-[#0B1D3D]/35 focus:border-[#0B1D3D]";

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_4px_20px_rgba(11,29,61,0.05)] md:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-base font-bold tracking-tight text-[#0B1D3D] md:text-lg">
          Calculate your mortgage repayments
        </h2>
        <div className="sm:text-right">
          <p className="text-[0.7rem] text-[#0B1D3D]/50">Monthly repayment</p>
          <p className="text-xl font-bold tracking-tight text-[#0B1D3D] md:text-2xl">
            {format(Math.round(monthly))}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <CompactField
          id="purchase-price"
          label="Purchase Price"
          minLabel="AED 200k"
          maxLabel="AED 35M"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={10000}
          value={price}
          onChange={setPriceValue}
          control={
            <input
              id="purchase-price"
              type="text"
              inputMode="numeric"
              className={inputClass}
              value={priceText}
              onChange={(e) => setPriceText(e.target.value)}
              onBlur={() => setPriceValue(parseNumber(priceText) || PRICE_MIN)}
            />
          }
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <CompactField
          id="down-payment"
          label="Down Payment"
          minLabel={`${formatNumber(downSliderMin / 1000)}k`}
          maxLabel={`${formatNumber(downSliderMax / 1000)}k`}
          min={downSliderMin}
          max={Math.max(downSliderMin + 1, downSliderMax)}
          step={1000}
          value={downAmount}
          onChange={setDownFromAmount}
          control={
            <div className="grid grid-cols-[1fr_3.25rem] overflow-hidden rounded-md border border-[#d1d5db] focus-within:border-[#0B1D3D]">
              <input
                id="down-payment"
                type="text"
                inputMode="numeric"
                aria-label="Down payment amount"
                className="h-9 border-0 bg-transparent px-2.5 text-sm font-medium text-[#0B1D3D] outline-none"
                value={downAmountText}
                onChange={(e) => setDownAmountText(e.target.value)}
                onBlur={() => setDownFromAmount(parseNumber(downAmountText) || downSliderMin)}
              />
              <div className="relative border-l border-[#d1d5db] bg-[#F8F8F8]">
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label="Down payment percent"
                  className="h-9 w-full bg-transparent py-0 pl-1.5 pr-5 text-sm font-medium text-[#0B1D3D] outline-none"
                  value={downPctText}
                  onChange={(e) => setDownPctText(e.target.value.replace(/[^\d]/g, ""))}
                  onBlur={() => setDownFromPct(parseNumber(downPctText) || DOWN_PCT_MIN)}
                />
                <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[0.65rem] font-semibold text-[#0B1D3D]/50">
                  %
                </span>
              </div>
            </div>
          }
        />

        <CompactField
          id="loan-period"
          label="Loan Period"
          minLabel="1 yr"
          maxLabel="30 yrs"
          min={YEARS_MIN}
          max={YEARS_MAX}
          step={1}
          value={years}
          onChange={(v) => {
            setYears(v);
            setYearsText(String(v));
          }}
          control={
            <input
              id="loan-period"
              type="text"
              inputMode="numeric"
              className={inputClass}
              value={yearsText}
              onChange={(e) => setYearsText(e.target.value)}
              onBlur={() => {
                const v = clamp(
                  Math.round(parseNumber(yearsText) || YEARS_MIN),
                  YEARS_MIN,
                  YEARS_MAX
                );
                setYears(v);
                setYearsText(String(v));
              }}
            />
          }
        />

        <CompactField
          id="interest-rate"
          label="Interest Rate"
          minLabel="1%"
          maxLabel="20%"
          min={RATE_MIN}
          max={RATE_MAX}
          step={0.01}
          value={rate}
          onChange={(v) => {
            const next = Math.round(v * 100) / 100;
            setRate(next);
            setRateText(formatNumber(next, 2));
          }}
          control={
            <input
              id="interest-rate"
              type="text"
              inputMode="decimal"
              className={inputClass}
              value={rateText}
              onChange={(e) => setRateText(e.target.value)}
              onBlur={() => {
                const v =
                  Math.round(
                    clamp(parseNumber(rateText) || RATE_MIN, RATE_MIN, RATE_MAX) * 100
                  ) / 100;
                setRate(v);
                setRateText(formatNumber(v, 2));
              }}
            />
          }
        />
      </div>

      <p className="mt-3 text-[0.65rem] leading-relaxed text-[#0B1D3D]/40">
        * Estimate for {format(price)} at {formatNumber(rate, 2)}% fixed — not a bank offer.
      </p>
    </div>
  );
}
