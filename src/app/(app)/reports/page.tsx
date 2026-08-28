import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/primitives/page-header";
import { ReportsView } from "@/components/reports/reports-view";
import { fetchAgentPerformanceReport, fetchSourceFunnelReport } from "@/server/reports";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "dashboard_full")) redirect("/dashboard");

  const [sourceFunnel, agentPerformance] = await Promise.all([
    fetchSourceFunnelReport(),
    fetchAgentPerformanceReport(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Lead source funnel and agent performance across the agency."
      />
      <ReportsView sourceFunnel={sourceFunnel} agentPerformance={agentPerformance} />
    </div>
  );
}
