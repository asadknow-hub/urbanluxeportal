/**
 * UrbanLuxe public brand — light UI, deep forest green on white,
 * dark navy for hero / accent bands. Headlines use condensed Oswald.
 */
export const BRAND = {
  /** Deep navy ink / dark bands */
  primary: "#07111F",
  /** Forest green — darker, cleaner on white (reference) */
  secondary: "#008040",
  /** Soft light surface */
  tertiary: "#F4F6F8",
  /** Footer / deep canvas */
  quaternary: "#050B14",
  muted: "#4B5563",
  hair: "#E5E7EB",
} as const;

export type BrandColor = (typeof BRAND)[keyof typeof BRAND];
