import type { Metadata } from "next";
import { SiteNav } from "@/components/web/site-nav";
import { SiteFooter } from "@/components/web/site-footer";
import { WhatsAppDock } from "@/components/web/whatsapp-dock";
import { BrandProvider } from "@/components/brand/brand-provider";
import { getPublicBrand } from "@/server/company-settings";

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

  return (
    <BrandProvider brand={brand}>
      <div className="ul-site min-h-screen">
        <SiteNav />
        <main>{children}</main>
        <SiteFooter />
        <WhatsAppDock />
      </div>
    </BrandProvider>
  );
}
