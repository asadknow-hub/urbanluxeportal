"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Who can get a mortgage in Dubai?",
    a: "UAE nationals, UAE residents, and many non-residents can finance property in Dubai, subject to bank criteria, income documentation, and the property type. Non-residents usually need a higher down payment.",
  },
  {
    q: "What down payment do I need?",
    a: "For residents buying ready property, banks commonly start around 20% down. Off-plan and non-resident purchases often require more — typically 25–50% depending on the lender and project. Always confirm with the bank before you commit.",
  },
  {
    q: "How long can a UAE mortgage term be?",
    a: "Most banks offer terms up to 25 years, with some products reaching 30 years. Age limits apply — lenders usually require the loan to finish before a set retirement age.",
  },
  {
    q: "Fixed or variable rate — which is better?",
    a: "Fixed rates give payment certainty for a period (often 1–5 years). Variable rates can move with the market. Many buyers start fixed, then refinance. We help you compare both against your hold period.",
  },
  {
    q: "Can I mortgage an off-plan property?",
    a: "Yes, for eligible projects and developers. Banks may release funds in stages against construction progress. Pre-approval and developer NOC requirements still apply.",
  },
  {
    q: "What costs sit outside the loan?",
    a: "Budget for Dubai Land Department fees, agency commission, mortgage registration, bank arrangement fees, valuation, and any life or property insurance the lender requires.",
  },
  {
    q: "How does Urban Luxe help with mortgages?",
    a: "We coordinate introductions to preferred mortgage advisors, package the property brief for the lender, and keep financing aligned with your viewing and offer timeline — so the SPA and bank process move together.",
  },
  {
    q: "Is the calculator a formal quote?",
    a: "No. The calculator is an estimate using the rate and term you enter. Final offers depend on the bank’s assessment of income, credit, property valuation, and product terms.",
  },
] as const;

export function MortgageFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-[#e5e7eb] rounded-xl border border-[#e5e7eb] bg-white">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span className="text-base font-semibold text-[#0B1D3D] md:text-[1.0625rem]">
                {item.q}
              </span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-[#0B1D3D]/50 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-200",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-[#0B1D3D]/70 md:px-6 md:text-[0.9375rem]">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
