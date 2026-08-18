import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SessionHeartbeat } from "@/components/shared/session-heartbeat";

export const metadata: Metadata = {
  title: {
    default: "UrbanLuxe Portal",
    template: "%s · UrbanLuxe Portal",
  },
  description: "CRM & ERP for UrbanLuxe Real Estate",
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-background">
      <SessionHeartbeat />
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-3 lg:p-4">{children}</main>
      </div>
    </div>
  );
}
