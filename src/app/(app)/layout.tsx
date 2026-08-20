import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SessionHeartbeat } from "@/components/shared/session-heartbeat";
import { BrandProvider } from "@/components/brand/brand-provider";
import { getPublicBrand } from "@/server/company-settings";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getPublicBrand();
  return {
    title: {
      default: `${brand.name} Portal`,
      template: `%s · ${brand.name} Portal`,
    },
    description: `CRM & ERP for ${brand.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const brand = await getPublicBrand();

  return (
    <BrandProvider brand={brand}>
      <div className="flex min-h-screen bg-background">
        <SessionHeartbeat />
        <Sidebar user={user} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={user} />
          <main className="flex-1 p-3 lg:p-4">{children}</main>
        </div>
      </div>
    </BrandProvider>
  );
}
