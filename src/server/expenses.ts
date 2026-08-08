"use server";

import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const expenseSchema = z.object({
  category: z.string().min(1, "Category required"),
  description: z.string().min(1, "Description required"),
  amount: z.number().positive(),
  paid_date: z.string(),
  vendor: z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  receipt_path: z.string().optional().nullable(),
});

export async function createExpense(
  input: z.infer<typeof expenseSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const parsed = expenseSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = createSupabaseServiceClient();

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        category: parsed.data.category,
        description: parsed.data.description,
        amount: Math.round(parsed.data.amount * 100),
        paid_date: parsed.data.paid_date,
        vendor: parsed.data.vendor || null,
        payment_method: parsed.data.payment_method || null,
        reference: parsed.data.reference || null,
        notes: parsed.data.notes || null,
        receipt_path: parsed.data.receipt_path || null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "expense",
      entityId: data.id,
      action: "created",
    });

    revalidatePath("/expenses");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = createSupabaseServiceClient();

    const { error } = await supabase
      .from("expenses")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "expense",
      entityId: id,
      action: "deleted",
    });

    revalidatePath("/expenses");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
