import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SiteNav } from "@/components/web/site-nav";
import { SiteFooter } from "@/components/web/site-footer";
import { WhatsAppDock } from "@/components/web/whatsapp-dock";
import { BrandProvider } from "@/components/brand/brand-provider";
import { CurrencyProvider } from "@/components/web/currency-provider";
import { getPublicBrand } from "@/server/company-settings";
import { CURRENCY_COOKIE, isCurrencyCode } from "@/lib/web/currency";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getPublicBrand();
  return {
    title: {
      default: `${brand.name} — Private Dubai brokerage`,
      template: `%s · ${brand.name}`,
    },
    description:
      brand.tagline ||
      "A private Dubai brokerage for villas, apartments, and off-plan residences — placed with discretion.",
  };
}

export default async function WebLayout({ children }: { children: React.ReactNode }) {
  const brand = await getPublicBrand();
  const jar = await cookies();
  const cookieCurrency = jar.get(CURRENCY_COOKIE)?.value;
  const initialCurrency = isCurrencyCode(cookieCurrency) ? cookieCurrency : "AED";

  return (
    <BrandProvider brand={brand}>
      <CurrencyProvider initial={initialCurrency}>
        <div className="ul-site min-h-screen">
          <SiteNav />
          <main>{children}</main>
          <SiteFooter />
          <WhatsAppDock />
        </div>
      </CurrencyProvider>
    </BrandProvider>
  );
}
