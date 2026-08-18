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
    "h-12 w-full border border-[#e4d9c8] bg-[#fffcf8] px-4 text-sm text-[#14110e] outline-none placeholder:text-[#8a8178] focus:border-[#2dd4bf]";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {propertyTitle && (
        <p className="text-sm font-light text-[#8a8178]">
          Enquiring about <span className="text-[#14110e]">{propertyTitle}</span>
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
        className="w-full border border-[#e4d9c8] bg-[#fffcf8] px-4 py-3 text-sm text-[#14110e] outline-none placeholder:text-[#8a8178] focus:border-[#2dd4bf]"
        defaultValue={propertyTitle ? `Please share details for ${propertyTitle}.` : ""}
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center bg-[#2dd4bf] text-[0.72rem] font-semibold tracking-[0.22em] uppercase text-[#14110e] transition-colors hover:bg-[#14b8a6] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send enquiry"}
      </button>
      <p className="text-center text-xs text-[#8a8178]">
        Or call{" "}
        <a href={`tel:${SITE.phoneTel}`} className="text-[#14110e] underline-offset-4 hover:underline">
          {SITE.phoneDisplay}
        </a>
      </p>
    </form>
  );
}
