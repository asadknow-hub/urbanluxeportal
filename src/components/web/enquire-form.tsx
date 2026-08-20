"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SITE } from "@/lib/web/site";

export function EnquireForm({
  propertyTitle,
  compact = false,
}: {
  propertyTitle?: string;
  compact?: boolean;
}) {
  const [pending, setPending] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      (e.target as HTMLFormElement).reset();
      toast.success("Received. A specialist will be in touch.");
    }, 700);
  }

  const field =
    "h-12 w-full rounded border border-[#e5e7eb] bg-white px-4 text-sm text-[#0B1D3D] outline-none placeholder:text-[#6b7280] focus:border-[#1E7A4A]";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {propertyTitle && (
        <p className="text-sm font-light text-[#6b7280]">
          Enquiring about <span className="text-[#0B1D3D]">{propertyTitle}</span>
        </p>
      )}
      <input name="name" required placeholder="Full name" className={field} />
      <input name="email" type="email" required placeholder="Email" className={field} />
      <input name="phone" required placeholder="Mobile / WhatsApp" className={field} />
      {!compact && (
        <select name="interest" className={field} defaultValue="buy">
          <option value="buy">I want to buy</option>
          <option value="rent">I want to rent</option>
          <option value="offplan">Off-plan</option>
          <option value="sell">I want to sell</option>
        </select>
      )}
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
        <a href={`tel:${SITE.phoneTel}`} className="text-[#0B1D3D] underline-offset-4 hover:underline">
          {SITE.phoneDisplay}
        </a>
      </p>
    </form>
  );
}
