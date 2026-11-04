import type { Metadata, Viewport } from "next";
/**
 * Font story (public vs CRM):
 * - `.ul-site` marketing uses Oswald (`--font-headline`) + Poppins (`--font-poppins`).
 * - Geist + Cinzel remain loaded for the CRM/app shell (`--font-sans`, `--font-display`).
 * Debt: ideally split loaders by `(web)` vs `(app)` layouts so marketing pages do not download CRM fonts.
 */
import { Cinzel, Geist, Geist_Mono, Oswald, Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const oswald = Oswald({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "UrbanLuxe · Private Dubai brokerage",
    template: "%s · UrbanLuxe",
  },
  description:
    "A private Dubai brokerage for villas, apartments, and off-plan residences, placed with discretion.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A1630",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${poppins.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider>
          {children}
          <Toaster position="top-right" richColors />
        </TooltipProvider>
        <Analytics />
      </body>
    </html>
  );
}
