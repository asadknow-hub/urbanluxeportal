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
          ? "We already have your details — a specialist will follow up."
          : "Received. A specialist will be in touch."
      );
    } catch {
      toast.error("Could not send enquiry. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const field =
    "h-12 w-full rounded border border-[#e5e7eb] bg-white px-4 text-sm text-[#0B1D3D] outline-none placeholder:text-[#6b7280] focus:border-[#1E7A4A]";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* Honeypot */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      {propertyTitle && (
        <p className="text-sm font-light text-[#6b7280]">
          Enquiring about <span className="text-[#0B1D3D]">{propertyTitle}</span>
        </p>
      )}
      <input name="name" required placeholder="Full name" className={field} />
      <input name="email" type="email" required placeholder="Email" className={field} />
      <input name="phone" required placeholder="Mobile / WhatsApp" className={field} />
      {!compact && (
        <select name="interest" className={field} defaultValue={defaultInterest}>
          <option value="buy">I want to buy</option>
          <option value="rent">I want to rent</option>
          <option value="off_plan">Off-plan</option>
          <option value="sell">I want to sell</option>
        </select>
      )}
      {compact ? <input type="hidden" name="interest" value={defaultInterest} /> : null}
      <textarea
        name="message"
        rows={compact ? 3 : 4}
        placeholder="Tell us what you are looking for"
        className="w-full rounded border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#0B1D3D] outline-none placeholder:text-[#6b7280] focus:border-[#1E7A4A]"
        defaultValue={propertyTitle ? `Please share details for ${propertyTitle}.` : ""}
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded bg-[#0B1D3D] text-sm font-semibold text-white transition-colors hover:bg-[#0a172e] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send enquiry"}
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
