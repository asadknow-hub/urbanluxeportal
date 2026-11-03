/**
 * UrbanLuxe public brand — warm paper light UI, deep forest green,
 * navy #0A1630 for hero / accent bands. Headlines use condensed Oswald.
 */
export const BRAND = {
  /** Deep navy ink / dark bands */
  primary: "#0A1630",
  /** Forest green — darker, cleaner on paper */
  secondary: "#008040",
  /** Soft warm surface (cards / nested) */
  tertiary: "#EFEAE3",
  /** Footer / deep canvas */
  quaternary: "#060D1C",
  /** Light section background */
  paper: "#F6F3EE",
  muted: "#4B5563",
  hair: "#E4DFD7",
} as const;

export type BrandColor = (typeof BRAND)[keyof typeof BRAND];
