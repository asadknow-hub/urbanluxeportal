/**
 * UrbanLuxe public brand — cream paper + deep navy only.
 * Headlines use condensed Oswald.
 */
export const BRAND = {
  /** Deep navy ink / dark bands / primary CTAs */
  primary: "#0A1630",
  /** Cream — accents on dark bands */
  secondary: "#F6F3EE",
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
