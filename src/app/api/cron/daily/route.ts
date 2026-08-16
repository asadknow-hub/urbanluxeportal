import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { notify, notifyByRole } from "@/lib/notify";
import { formatDate } from "@/lib/dates";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const tasks: Promise<unknown>[] = [];

  // Document expiry reminders (30 days)
  const { data: expiringDocs } = await supabase
    .from("documents")
    .select("id, name, expiry_date")
    .not("expiry_date", "is", null)
    .gte("expiry_date", now.toISOString().split("T")[0])
    .lte("expiry_date", in30Days.toISOString().split("T")[0])
    .is("deleted_at", null);

  if (expiringDocs && expiringDocs.length > 0) {
    tasks.push(
      notifyByRole(["admin"], {
        kind: "doc_expiring",
        title: `${expiringDocs.length} documents expiring soon`,
        body: expiringDocs.map((d) => `${d.name} expires ${formatDate(d.expiry_date)}`).join(", "),
        entityType: "document",
      })
    );
  }

  await Promise.allSettled(tasks);

  // Stage SLA: leads sitting in a stage past stale_after_days
  const { data: openLeads } = await supabase
    .from("leads")
    .select("id, name, assigned_to, stage_entered_at, stage:lead_stages(name, kind, stale_after_days)")
    .is("deleted_at", null);

  const staleLeads = (openLeads ?? []).filter((lead) => {
    const stage = Array.isArray(lead.stage) ? lead.stage[0] : lead.stage;
    if (!stage || stage.kind === "won" || stage.kind === "lost" || stage.kind === "junk") return false;
    if (!stage.stale_after_days || !lead.stage_entered_at) return false;
    const elapsedMs = now.getTime() - new Date(lead.stage_entered_at).getTime();
    return elapsedMs > stage.stale_after_days * 24 * 60 * 60 * 1000;
  });

  if (staleLeads.length > 0) {
    const byAssignee = new Map<string, typeof staleLeads>();
    for (const lead of staleLeads) {
      if (!lead.assigned_to) continue;
      const list = byAssignee.get(lead.assigned_to) ?? [];
      list.push(lead);
      byAssignee.set(lead.assigned_to, list);
    }
    await Promise.all(
      [...byAssignee.entries()].map(([userId, list]) =>
        notify({
          userIds: [userId],
          kind: "lead_stale",
          title: `${list.length} lead${list.length === 1 ? "" : "s"} past stage SLA`,
          body: list
            .slice(0, 5)
            .map((lead) => {
              const stage = Array.isArray(lead.stage) ? lead.stage[0] : lead.stage;
              return `${lead.name} in ${stage?.name ?? "stage"}`;
            })
            .join(", "),
          entityType: "lead",
          entityId: list[0]?.id,
        })
      )
    );
    await notifyByRole(["admin", "manager"], {
      kind: "lead_stale",
      title: `${staleLeads.length} leads past stage SLA`,
      body: "Leads have sat in a stage longer than the SLA. Open Leads to work them.",
      entityType: "lead",
    });
  }

  return NextResponse.json({
    ok: true,
    expiringDocs: expiringDocs?.length ?? 0,
    staleLeads: staleLeads.length,
  });
}
