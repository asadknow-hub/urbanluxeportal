"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FOOTER_LINKS, FOOTER_PROPERTY, FOOTER_SERVICES } from "@/lib/web/site";
import { SiteLogo } from "@/components/web/site-logo";
import { useBrand } from "@/components/brand/brand-provider";
import { submitNewsletterForm } from "@/server/public-leads";
import { toast } from "sonner";

export function SiteFooter() {
  const brand = useBrand();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("email", email.trim());
      const result = await submitNewsletterForm(fd);
      if (!result.ok) {
        toast.error(result.error ?? "Could not subscribe");
        return;
      }
      setEmail("");
      toast.success(
        result.duplicate ? "You're already on the list." : "Subscribed. We'll keep you posted."
      );
    } catch {
      toast.error("Could not subscribe. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <footer className="bg-[#222222] text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-5 sm:py-16 md:px-10 md:py-20">
        <div className="grid gap-10 sm:gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SiteLogo inverted />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65 sm:mt-6">
              {brand.tagline} A Dubai brokerage for villas, apartments, and off-plan residences —
              placed with the care of a private office.
            </p>
            <form onSubmit={onSubscribe} className="mt-6 flex max-w-md gap-0 sm:mt-8">
              <label className="sr-only" htmlFor="footer-email">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="h-12 min-w-0 flex-1 rounded-l bg-white px-4 text-base text-[#222222] outline-none placeholder:text-[#6b7280] sm:text-sm"
              />
              <button
                type="submit"
                disabled={pending}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-r bg-[#0B1D3D] text-white transition-colors hover:bg-[#0a172e] disabled:opacity-60"
                aria-label="Subscribe"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-10 lg:col-span-7 lg:grid-cols-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] uppercase text-white/50">
                Property
              </p>
              <ul className="mt-4 space-y-2.5">
                {FOOTER_PROPERTY.map((item) => (
                  <li key={item.href + item.label}>
                    <Link
                      href={item.href}
                      prefetch
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] uppercase text-white/50">
                Services
              </p>
              <ul className="mt-4 space-y-2.5">
                {FOOTER_SERVICES.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      prefetch
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] uppercase text-white/50">
                Links
              </p>
              <ul className="mt-4 space-y-2.5">
                {FOOTER_LINKS.map((item) => (
                  <li key={item.href + item.label}>
                    <Link
                      href={item.href}
                      prefetch
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] uppercase text-white/50">
                Contact Us
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/70">
                <li>
                  <a href={`tel:${brand.phoneTel}`} className="transition-colors hover:text-white">
                    {brand.phoneDisplay}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${brand.email}`} className="transition-colors hover:text-white">
                    {brand.email}
                  </a>
                </li>
                <li className="leading-relaxed">{brand.address}</li>
                <li className="text-white/50">{brand.rera}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {brand.linkedinUrl ? (
              <a
                href={brand.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold tracking-wide text-white/50 transition-colors hover:text-white"
              >
                LinkedIn
              </a>
            ) : null}
            {brand.instagramUrl ? (
              <a
                href={brand.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold tracking-wide text-white/50 transition-colors hover:text-white"
              >
                Instagram
              </a>
            ) : null}
            <Link
              href="/privacy"
              className="text-xs font-semibold tracking-wide text-white/50 transition-colors hover:text-white"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs font-semibold tracking-wide text-white/50 transition-colors hover:text-white"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
