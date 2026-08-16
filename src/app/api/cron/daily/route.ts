import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { notify, notifyByRole } from "@/lib/notify";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const tasks: Promise<unknown>[] = [];

  // 1. Flag overdue invoices
  const { data: overdueInvoices } = await supabase
    .from("invoices")
    .select("id, invoice_no, total, due_date, customer_id")
    .eq("status", "sent")
    .lt("due_date", now.toISOString().split("T")[0])
    .is("deleted_at", null);

  if (overdueInvoices && overdueInvoices.length > 0) {
    const ids = overdueInvoices.map((i) => i.id);
    tasks.push(
      Promise.resolve(supabase.from("invoices").update({ status: "overdue" }).in("id", ids))
    );

    tasks.push(
      notifyByRole(["accountant", "admin"], {
        kind: "invoice_overdue",
        title: `${overdueInvoices.length} overdue invoices`,
        body: `${overdueInvoices.length} invoices are now overdue.`,
        entityType: "invoice",
      })
    );
  }

  // 2. Cheques due in 7 days
  const { data: dueCheques } = await supabase
    .from("cheques")
    .select("id, cheque_no, amount, due_date")
    .eq("status", "pending")
    .gte("due_date", now.toISOString().split("T")[0])
    .lte("due_date", in7Days.toISOString().split("T")[0])
    .is("deleted_at", null);

  if (dueCheques && dueCheques.length > 0) {
    tasks.push(
      notifyByRole(["accountant", "admin"], {
        kind: "cheque_due",
        title: `${dueCheques.length} cheques due in 7 days`,
        body: dueCheques
          .map((c) => `Cheque ${c.cheque_no}: ${formatAED(c.amount)} due ${formatDate(c.due_date)}`)
          .join(", "),
        entityType: "cheque",
      })
    );
  }

  // 3. Document expiry reminders (30 days)
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

  // 4. Auto-expire quotations past valid_until
  tasks.push(
    Promise.resolve(
      supabase
        .from("quotations")
        .update({ status: "expired" })
        .in("status", ["draft", "sent", "approved"])
        .lt("valid_until", now.toISOString().split("T")[0])
        .is("deleted_at", null)
    )
  );

  await Promise.allSettled(tasks);

  // 5. Stage SLA: leads sitting in a stage past stale_after_days
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
    overdueInvoices: overdueInvoices?.length ?? 0,
    dueCheques: dueCheques?.length ?? 0,
    expiringDocs: expiringDocs?.length ?? 0,
    staleLeads: staleLeads.length,
  });
}
