"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FOOTER_LINKS, FOOTER_PROPERTY, FOOTER_SERVICES } from "@/lib/web/site";
import { SiteLogo } from "@/components/web/site-logo";
import { useBrand } from "@/components/brand/brand-provider";
import { toast } from "sonner";

export function SiteFooter() {
  const brand = useBrand();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  function onSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      setEmail("");
      toast.success("Subscribed. We'll keep you posted.");
    }, 600);
  }

  return (
    <footer className="bg-[#222222] text-white">
      <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* About + newsletter */}
          <div className="lg:col-span-5">
            <SiteLogo inverted />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/65">
              {brand.tagline} A Dubai brokerage for villas, apartments, and off-plan residences —
              placed with the care of a private office.
            </p>
            <form onSubmit={onSubscribe} className="mt-8 flex max-w-md gap-0">
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
                className="h-12 min-w-0 flex-1 rounded-l bg-white px-4 text-sm text-[#222222] outline-none placeholder:text-[#6b7280]"
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

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7 lg:grid-cols-4">
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
          <div className="flex items-center gap-4">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold tracking-wide text-white/50 transition-colors hover:text-white"
              aria-label="LinkedIn"
            >
              LinkedIn
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold tracking-wide text-white/50 transition-colors hover:text-white"
              aria-label="Instagram"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
