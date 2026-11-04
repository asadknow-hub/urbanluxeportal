"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useBrand } from "@/components/brand/brand-provider";
import { submitListPropertyForm } from "@/server/public-leads";

const INTENT = [
  { value: "sell", label: "I want to sell" },
  { value: "let", label: "I want to let" },
  { value: "both", label: "Sell or let" },
  { value: "valuation", label: "Valuation only" },
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
          ? "We already have your details. An advisor will follow up."
          : "Received. An advisor will contact you about your property."
      );
    } catch {
      toast.error("Could not submit. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const field =
    "h-11 w-full rounded-md border border-[var(--ul-hair)] bg-white px-3.5 text-sm text-[var(--ul-primary)] outline-none placeholder:text-[var(--ul-muted)] focus:border-[var(--ul-secondary)]";

  return (
    <form onSubmit={onSubmit} className="space-y-2.5">
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <input name="name" required placeholder="Full name" className={field} autoComplete="name" />
      <div className="grid gap-2.5 sm:grid-cols-2">
        <input
          name="phone"
          required
          placeholder="Mobile / WhatsApp"
          className={field}
          autoComplete="tel"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className={field}
          autoComplete="email"
        />
      </div>
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
      <textarea
        name="message"
        rows={2}
        placeholder="Timing or notes (optional)"
        className="w-full rounded-md border border-[var(--ul-hair)] bg-white px-3.5 py-2.5 text-sm text-[var(--ul-primary)] outline-none placeholder:text-[var(--ul-muted)] focus:border-[var(--ul-secondary)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[var(--ul-secondary)] text-sm font-semibold text-white transition-colors hover:bg-[#006633] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Request a conversation"}
      </button>
      <p className="text-center text-xs text-[var(--ul-muted)]">
        Or call{" "}
        <a
          href={`tel:${brand.phoneTel}`}
          className="text-[var(--ul-primary)] underline-offset-4 hover:underline"
        >
          {brand.phoneDisplay}
        </a>
      </p>
    </form>
  );
}
