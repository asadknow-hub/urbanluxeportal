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
    <footer className="bg-[var(--ul-primary)] text-[#F6F3EE]">
      <div className="ul-shell-wide py-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <SiteLogo inverted />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#F6F3EE]/55">
              {brand.tagline} A Dubai brokerage for villas, apartments, and off-plan residences,
              placed with the care of a private office.
            </p>
            <form onSubmit={onSubscribe} className="mt-4 flex max-w-md gap-0">
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
                className="h-10 min-w-0 flex-1 rounded-l bg-white px-3 text-sm text-[#222222] outline-none placeholder:text-[#6b7280]"
              />
              <button
                type="submit"
                disabled={pending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-r bg-[var(--ul-secondary)] text-white transition-colors hover:bg-[var(--ul-accent-deep)] disabled:opacity-60"
                aria-label="Subscribe"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:col-span-8 lg:gap-5">
            <div>
              <p className="text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-[#F6F3EE]/45">
                Property
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {FOOTER_PROPERTY.map((item) => (
                  <li key={item.href + item.label}>
                    <Link
                      href={item.href}
                      prefetch
                      className="text-sm text-[#F6F3EE]/70 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-[#F6F3EE]/45">
                Services
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {FOOTER_SERVICES.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      prefetch
                      className="text-sm text-[#F6F3EE]/70 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-[#F6F3EE]/45">
                Links
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {FOOTER_LINKS.map((item) => (
                  <li key={item.href + item.label}>
                    <Link
                      href={item.href}
                      prefetch
                      className="text-sm text-[#F6F3EE]/70 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-[#F6F3EE]/45">
                Contact Us
              </p>
              <ul className="mt-2.5 space-y-1.5 text-sm text-[#F6F3EE]/70">
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
                <li className="leading-snug">{brand.address}</li>
                <li className="text-[#F6F3EE]/45">{brand.rera}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-[#F6F3EE]/12 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#F6F3EE]/40">
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {brand.linkedinUrl ? (
              <a
                href={brand.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold tracking-wide text-[#F6F3EE]/50 transition-colors hover:text-white"
              >
                LinkedIn
              </a>
            ) : null}
            {brand.instagramUrl ? (
              <a
                href={brand.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold tracking-wide text-[#F6F3EE]/50 transition-colors hover:text-white"
              >
                Instagram
              </a>
            ) : null}
            <Link
              href="/privacy"
              className="text-xs font-semibold tracking-wide text-[#F6F3EE]/50 transition-colors hover:text-white"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs font-semibold tracking-wide text-[#F6F3EE]/50 transition-colors hover:text-white"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
