/**
 * UrbanLuxe public brand palette — single source of truth.
 * Use these values (or CSS vars --ul-*) everywhere on the public site.
 */
export const BRAND = {
  primary: "#0B1D3D",
  secondary: "#1E7A4A",
  tertiary: "#F2F2F2",
  quaternary: "#222222",
} as const;

export type BrandColor = (typeof BRAND)[keyof typeof BRAND];
