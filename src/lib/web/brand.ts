/**
 * UrbanLuxe public brand — white surfaces + deep navy only.
 * Headlines use condensed Oswald.
 */
export const BRAND = {
  /** Deep navy ink / dark bands / primary CTAs */
  primary: "#0A1630",
  /** White — accents on dark bands */
  secondary: "#FFFFFF",
  /** Soft nested surface */
  tertiary: "#F5F5F5",
  /** Footer / deep canvas */
  quaternary: "#060D1C",
  /** Light section background */
  paper: "#FFFFFF",
  muted: "#4B5563",
  hair: "#E5E7EB",
} as const;

export type BrandColor = (typeof BRAND)[keyof typeof BRAND];
