"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, Menu, Phone, Search, X } from "lucide-react";
import { CURRENCIES, NAV, SITE } from "@/lib/web/site";
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
          "relative z-[1] border-b border-white/10 bg-[var(--ul-primary)]/95 backdrop-blur-md transition-[box-shadow] duration-300",
          scrolled && "shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
        )}
      >
        <div
          className={cn(
            "ul-shell flex items-center justify-between gap-3 transition-[height] duration-300",
            scrolled ? "h-14" : "h-16 sm:h-[4.5rem]"
          )}
        >
          <SiteLogo inverted />

          <nav
            className={cn("hidden items-center lg:flex", scrolled ? "gap-5 xl:gap-7" : "gap-6 xl:gap-8")}
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
                    "whitespace-nowrap text-[0.8rem] font-bold uppercase tracking-[0.08em] transition-colors",
                    active ? "text-[var(--ul-secondary)]" : "text-white/75 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="relative z-[1] flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/sell"
              prefetch
              className="hidden h-10 items-center rounded-lg bg-[var(--ul-secondary)] px-4 text-[0.75rem] font-bold uppercase tracking-[0.06em] text-[#07111F] transition-colors hover:bg-[var(--ul-accent-deep)] md:inline-flex"
            >
              List property
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="hidden h-10 items-center gap-1 rounded-lg px-2 text-[0.75rem] font-semibold text-white/80 outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[var(--ul-secondary)]/40 lg:inline-flex"
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
                      <span className="font-medium">{item.code}</span>
                      <span className="ml-2 opacity-55">{item.label}</span>
                    </span>
                    {currency === item.code ? (
                      <Check className="h-3.5 w-3.5 text-[var(--ul-secondary)]" strokeWidth={2.5} />
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <a
              href={`tel:${SITE.phoneTel}`}
              className="hidden items-center gap-2 rounded-lg border border-[var(--ul-secondary)]/50 px-3 py-2 text-[0.75rem] font-bold text-white no-underline transition-colors hover:border-[var(--ul-secondary)] hover:bg-[var(--ul-secondary)]/10 md:inline-flex"
            >
              <Phone className="h-3.5 w-3.5 text-[var(--ul-secondary)]" />
              {SITE.phoneDisplay}
            </a>

            <Link
              href="/buy"
              prefetch
              className="hidden h-10 w-10 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/5 lg:inline-flex"
              aria-label="Search properties"
            >
              <Search className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
            </Link>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white lg:hidden"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-x-0 bottom-0 top-[calc(4rem+var(--ul-safe-top,0px))] z-50 flex flex-col bg-[var(--ul-primary)] lg:hidden">
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
                    "border-b border-white/10 py-4 text-base font-bold uppercase tracking-[0.08em] text-white",
                    active && "text-[var(--ul-secondary)]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="border-b border-white/10 py-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-white/50">Currency</p>
              <div className="grid grid-cols-4 gap-2">
                {CURRENCIES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setCurrency(item.code)}
                    className={cn(
                      "min-h-11 rounded-md px-2 py-2.5 text-sm font-semibold transition-colors",
                      currency === item.code
                        ? "bg-[var(--ul-secondary)] text-[#07111F]"
                        : "bg-white/5 text-white"
                    )}
                  >
                    {item.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto grid gap-3 pt-6">
              <a
                href={`tel:${SITE.phoneTel}`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[var(--ul-secondary)]/50 text-sm font-semibold text-white no-underline"
              >
                <Phone className="h-4 w-4 text-[var(--ul-secondary)]" />
                {SITE.phoneDisplay}
              </a>
              <Link href="/sell" prefetch className="ul-btn-primary h-12 w-full">
                List your property
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
