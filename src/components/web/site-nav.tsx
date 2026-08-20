"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Search, User, X } from "lucide-react";
import { NAV } from "@/lib/web/site";
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
      <div
        className={cn(
          "border-b border-[#e5e7eb]/80 bg-white transition-shadow duration-300",
          scrolled && "shadow-sm"
        )}
      >
        <div className="mx-auto flex h-[4.25rem] max-w-[1440px] items-center justify-between gap-4 px-5 md:px-10">
          <SiteLogo />

          <nav className="hidden items-center gap-6 xl:gap-8 lg:flex" aria-label="Primary">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={cn(
                    "whitespace-nowrap text-[0.8125rem] font-medium transition-colors duration-200",
                    active ? "text-[#0B1D3D]" : "text-[#0B1D3D]/75 hover:text-[#0B1D3D]"
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
              className="hidden h-9 items-center rounded-md bg-[#0B1D3D] px-4 text-[0.8125rem] font-medium text-white transition-colors hover:bg-[#0a172e] md:inline-flex"
            >
              List Your Property
            </Link>

            <button
              type="button"
              className="hidden h-9 items-center gap-1.5 rounded-md px-2 text-[0.8125rem] font-medium text-[#0B1D3D] transition-colors hover:bg-[#F2F2F2] lg:inline-flex"
              aria-label="Currency: AED"
            >
              <span className="text-base leading-none" aria-hidden>
                🇦🇪
              </span>
              AED
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>

            <Link
              href="/buy"
              prefetch
              className="hidden h-9 w-9 items-center justify-center rounded-md text-[#0B1D3D] transition-colors hover:bg-[#F2F2F2] lg:inline-flex"
              aria-label="Search properties"
            >
              <Search className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
            </Link>

            <Link
              href="/login"
              prefetch
              className="hidden h-9 w-9 items-center justify-center rounded-md text-[#0B1D3D] transition-colors hover:bg-[#F2F2F2] lg:inline-flex"
              aria-label="Sign in"
            >
              <User className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
            </Link>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#0B1D3D] lg:hidden"
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
            <Link href="/sell" prefetch className="ul-btn-primary mt-4 h-11">
              List Your Property
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
