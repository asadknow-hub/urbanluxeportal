/**
 * UrbanLuxe public brand palette — matched to the approved dark navy + kelly green system.
 * Use these values (or CSS vars --ul-*) everywhere on the public site.
 */
export const BRAND = {
  /** Near-black navy page canvas */
  primary: "#07111F",
  /** Kelly / electric green accent */
  secondary: "#00C853",
  /** Soft surface on dark */
  tertiary: "#0E1A2E",
  /** Deep ink / footer */
  quaternary: "#050B14",
  /** Green on white callouts */
  onPaper: "#00C853",
  muted: "#8BA0B8",
  hair: "#1A2A40",
} as const;

export type BrandColor = (typeof BRAND)[keyof typeof BRAND];
