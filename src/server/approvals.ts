"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { notify } from "@/lib/notify";
import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export async function decideApproval(
  id: string,
  decision: "approved" | "rejected",
  note: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    if (!["admin", "manager"].includes(user.role)) {
      return { ok: false, error: "Not authorized to approve/reject" };
    }

    const supabase = await createSupabaseServerClient();

    const { data: approval, error: fetchError } = await supabase
      .from("approvals")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !approval) {
      return { ok: false, error: "Approval not found" };
    }

    if (approval.status !== "pending") {
      return { ok: false, error: "Already decided" };
    }

    const { error } = await supabase
      .from("approvals")
      .update({
        status: decision,
        decided_by: user.id,
        decided_at: new Date().toISOString(),
        decision_note: note || null,
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    // If approving a quotation, update its status from pending_approval to draft
    if (decision === "approved" && approval.entity_type === "quotation") {
      await supabase
        .from("quotations")
        .update({ status: "draft" })
        .eq("id", approval.entity_id);
    }

    // Notify the requester
    await notify({
      userIds: [approval.requested_by],
      kind: `approval_${decision}`,
      title: `Approval ${decision}: ${approval.kind.replace(/_/g, " ")}`,
      body: note || `Your request has been ${decision}.`,
      entityType: approval.entity_type,
      entityId: approval.entity_id,
    });

    await logActivity({
      actorId: user.id,
      entityType: "approval",
      entityId: id,
      action: `decision:${decision}`,
    });

    revalidatePath("/approvals");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
