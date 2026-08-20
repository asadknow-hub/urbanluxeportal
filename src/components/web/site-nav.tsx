"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Menu, User, X } from "lucide-react";
import { NAV, SITE } from "@/lib/web/site";
import { SiteLogo } from "@/components/web/site-logo";
import { cn } from "@/lib/utils";

export function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      {/* Top utility bar */}
      <div className="hidden border-b border-white/10 bg-[#222222] text-white/80 sm:block">
        <div className="mx-auto flex h-9 max-w-[1440px] items-center justify-between px-5 md:px-10">
          <p className="text-[0.65rem] tracking-[0.12em] uppercase">
            Property in Dubai — your dream home awaits
          </p>
          <div className="flex items-center gap-4 text-[0.65rem] tracking-wide">
            <a href={`tel:${SITE.phoneTel}`} className="transition-colors hover:text-white">
              {SITE.phoneDisplay}
            </a>
            <span className="text-white/30" aria-hidden>
              |
            </span>
            <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-white">
              {SITE.email}
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div
        className={cn(
          "border-b border-[#e5e7eb] bg-white transition-shadow duration-300",
          scrolled && "shadow-sm"
        )}
      >
        <div className="mx-auto flex h-[4.25rem] max-w-[1440px] items-center justify-between gap-6 px-5 md:px-10">
          <SiteLogo />

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={cn(
                    "text-[0.8125rem] font-medium transition-colors duration-200",
                    active ? "text-[#1E7A4A]" : "text-[#0B1D3D]/80 hover:text-[#0B1D3D]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/sell"
              prefetch
              className="hidden text-[0.8125rem] font-medium text-[#0B1D3D]/80 transition-colors hover:text-[#0B1D3D] md:inline-flex"
            >
              List with Us
            </Link>
            <Link
              href="/login"
              prefetch
              className="hidden h-9 items-center gap-1.5 rounded border border-[#0B1D3D]/15 px-3 text-[0.8125rem] font-medium text-[#0B1D3D] transition-colors hover:border-[#0B1D3D]/30 sm:inline-flex"
            >
              <User className="h-3.5 w-3.5" />
              Sign In
            </Link>
            <button
              type="button"
              className="hidden h-9 w-9 items-center justify-center rounded text-[#0B1D3D]/70 transition-colors hover:text-[#0B1D3D] lg:inline-flex"
              aria-label="Language"
            >
              <Globe className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded text-[#0B1D3D] lg:hidden"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="border-b border-[#e5e7eb] bg-white lg:hidden">
          <nav className="flex flex-col px-5 py-4" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className="border-b border-[#f2f2f2] py-3.5 text-sm font-medium text-[#0B1D3D]"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/sell" prefetch className="ul-btn-outline h-11">
                List with Us
              </Link>
              <Link href="/login" prefetch className="ul-btn-primary h-11">
                Sign In
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
