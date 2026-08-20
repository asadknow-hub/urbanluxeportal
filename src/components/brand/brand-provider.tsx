"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_BRAND, type CompanyBrand, waLinkFor } from "@/lib/company-brand";

const BrandContext = createContext<CompanyBrand>(DEFAULT_BRAND);

export function BrandProvider({
  brand,
  children,
}: {
  brand: CompanyBrand;
  children: ReactNode;
}) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  return useContext(BrandContext);
}

export function useWaLink(text?: string) {
  const brand = useBrand();
  return waLinkFor(brand.whatsapp, text);
}
