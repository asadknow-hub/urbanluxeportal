import type { Metadata } from "next";
import { SiteNav } from "@/components/web/site-nav";
import { SiteFooter } from "@/components/web/site-footer";
import { WhatsAppDock } from "@/components/web/whatsapp-dock";

export const metadata: Metadata = {
  title: {
    default: "UrbanLuxe — Private Dubai brokerage",
    template: "%s · UrbanLuxe",
  },
  description:
    "A private Dubai brokerage for villas, apartments, and off-plan residences — placed with discretion.",
};

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ul-site min-h-screen">
      <SiteNav />
      <main>{children}</main>
      <SiteFooter />
      <WhatsAppDock />
    </div>
  );
}
