"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, LayoutDashboard, Menu, Search, X } from "lucide-react";
import { CURRENCIES, NAV } from "@/lib/web/site";
import { SiteLogo } from "@/components/web/site-logo";
import { useCurrency } from "@/components/web/currency-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function SiteNav() {
  const pathname = usePathname();
  const { currency, setCurrency } = useCurrency();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
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
    <header className="sticky top-0 z-[100] pt-[var(--ul-safe-top,0px)]">
      <div
        className={cn(
          "relative z-[1] border-b border-[#e5e7eb]/80 bg-white transition-[box-shadow,height] duration-300 ease-out",
          scrolled && "shadow-[0_1px_0_rgba(11,29,61,0.06)]"
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 transition-[height,padding] duration-300 ease-out sm:gap-4 sm:px-5 md:px-10",
            scrolled ? "h-12" : "h-14 sm:h-[4.25rem]"
          )}
        >
          <SiteLogo
            className={cn(
              "min-w-0 transition-transform duration-300 ease-out",
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
                    "whitespace-nowrap font-bold transition-[color,font-size] duration-300",
                    scrolled ? "text-[0.75rem]" : "text-[0.8125rem]",
                    active ? "text-[#0B1D3D]" : "text-[#0B1D3D]/80 hover:text-[#0B1D3D]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className={cn("relative z-[1] flex shrink-0 items-center", scrolled ? "gap-1 sm:gap-2" : "gap-1.5 sm:gap-3")}>
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
                    onClick={() => setCurrency(item.code)}
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

            <a
              href="/login"
              className={cn(
                "relative z-10 hidden items-center gap-1.5 rounded-md border border-[#0B1D3D]/12 bg-white font-medium text-[#0B1D3D] no-underline transition-colors hover:bg-[#F2F2F2] md:inline-flex",
                scrolled ? "h-9 px-3 text-[0.75rem]" : "h-10 px-3.5 text-[0.8125rem]"
              )}
              aria-label="Agent portal"
            >
              <LayoutDashboard className={scrolled ? "h-4 w-4" : "h-[1.125rem] w-[1.125rem]"} strokeWidth={2} />
              <span>Portal</span>
            </a>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[#0B1D3D] lg:hidden"
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
        <div className="fixed inset-x-0 bottom-0 top-[calc(3.5rem+var(--ul-safe-top,0px))] z-50 flex flex-col bg-white sm:top-[calc(4.25rem+var(--ul-safe-top,0px))] lg:hidden">
          <nav
            className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-[calc(1.25rem+var(--ul-safe-bottom,0px))] pt-2"
            aria-label="Mobile"
          >
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={cn(
                    "border-b border-[#f2f2f2] py-4 text-base font-bold text-[#0B1D3D]",
                    active && "text-[#1E7A4A]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="border-b border-[#f2f2f2] py-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#0B1D3D]/50">
                Currency
              </p>
              <div className="grid grid-cols-4 gap-2">
                {CURRENCIES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setCurrency(item.code)}
                    className={cn(
                      "min-h-11 rounded-md px-2 py-2.5 text-sm font-semibold transition-colors",
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

            <div className="mt-auto grid gap-3 pt-6">
              <Link
                href="/buy"
                prefetch
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#e5e7eb] text-sm font-semibold text-[#0B1D3D]"
              >
                <Search className="h-4 w-4" />
                Search properties
              </Link>
              <a
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#e5e7eb] text-sm font-semibold text-[#0B1D3D] no-underline"
              >
                <LayoutDashboard className="h-4 w-4" />
                Agent portal
              </a>
              <Link href="/sell" prefetch className="ul-btn-primary h-12 w-full">
                List Your Property
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
