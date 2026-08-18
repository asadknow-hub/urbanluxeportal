"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV } from "@/lib/web/site";
import { SiteLogo } from "@/components/web/site-logo";
import { cn } from "@/lib/utils";

export function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const overHero = pathname === "/" && !scrolled && !open;

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
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background,box-shadow,color] duration-300",
        overHero ? "bg-transparent text-[#f6f3ee]" : "bg-[#f6f3ee]/92 text-[#14110e] shadow-[0_1px_0_#e4d9c8] backdrop-blur-md"
      )}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-[1440px] items-center justify-between px-5 md:px-10">
        <SiteLogo inverted={overHero} />

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-[0.8rem] font-medium tracking-[0.16em] uppercase transition-colors duration-200",
                  overHero ? "hover:text-[#2dd4bf]" : "hover:text-[#2dd4bf]",
                  active ? "text-[#2dd4bf]" : overHero ? "text-[#f6f3ee]/90" : "text-[#14110e]/80"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className={cn(
              "hidden h-10 items-center px-5 text-[0.7rem] font-semibold tracking-[0.22em] uppercase transition-colors duration-200 sm:inline-flex",
              overHero
                ? "border border-[#f6f3ee]/40 text-[#f6f3ee] hover:border-[#2dd4bf] hover:text-[#2dd4bf]"
                : "bg-[#2dd4bf] text-[#14110e] hover:bg-[#14b8a6]"
            )}
          >
            Enquire
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center lg:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#e4d9c8] bg-[#f6f3ee] text-[#14110e] lg:hidden">
          <nav className="flex flex-col px-5 py-6" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-[#e4d9c8] py-4 text-sm tracking-[0.18em] uppercase"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="mt-6 inline-flex h-12 items-center justify-center bg-[#2dd4bf] text-[0.75rem] font-semibold tracking-[0.22em] uppercase text-[#14110e]"
            >
              Enquire
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
