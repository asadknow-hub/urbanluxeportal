import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { SessionHeartbeat } from "@/components/shared/session-heartbeat";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-slate-50/30">
      <SessionHeartbeat />
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Topbar user={user} />
        <main className="flex-1 p-4 md:p-4 lg:p-5">{children}</main>
      </div>
    </div>
  );
}
