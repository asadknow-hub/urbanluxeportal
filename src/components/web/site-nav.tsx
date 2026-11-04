"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, Menu, Phone, X } from "lucide-react";
import { CURRENCIES, NAV } from "@/lib/web/site";
import { SiteLogo } from "@/components/web/site-logo";
import { useCurrency } from "@/components/web/currency-provider";
import { useBrand } from "@/components/brand/brand-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function SiteNav() {
  const pathname = usePathname();
  const brand = useBrand();
  const { currency, setCurrency } = useCurrency();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const onHome = pathname === "/";
  /** Transparent only while sitting over the dark home hero */
  const overDarkHero = onHome && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
    <>
      {/* Fixed overlay — sits ON the hero at rest (not a white strip above it) */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[100] pt-[var(--ul-safe-top,0px)] transition-[background-color,box-shadow,backdrop-filter] duration-300",
          overDarkHero
            ? "bg-transparent"
            : "bg-[var(--ul-paper)]/95 shadow-[0_8px_28px_rgba(10,22,48,0.08)] backdrop-blur-md"
        )}
      >
        <div
          className={cn(
            "ul-shell-wide grid items-center gap-3 transition-[height] duration-300",
            "grid-cols-[auto_1fr_auto] lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
            scrolled || !onHome ? "h-14" : "h-16 sm:h-[4.25rem]"
          )}
        >
          <div className="justify-self-start">
            <SiteLogo inverted={overDarkHero} />
          </div>

          <nav
            className="hidden items-center justify-center gap-7 xl:gap-9 lg:flex"
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
                    "whitespace-nowrap text-[0.78rem] font-bold uppercase tracking-[0.1em] transition-colors",
                    overDarkHero
                      ? active
                        ? "text-[var(--ul-secondary)]"
                        : "text-white/85 hover:text-white"
                      : active
                        ? "text-[var(--ul-secondary)]"
                        : "text-[var(--ul-primary)]/70 hover:text-[var(--ul-primary)]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center justify-self-end gap-2 sm:gap-3">
            <Link
              href="/sell"
              prefetch
              className="hidden h-10 items-center rounded-full bg-[var(--ul-secondary)] px-4 text-[0.72rem] font-bold uppercase tracking-[0.06em] text-white transition-colors hover:bg-[var(--ul-accent-deep)] md:inline-flex"
            >
              List property
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "hidden h-10 items-center gap-1 rounded-full px-2 text-[0.75rem] font-semibold outline-none transition-colors lg:inline-flex",
                  overDarkHero
                    ? "text-white/85 hover:bg-white/10"
                    : "text-[var(--ul-primary)]/75 hover:bg-[var(--ul-tertiary)]"
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
              href={`tel:${brand.phoneTel}`}
              className={cn(
                "hidden items-center gap-2 rounded-full border px-3 py-2 text-[0.72rem] font-bold no-underline transition-colors md:inline-flex",
                overDarkHero
                  ? "border-white/30 text-white hover:border-[var(--ul-secondary)] hover:bg-white/5"
                  : "border-[var(--ul-hair)] text-[var(--ul-primary)] hover:border-[var(--ul-secondary)]"
              )}
            >
              <Phone className="h-3.5 w-3.5 text-[var(--ul-secondary)]" />
              <span className="hidden lg:inline">{brand.phoneDisplay}</span>
              <span className="lg:hidden">Call</span>
            </a>

            <button
              type="button"
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-full lg:hidden",
                overDarkHero ? "text-white" : "text-[var(--ul-primary)]"
              )}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open ? (
          <div className="fixed inset-x-0 bottom-0 top-[calc(3.5rem+var(--ul-safe-top,0px))] z-50 flex flex-col bg-[var(--ul-paper)] lg:hidden">
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
                      "border-b border-[var(--ul-hair)] py-4 text-base font-bold uppercase tracking-[0.08em] text-[var(--ul-primary)]",
                      active && "text-[var(--ul-secondary)]"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="mt-auto grid gap-3 pt-6">
                <a
                  href={`tel:${brand.phoneTel}`}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--ul-hair)] text-sm font-semibold text-[var(--ul-primary)] no-underline"
                >
                  <Phone className="h-4 w-4 text-[var(--ul-secondary)]" />
                  {brand.phoneDisplay}
                </a>
                <Link href="/sell" prefetch className="ul-btn-primary h-12 w-full">
                  List your property
                </Link>
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      {/* Non-home pages need offset under the fixed header */}
      {!onHome ? (
        <div className="h-[calc(3.5rem+var(--ul-safe-top,0px))]" aria-hidden />
      ) : null}
    </>
  );
}
