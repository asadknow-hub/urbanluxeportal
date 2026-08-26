import { BrandProvider } from "@/components/brand/brand-provider";
import { getPublicBrand } from "@/server/company-settings";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const brand = await getPublicBrand();

  return (
    <BrandProvider brand={brand}>
      <div className="min-h-screen bg-background">{children}</div>
    </BrandProvider>
  );
}
