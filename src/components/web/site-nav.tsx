"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, Menu, Search, User, X } from "lucide-react";
import { CURRENCIES, NAV } from "@/lib/web/site";
import { SiteLogo } from "@/components/web/site-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const CURRENCY_KEY = "urbanluxe-currency";

export function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]["code"]>("AED");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(CURRENCY_KEY);
    if (stored && CURRENCIES.some((c) => c.code === stored)) {
      setCurrency(stored as (typeof CURRENCIES)[number]["code"]);
    }
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

  function selectCurrency(code: (typeof CURRENCIES)[number]["code"]) {
    setCurrency(code);
    window.localStorage.setItem(CURRENCY_KEY, code);
  }

  return (
    <header className="sticky top-0 z-50">
      <div
        className={cn(
          "border-b border-[#e5e7eb]/80 bg-white transition-[box-shadow,height] duration-300 ease-out",
          scrolled && "shadow-[0_1px_0_rgba(11,29,61,0.06)]"
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 transition-[height,padding] duration-300 ease-out md:px-10",
            scrolled ? "h-12" : "h-[4.25rem]"
          )}
        >
          <SiteLogo
            className={cn(
              "transition-transform duration-300 ease-out",
              scrolled && "scale-[0.88] origin-left"
            )}
          />

          <nav
            className={cn(
              "hidden items-center lg:flex",
              scrolled ? "gap-5 xl:gap-6" : "gap-6 xl:gap-8"
            )}
            aria-label="Primary"
          >
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={cn(
                    "whitespace-nowrap font-medium transition-[color,font-size] duration-300",
                    scrolled ? "text-[0.75rem]" : "text-[0.8125rem]",
                    active ? "text-[#0B1D3D]" : "text-[#0B1D3D]/75 hover:text-[#0B1D3D]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className={cn("flex items-center", scrolled ? "gap-1.5 sm:gap-2" : "gap-2 sm:gap-3")}>
            <Link
              href="/sell"
              prefetch
              className={cn(
                "hidden items-center rounded-md bg-[#0B1D3D] px-4 font-medium text-white transition-[height,font-size,background-color] duration-300 hover:bg-[#0a172e] md:inline-flex",
                scrolled ? "h-8 text-[0.75rem]" : "h-9 text-[0.8125rem]"
              )}
            >
              List Your Property
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "hidden items-center gap-1 rounded-md px-2 font-medium text-[#0B1D3D] outline-none transition-colors hover:bg-[#F2F2F2] focus-visible:ring-2 focus-visible:ring-[#0B1D3D]/20 lg:inline-flex",
                  scrolled ? "h-8 text-[0.75rem]" : "h-9 text-[0.8125rem]"
                )}
                aria-label={`Currency: ${currency}`}
              >
                {currency}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[11rem]">
                {CURRENCIES.map((item) => (
                  <DropdownMenuItem
                    key={item.code}
                    onClick={() => selectCurrency(item.code)}
                    className="flex cursor-pointer items-center justify-between gap-3"
                  >
                    <span>
                      <span className="font-medium text-[#0B1D3D]">{item.code}</span>
                      <span className="ml-2 text-[#0B1D3D]/55">{item.label}</span>
                    </span>
                    {currency === item.code ? (
                      <Check className="h-3.5 w-3.5 text-[#1E7A4A]" strokeWidth={2.5} />
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/buy"
              prefetch
              className={cn(
                "hidden items-center justify-center rounded-md text-[#0B1D3D] transition-colors hover:bg-[#F2F2F2] lg:inline-flex",
                scrolled ? "h-8 w-8" : "h-9 w-9"
              )}
              aria-label="Search properties"
            >
              <Search className={scrolled ? "h-4 w-4" : "h-[1.125rem] w-[1.125rem]"} strokeWidth={2} />
            </Link>

            <Link
              href="/login"
              prefetch
              className={cn(
                "hidden items-center justify-center rounded-md text-[#0B1D3D] transition-colors hover:bg-[#F2F2F2] lg:inline-flex",
                scrolled ? "h-8 w-8" : "h-9 w-9"
              )}
              aria-label="Sign in"
            >
              <User className={scrolled ? "h-4 w-4" : "h-[1.125rem] w-[1.125rem]"} strokeWidth={2} />
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
            <div className="border-b border-[#f2f2f2] py-3.5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#0B1D3D]/50">
                Currency
              </p>
              <div className="flex flex-wrap gap-2">
                {CURRENCIES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => selectCurrency(item.code)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      currency === item.code
                        ? "bg-[#0B1D3D] text-white"
                        : "bg-[#F2F2F2] text-[#0B1D3D]"
                    )}
                  >
                    {item.code}
                  </button>
                ))}
              </div>
            </div>
            <Link href="/sell" prefetch className="ul-btn-primary mt-4 h-11">
              List Your Property
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
