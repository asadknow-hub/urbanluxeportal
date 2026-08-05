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

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description required"),
  qty: z.number().positive(),
  unit_price: z.number(),
});

const invoiceSchema = z.object({
  customer_id: z.string().uuid(),
  deal_id: z.string().uuid().optional().nullable(),
  issue_date: z.string(),
  due_date: z.string(),
  notes: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, "At least one line item required"),
  discount: z.number().optional().default(0),
});

export async function createInvoice(
  input: z.infer<typeof invoiceSchema>
): Promise<ActionResult<{ id: string; invoice_no: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const parsed = invoiceSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = await createSupabaseServerClient();

    const { data: invoiceNo } = await supabase.rpc("next_doc_number", { p_prefix: "INV" });
    if (!invoiceNo) return { ok: false, error: "Failed to generate invoice number" };

    const subtotal = parsed.data.items.reduce(
      (sum, item) => sum + Math.round(item.qty * item.unit_price * 100),
      0
    );
    const discount = Math.round(parsed.data.discount * 100);
    const taxable = subtotal - discount;
    const vatAmount = Math.round(taxable * 0.05);
    const total = taxable + vatAmount;

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        invoice_no: invoiceNo,
        customer_id: parsed.data.customer_id,
        deal_id: parsed.data.deal_id || null,
        status: "sent",
        issue_date: parsed.data.issue_date,
        due_date: parsed.data.due_date,
        subtotal,
        discount,
        vat_amount: vatAmount,
        total,
        amount_paid: 0,
        notes: parsed.data.notes || null,
        created_by: user.id,
      })
      .select("id, invoice_no")
      .single();

    if (error) return { ok: false, error: error.message };

    const items = parsed.data.items.map((item, idx) => ({
      invoice_id: data.id,
      sort_order: idx,
      description: item.description,
      qty: item.qty,
      unit_price: Math.round(item.unit_price * 100),
      line_total: Math.round(item.qty * item.unit_price * 100),
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(items);

    if (itemsError) return { ok: false, error: itemsError.message };

    await logActivity({
      actorId: user.id,
      entityType: "invoice",
      entityId: data.id,
      action: "created",
    });

    revalidatePath("/invoices");
    return { ok: true, data: { id: data.id, invoice_no: data.invoice_no } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function recordPayment(
  invoiceId: string,
  input: {
    customer_id: string;
    amount: number;
    method: string;
    received_date: string;
    reference?: string;
    notes?: string;
  }
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();

    // Fetch invoice to check balance
    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .select("total, amount_paid, status")
      .eq("id", invoiceId)
      .eq("deleted_at", null)
      .single();

    if (invError || !invoice) return { ok: false, error: "Invoice not found" };

    const amountFils = Math.round(input.amount * 100);
    const newAmountPaid = (invoice.amount_paid ?? 0) + amountFils;

    // Insert payment
    const { error: payError } = await supabase.from("payments").insert({
      invoice_id: invoiceId,
      customer_id: input.customer_id,
      method: input.method as any,
      amount: amountFils,
      received_date: input.received_date,
      reference: input.reference || null,
      notes: input.notes || null,
      created_by: user.id,
    });

    if (payError) return { ok: false, error: payError.message };

    // Update invoice
    let newStatus = invoice.status;
    if (newAmountPaid >= invoice.total) {
      newStatus = "paid";
    } else if (newAmountPaid > 0) {
      newStatus = "partial";
    }

    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (updateError) return { ok: false, error: updateError.message };

    await logActivity({
      actorId: user.id,
      entityType: "invoice",
      entityId: invoiceId,
      action: `payment_recorded:${newStatus}`,
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function voidInvoice(invoiceId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("invoices")
      .update({ status: "void", updated_at: new Date().toISOString() })
      .eq("id", invoiceId);

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "invoice",
      entityId: invoiceId,
      action: "voided",
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
