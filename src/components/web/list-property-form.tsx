"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useBrand } from "@/components/brand/brand-provider";
import { submitListPropertyForm } from "@/server/public-leads";

const INTENT = [
  { value: "sell", label: "I want to sell" },
  { value: "let", label: "I want to let" },
  { value: "both", label: "Sell or let — advise me" },
  { value: "valuation", label: "Valuation only" },
] as const;

const PROPERTY_TYPES = [
  "Apartment",
  "Villa",
  "Penthouse",
  "Townhouse",
  "Other",
] as const;

export function ListPropertyForm({ defaultIntent = "sell" }: { defaultIntent?: string }) {
  const brand = useBrand();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    try {
      const result = await submitListPropertyForm(new FormData(form));
      if (!result.ok) {
        toast.error(result.error ?? "Could not submit");
        return;
      }
      form.reset();
      toast.success(
        result.duplicate
          ? "We already have your details — an advisor will follow up."
          : "Received. An advisor will contact you about your property."
      );
    } catch {
      toast.error("Could not submit. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const field =
    "h-12 w-full rounded-md border border-[#e5e7eb] bg-white px-4 text-sm text-[#0B1D3D] outline-none placeholder:text-[#6b7280] focus:border-[#1E7A4A]";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <input name="name" required placeholder="Full name" className={field} autoComplete="name" />
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className={field}
        autoComplete="email"
      />
      <input
        name="phone"
        required
        placeholder="Mobile / WhatsApp"
        className={field}
        autoComplete="tel"
      />
      <select name="intent" required className={field} defaultValue={defaultIntent}>
        {INTENT.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <input
        name="address"
        required
        placeholder="Building / community / address"
        className={field}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="propertyType" required className={field} defaultValue="">
          <option value="" disabled>
            Property type
          </option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input name="beds" placeholder="Bedrooms (optional)" className={field} />
      </div>
      <textarea
        name="message"
        rows={4}
        placeholder="Timing, asking expectations, or anything we should know"
        className="w-full rounded-md border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#0B1D3D] outline-none placeholder:text-[#6b7280] focus:border-[#1E7A4A]"
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#0B1D3D] text-sm font-semibold text-white transition-colors hover:bg-[#0a172e] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Request a conversation"}
      </button>
      <p className="text-center text-xs text-[#6b7280]">
        Or call{" "}
        <a
          href={`tel:${brand.phoneTel}`}
          className="text-[#0B1D3D] underline-offset-4 hover:underline"
        >
          {brand.phoneDisplay}
        </a>
      </p>
    </form>
  );
}
