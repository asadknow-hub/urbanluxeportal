"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { formatAedPlain } from "@/lib/web/listings";
import { cn } from "@/lib/utils";

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

function SliderField({
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
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-[#0B1D3D]">
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
        className="ul-mortgage-range mt-4 w-full"
        aria-label={`${label} slider`}
      />
      <div className="mt-1.5 flex items-center justify-between text-xs text-[#0B1D3D]/45">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

export function MortgageCalculator() {
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

  const result = useMemo(() => {
    const loan = Math.max(0, price - downAmount);
    const monthly = monthlyPayment(loan, rate, years);
    return { loan, monthly, downAmount };
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
    "h-12 w-full rounded-md border border-[#d1d5db] bg-white px-3.5 text-base font-medium text-[#0B1D3D] outline-none transition-colors hover:border-[#0B1D3D]/35 focus:border-[#0B1D3D]";

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_8px_30px_rgba(11,29,61,0.06)]">
      <div className="px-6 py-8 md:px-10 md:py-10">
        <h2 className="text-2xl font-bold tracking-tight text-[#0B1D3D] md:text-[1.75rem]">
          Calculate your mortgage repayments
        </h2>

        <div className="mt-8 space-y-8">
          <SliderField
            id="purchase-price"
            label="Purchase Price"
            minLabel="AED 200,000"
            maxLabel="AED 35,000,000"
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

          <SliderField
            id="down-payment"
            label="Down Payment"
            minLabel={`AED ${formatNumber(downSliderMin)}`}
            maxLabel={`AED ${formatNumber(downSliderMax)}`}
            min={downSliderMin}
            max={Math.max(downSliderMin + 1, downSliderMax)}
            step={1000}
            value={downAmount}
            onChange={setDownFromAmount}
            control={
              <div className="grid grid-cols-[1fr_5.5rem] overflow-hidden rounded-md border border-[#d1d5db] focus-within:border-[#0B1D3D]">
                <input
                  id="down-payment"
                  type="text"
                  inputMode="numeric"
                  aria-label="Down payment amount"
                  className="h-12 border-0 bg-transparent px-3.5 text-base font-medium text-[#0B1D3D] outline-none"
                  value={downAmountText}
                  onChange={(e) => setDownAmountText(e.target.value)}
                  onBlur={() => setDownFromAmount(parseNumber(downAmountText) || downSliderMin)}
                />
                <div className="relative border-l border-[#d1d5db] bg-[#F8F8F8]">
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label="Down payment percent"
                    className="h-12 w-full bg-transparent py-0 pl-3 pr-7 text-base font-medium text-[#0B1D3D] outline-none"
                    value={downPctText}
                    onChange={(e) => setDownPctText(e.target.value.replace(/[^\d]/g, ""))}
                    onBlur={() => setDownFromPct(parseNumber(downPctText) || DOWN_PCT_MIN)}
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#0B1D3D]/55">
                    %
                  </span>
                </div>
              </div>
            }
          />

          <SliderField
            id="loan-period"
            label="Loan Period"
            minLabel="1 year"
            maxLabel="30 years"
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

          <SliderField
            id="interest-rate"
            label="Interest Rate:"
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

        <div className="mt-10">
          <p className="text-sm text-[#0B1D3D]/55">Monthly repayment</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-[#0B1D3D] md:text-4xl">
            {formatAedPlain(Math.round(result.monthly))}
          </p>
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-[#0B1D3D]/45">
            * Estimated initial monthly payments based on a {formatAedPlain(price)} purchase price
            with a {formatNumber(rate, 2)}% fixed interest rate.
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden bg-[#DCEEE5] px-6 py-8 md:px-10 md:py-9">
        <span
          className="pointer-events-none absolute -bottom-6 -right-2 select-none text-[9rem] font-bold leading-none text-[#0B1D3D]/[0.06] md:text-[11rem]"
          aria-hidden
        >
          UL
        </span>
        <div className="relative">
          <p className="text-lg font-bold text-[#0B1D3D] md:text-xl">
            Need help or ready to proceed?
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/contact"
              prefetch
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#0B1D3D] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0a172e]"
            >
              Start Mortgage Approval
            </Link>
            <Link
              href="/contact"
              prefetch
              className={cn(
                "inline-flex h-11 items-center justify-center rounded-full border border-[#0B1D3D] bg-transparent px-6 text-sm font-semibold text-[#0B1D3D] transition-colors hover:bg-white/50"
              )}
            >
              Speak to our team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
