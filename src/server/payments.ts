"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const chequeSchema = z.object({
  direction: z.enum(["incoming", "outgoing"]),
  customer_id: z.string().uuid().optional().nullable(),
  payee: z.string().optional().nullable(),
  bank_name: z.string().min(1, "Bank name required"),
  cheque_no: z.string().min(1, "Cheque number required"),
  amount: z.number().positive(),
  due_date: z.string(),
  invoice_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  property_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function createCheque(
  input: z.infer<typeof chequeSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const parsed = chequeSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("cheques")
      .insert({
        direction: parsed.data.direction,
        customer_id: parsed.data.customer_id || null,
        payee: parsed.data.payee || null,
        bank_name: parsed.data.bank_name,
        cheque_no: parsed.data.cheque_no,
        amount: Math.round(parsed.data.amount * 100),
        due_date: parsed.data.due_date,
        status: "pending",
        invoice_id: parsed.data.invoice_id || null,
        deal_id: parsed.data.deal_id || null,
        property_id: parsed.data.property_id || null,
        notes: parsed.data.notes || null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "cheque",
      entityId: data.id,
      action: "created",
    });

    revalidatePath("/payments");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateChequeStatus(
  id: string,
  status: string,
  bounceReason?: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "bounced" && bounceReason) {
      updateData.bounce_reason = bounceReason;
    }

    const { error } = await supabase
      .from("cheques")
      .update(updateData)
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "cheque",
      entityId: id,
      action: `status_changed:${status}`,
    });

    revalidatePath("/payments");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
