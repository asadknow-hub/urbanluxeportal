"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useBrand } from "@/components/brand/brand-provider";

const ROLES = [
  "Sales Advisor",
  "Leasing Advisor",
  "Client Coordinator",
  "Marketing Specialist",
  "Operations / Admin",
  "Other / Open application",
] as const;

export function CareersApplicationForm({ defaultRole }: { defaultRole?: string }) {
  const brand = useBrand();
  const [pending, setPending] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      (e.target as HTMLFormElement).reset();
      toast.success("Application received. Our hiring desk will be in touch.");
    }, 700);
  }

  const field =
    "h-12 w-full rounded-md border border-[#e5e7eb] bg-white px-4 text-sm text-[#0B1D3D] outline-none placeholder:text-[#6b7280] focus:border-[#1E7A4A]";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
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
      <select
        name="role"
        required
        className={field}
        defaultValue={defaultRole && ROLES.includes(defaultRole as (typeof ROLES)[number]) ? defaultRole : ""}
      >
        <option value="" disabled>
          Role you&apos;re applying for
        </option>
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      <input
        name="experience"
        placeholder="Years of experience (optional)"
        className={field}
      />
      <input
        name="linkedin"
        type="url"
        placeholder="LinkedIn or portfolio URL (optional)"
        className={field}
      />
      <textarea
        name="message"
        rows={4}
        required
        placeholder="Why Urban Luxe — and what you bring to the desk"
        className="w-full rounded-md border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#0B1D3D] outline-none placeholder:text-[#6b7280] focus:border-[#1E7A4A]"
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#0B1D3D] text-sm font-semibold text-white transition-colors hover:bg-[#0a172e] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Submit application"}
      </button>
      <p className="text-center text-xs text-[#6b7280]">
        Prefer email? Write to{" "}
        <a
          href={`mailto:${brand.email}?subject=Career%20application`}
          className="text-[#0B1D3D] underline-offset-4 hover:underline"
        >
          {brand.email}
        </a>
      </p>
    </form>
  );
}
