"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useBrand } from "@/components/brand/brand-provider";
import { submitEnquiryForm } from "@/server/public-leads";

export function EnquireForm({
  propertyTitle,
  compact = false,
  defaultInterest = "buy",
}: {
  propertyTitle?: string;
  compact?: boolean;
  defaultInterest?: string;
}) {
  const brand = useBrand();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    try {
      const fd = new FormData(form);
      if (propertyTitle) fd.set("propertyTitle", propertyTitle);
      if (compact && !fd.get("interest")) fd.set("interest", defaultInterest);
      const result = await submitEnquiryForm(fd);
      if (!result.ok) {
        toast.error(result.error ?? "Could not send enquiry");
        return;
      }
      form.reset();
      toast.success(
        result.duplicate
          ? "We already have your details. A specialist will follow up."
          : "Received. A specialist will be in touch."
      );
    } catch {
      toast.error("Could not send enquiry. Please try again.");
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
      {propertyTitle ? (
        <p className="text-sm text-[var(--ul-muted)]">
          Enquiring about <span className="text-[var(--ul-primary)]">{propertyTitle}</span>
        </p>
      ) : null}
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
      {!compact ? (
        <select name="interest" className={field} defaultValue={defaultInterest}>
          <option value="buy">I want to buy</option>
          <option value="rent">I want to rent</option>
          <option value="off_plan">Off-plan</option>
          <option value="sell">I want to sell</option>
        </select>
      ) : (
        <input type="hidden" name="interest" value={defaultInterest} />
      )}
      <textarea
        name="message"
        rows={2}
        placeholder="Brief note (optional)"
        className="w-full rounded-md border border-[var(--ul-hair)] bg-white px-3.5 py-2.5 text-sm text-[var(--ul-primary)] outline-none placeholder:text-[var(--ul-muted)] focus:border-[var(--ul-secondary)]"
        defaultValue={propertyTitle ? `Please share details for ${propertyTitle}.` : ""}
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[var(--ul-secondary)] text-sm font-semibold text-white transition-colors hover:bg-[#006633] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send enquiry"}
      </button>
      {!compact ? (
        <p className="text-center text-xs text-[var(--ul-muted)]">
          Or call{" "}
          <a
            href={`tel:${brand.phoneTel}`}
            className="text-[var(--ul-primary)] underline-offset-4 hover:underline"
          >
            {brand.phoneDisplay}
          </a>
        </p>
      ) : null}
    </form>
  );
}
