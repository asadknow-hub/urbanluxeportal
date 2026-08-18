import Link from "next/link";
import { NAV, SITE } from "@/lib/web/site";
import { SiteLogo } from "@/components/web/site-logo";

export function SiteFooter() {
  return (
    <footer className="bg-[#14110e] text-[#f6f3ee]">
      <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SiteLogo inverted />
            <p className="mt-8 max-w-sm text-base font-light leading-relaxed text-[#f6f3ee]/70">
              {SITE.tagline} Residences of consequence, placed with the care of a private office.
            </p>
            <p className="mt-6 text-[0.7rem] tracking-[0.2em] uppercase text-[#2dd4bf]">{SITE.rera} · Dubai</p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
            <div>
              <p className="ul-kicker">Explore</p>
              <ul className="mt-5 space-y-3 text-sm font-light">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-[#f6f3ee]/75 transition-colors hover:text-[#2dd4bf]">
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/sell" className="text-[#f6f3ee]/75 transition-colors hover:text-[#2dd4bf]">
                    Sell
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="ul-kicker">Visit</p>
              <p className="mt-5 text-sm font-light leading-relaxed text-[#f6f3ee]/75">{SITE.address}</p>
            </div>
            <div>
              <p className="ul-kicker">Speak</p>
              <ul className="mt-5 space-y-3 text-sm font-light">
                <li>
                  <a href={`tel:${SITE.phoneTel}`} className="text-[#f6f3ee]/75 hover:text-[#2dd4bf]">
                    {SITE.phoneDisplay}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${SITE.email}`} className="text-[#f6f3ee]/75 hover:text-[#2dd4bf]">
                    {SITE.email}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-3 border-t border-[#f6f3ee]/10 pt-8 text-[0.7rem] tracking-[0.14em] uppercase text-[#f6f3ee]/40 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} UrbanLuxe Real Estate</p>
          <p>Brochure site · inventory to follow</p>
        </div>
      </div>
    </footer>
  );
}
