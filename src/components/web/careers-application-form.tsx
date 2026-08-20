"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useBrand } from "@/components/brand/brand-provider";
import { submitCareersForm } from "@/server/public-leads";

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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    try {
      const result = await submitCareersForm(new FormData(form));
      if (!result.ok) {
        toast.error(result.error ?? "Could not submit application");
        return;
      }
      form.reset();
      toast.success(
        result.duplicate
          ? "We already have your application — the hiring desk will follow up."
          : "Application received. Our hiring desk will be in touch."
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
    <form onSubmit={onSubmit} className="space-y-3" encType="multipart/form-data">
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
      <input name="experience" placeholder="Years of experience (optional)" className={field} />
      <input
        name="linkedin"
        type="url"
        placeholder="LinkedIn or portfolio URL (optional)"
        className={field}
      />
      <div>
        <label htmlFor="careers-cv" className="mb-1.5 block text-xs font-medium text-[#0B1D3D]/65">
          CV / résumé (PDF or Word, max 10MB)
        </label>
        <input
          id="careers-cv"
          name="cv"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="block w-full text-sm text-[#0B1D3D] file:mr-3 file:rounded-md file:border-0 file:bg-[#F2F2F2] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#0B1D3D]"
        />
      </div>
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
