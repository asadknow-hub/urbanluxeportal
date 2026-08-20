"use client";

import { useMemo, useState } from "react";
import { formatAedPlain } from "@/lib/web/listings";

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

export function MortgageCalculator() {
  const [price, setPrice] = useState(2_500_000);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(4.25);
  const [years, setYears] = useState(25);

  const result = useMemo(() => {
    const down = clamp(downPct, 0, 90);
    const downPayment = (price * down) / 100;
    const loan = Math.max(0, price - downPayment);
    const monthly = monthlyPayment(loan, rate, years);
    const totalPay = monthly * years * 12;
    const interest = Math.max(0, totalPay - loan);
    return { downPayment, loan, monthly, totalPay, interest, payments: years * 12 };
  }, [price, downPct, rate, years]);

  const field =
    "h-11 w-full rounded-md border border-[#d1d5db] bg-white px-3 text-sm font-medium text-[#0B1D3D] outline-none transition-colors hover:border-[#0B1D3D]/40 focus:border-[#0B1D3D]";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5 rounded-xl border border-[#e5e7eb] bg-white p-6 md:p-8">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#0B1D3D]" htmlFor="mortgage-price">
            Property price (AED)
          </label>
          <input
            id="mortgage-price"
            type="number"
            min={100000}
            step={50000}
            className={field}
            value={price}
            onChange={(e) => setPrice(clamp(Number(e.target.value) || 0, 100000, 500000000))}
          />
          <input
            type="range"
            min={500000}
            max={30000000}
            step={50000}
            value={clamp(price, 500000, 30000000)}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-3 w-full accent-[#1E7A4A]"
            aria-label="Property price slider"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-semibold text-[#0B1D3D]" htmlFor="mortgage-down">
              Down payment
            </label>
            <span className="text-sm font-bold text-[#0B1D3D]">{downPct}%</span>
          </div>
          <input
            id="mortgage-down"
            type="range"
            min={10}
            max={60}
            step={1}
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
            className="w-full accent-[#1E7A4A]"
          />
          <p className="mt-1.5 text-xs text-[#0B1D3D]/55">
            Typical UAE minimum is 20% for residents on ready property (indicative only).
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#0B1D3D]" htmlFor="mortgage-rate">
              Interest rate (% p.a.)
            </label>
            <input
              id="mortgage-rate"
              type="number"
              min={1}
              max={15}
              step={0.05}
              className={field}
              value={rate}
              onChange={(e) => setRate(clamp(Number(e.target.value) || 0, 0.5, 20))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#0B1D3D]" htmlFor="mortgage-term">
              Loan term (years)
            </label>
            <input
              id="mortgage-term"
              type="number"
              min={1}
              max={30}
              step={1}
              className={field}
              value={years}
              onChange={(e) => setYears(clamp(Number(e.target.value) || 1, 1, 30))}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-xl bg-[#0B1D3D] p-6 text-white md:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1E7A4A]">
            Estimated monthly payment
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            {formatAedPlain(Math.round(result.monthly))}
          </p>
          <p className="mt-2 text-sm text-white/60">
            Over {result.payments} payments · indicative only, not a bank offer
          </p>
        </div>

        <dl className="mt-10 space-y-4 border-t border-white/15 pt-6 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-white/65">Down payment</dt>
            <dd className="font-semibold">{formatAedPlain(Math.round(result.downPayment))}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-white/65">Loan amount</dt>
            <dd className="font-semibold">{formatAedPlain(Math.round(result.loan))}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-white/65">Total interest</dt>
            <dd className="font-semibold">{formatAedPlain(Math.round(result.interest))}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-white/65">Total payable</dt>
            <dd className="font-semibold">{formatAedPlain(Math.round(result.totalPay))}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
