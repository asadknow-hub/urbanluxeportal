import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notify, notifyByRole } from "@/lib/notify";
import type { CrmDb } from "@/server/routing";

type SweepRow = {
  lead_id: string;
  lead_name: string;
  user_id: string | null;
  action: string;
};

export async function sweepFirstResponseSla(client?: CrmDb) {
  const supabase = client ?? (await createSupabaseServerClient());
  const { data, error } = await supabase.rpc("crm_sweep_first_response");
  if (error) {
    console.error("[first-response] sweep:", error.message);
    return { reclaimed: 0, breached: 0 };
  }

  const rows = (data ?? []) as SweepRow[];
  const reclaimed = rows.filter((row) => row.action === "reclaim");
  const breached = rows.filter((row) => row.action === "breach");

  await Promise.allSettled([
    ...breached.map((row) =>
      row.user_id
        ? notify({
            userIds: [row.user_id],
            kind: "first_response_due",
            title: "First-response SLA missed",
            body: `${row.lead_name} still has no contact. Reply now or it returns to the pool.`,
            entityType: "lead",
            entityId: row.lead_id,
          })
        : Promise.resolve()
    ),
    breached.length
      ? notifyByRole(["admin", "manager"], {
          kind: "first_response_due",
          title: `${breached.length} lead${breached.length === 1 ? "" : "s"} missed first response`,
          body: "Assigned agents have not contacted these leads within the SLA.",
          entityType: "lead",
          entityId: breached[0]?.lead_id,
        })
      : Promise.resolve(),
    ...reclaimed.map((row) =>
      row.user_id
        ? notify({
            userIds: [row.user_id],
            kind: "first_response_reclaim",
            title: "Lead returned to the pool",
            body: `${row.lead_name} was unassigned after twice the first-response SLA.`,
            entityType: "lead",
            entityId: row.lead_id,
          })
        : Promise.resolve()
    ),
    reclaimed.length
      ? notifyByRole(["admin", "manager"], {
          kind: "first_response_reclaim",
          title: `${reclaimed.length} lead${reclaimed.length === 1 ? "" : "s"} reclaimed`,
          body: "Uncontacted leads were returned to the unassigned pool.",
          entityType: "lead",
        })
      : Promise.resolve(),
  ]);

  return { reclaimed: reclaimed.length, breached: breached.length };
}
