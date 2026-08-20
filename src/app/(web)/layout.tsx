import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SiteNav } from "@/components/web/site-nav";
import { SiteFooter } from "@/components/web/site-footer";
import { WhatsAppDock } from "@/components/web/whatsapp-dock";
import { BrandProvider } from "@/components/brand/brand-provider";
import { CurrencyProvider } from "@/components/web/currency-provider";
import { PublicAgentsProvider } from "@/components/web/public-agents-provider";
import { getPublicBrand } from "@/server/company-settings";
import { getPublicAgents } from "@/server/public-agents";
import { CURRENCY_COOKIE, isCurrencyCode } from "@/lib/web/currency";

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.APP_BASE_URL?.replace(/\/$/, "") ||
    "https://urbanluxe.com"
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getPublicBrand();
  const description =
    brand.tagline ||
    "A private Dubai brokerage for villas, apartments, and off-plan residences — placed with discretion.";
  const url = siteUrl();

  return {
    metadataBase: new URL(url),
    title: {
      default: `${brand.name} — Private Dubai brokerage`,
      template: `%s · ${brand.name}`,
    },
    description,
    openGraph: {
      type: "website",
      locale: "en_AE",
      url,
      siteName: brand.name,
      title: `${brand.name} — Private Dubai brokerage`,
      description,
      ...(brand.logoUrl ? { images: [{ url: brand.logoUrl, alt: brand.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${brand.name} — Private Dubai brokerage`,
      description,
      ...(brand.logoUrl ? { images: [brand.logoUrl] } : {}),
    },
    alternates: { canonical: url },
  };
}

export default async function WebLayout({ children }: { children: React.ReactNode }) {
  const brand = await getPublicBrand();
  const agents = await getPublicAgents();
  const jar = await cookies();
  const cookieCurrency = jar.get(CURRENCY_COOKIE)?.value;
  const initialCurrency = isCurrencyCode(cookieCurrency) ? cookieCurrency : "AED";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: brand.name,
    description: brand.tagline,
    url: siteUrl(),
    telephone: brand.phoneDisplay,
    email: brand.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: brand.address,
      addressLocality: "Dubai",
      addressCountry: "AE",
    },
    ...(brand.logoUrl ? { logo: brand.logoUrl, image: brand.logoUrl } : {}),
    ...(brand.linkedinUrl || brand.instagramUrl
      ? {
          sameAs: [brand.linkedinUrl, brand.instagramUrl].filter(Boolean),
        }
      : {}),
  };

  return (
    <BrandProvider brand={brand}>
      <PublicAgentsProvider agents={agents}>
        <CurrencyProvider initial={initialCurrency}>
          <div className="ul-site min-h-screen">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#0B1D3D] focus:shadow-lg"
            >
              Skip to content
            </a>
            <SiteNav />
            <main id="main-content">{children}</main>
            <SiteFooter />
            <WhatsAppDock />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
          </div>
        </CurrencyProvider>
      </PublicAgentsProvider>
    </BrandProvider>
  );
}
