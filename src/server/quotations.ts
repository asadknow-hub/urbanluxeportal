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

const quotationItemSchema = z.object({
  description: z.string().min(1, "Description required"),
  qty: z.number().positive(),
  unit_price: z.number(),
});

const quotationSchema = z.object({
  customer_id: z.string().min(1),
  deal_id: z.string().min(1).optional().nullable(),
  issue_date: z.string(),
  valid_until: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  items: z.array(quotationItemSchema).min(1, "At least one line item required"),
  discount: z.number().optional().default(0),
});

export async function createQuotation(
  input: z.infer<typeof quotationSchema>
): Promise<ActionResult<{ id: string; quote_no: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const parsed = quotationSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = createSupabaseServiceClient();

    // Generate quote number
    const { data: quoteNo } = await supabase.rpc("next_doc_number", { p_prefix: "QT" });
    if (!quoteNo) return { ok: false, error: "Failed to generate quote number" };

    // Calculate totals (in fils)
    const subtotal = parsed.data.items.reduce(
      (sum, item) => sum + Math.round(item.qty * item.unit_price * 100),
      0
    );
    const discount = Math.round(parsed.data.discount * 100);
    const taxable = subtotal - discount;
    const vatAmount = Math.round(taxable * 0.05);
    const total = taxable + vatAmount;

    const { data, error } = await supabase
      .from("quotations")
      .insert({
        quote_no: quoteNo,
        customer_id: parsed.data.customer_id,
        deal_id: parsed.data.deal_id || null,
        status: "draft",
        issue_date: parsed.data.issue_date,
        valid_until: parsed.data.valid_until || null,
        subtotal,
        discount,
        vat_amount: vatAmount,
        total,
        notes: parsed.data.notes || null,
        terms: parsed.data.terms || null,
        created_by: user.id,
      })
      .select("id, quote_no")
      .single();

    if (error) return { ok: false, error: error.message };

    // Insert line items
    const items = parsed.data.items.map((item, idx) => ({
      quotation_id: data.id,
      sort_order: idx,
      description: item.description,
      qty: item.qty,
      unit_price: Math.round(item.unit_price * 100),
      line_total: Math.round(item.qty * item.unit_price * 100),
    }));

    const { error: itemsError } = await supabase
      .from("quotation_items")
      .insert(items);

    if (itemsError) return { ok: false, error: itemsError.message };

    await logActivity({
      actorId: user.id,
      entityType: "quotation",
      entityId: data.id,
      action: "created",
    });

    revalidatePath("/quotations");
    return { ok: true, data: { id: data.id, quote_no: data.quote_no } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateQuotationStatus(
  id: string,
  status: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = createSupabaseServiceClient();

    const { error } = await supabase
      .from("quotations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "quotation",
      entityId: id,
      action: `status_changed:${status}`,
    });

    revalidatePath("/quotations");
    revalidatePath(`/quotations/${id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function convertQuotationToInvoice(
  quotationId: string
): Promise<ActionResult<{ invoice_id: string; invoice_no: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = createSupabaseServiceClient();

    // Fetch quotation with items
    const { data: quote, error: quoteError } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", quotationId)
      .is("deleted_at", null)
      .single();

    if (quoteError || !quote) return { ok: false, error: "Quotation not found" };

    const { data: items } = await supabase
      .from("quotation_items")
      .select("*")
      .eq("quotation_id", quotationId)
      .order("sort_order", { ascending: true });

    // Generate invoice number
    const { data: invoiceNo } = await supabase.rpc("next_doc_number", { p_prefix: "INV" });
    if (!invoiceNo) return { ok: false, error: "Failed to generate invoice number" };

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_no: invoiceNo,
        customer_id: quote.customer_id,
        deal_id: quote.deal_id,
        quotation_id: quotationId,
        status: "sent",
        issue_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        subtotal: quote.subtotal,
        discount: quote.discount,
        vat_amount: quote.vat_amount,
        total: quote.total,
        amount_paid: 0,
        created_by: user.id,
      })
      .select("id, invoice_no")
      .single();

    if (invoiceError) return { ok: false, error: invoiceError.message };

    // Copy line items
    if (items && items.length > 0) {
      const invoiceItems = items.map((item) => ({
        invoice_id: invoice.id,
        sort_order: item.sort_order,
        description: item.description,
        qty: item.qty,
        unit_price: item.unit_price,
        line_total: item.line_total,
      }));

      await supabase.from("invoice_items").insert(invoiceItems);
    }

    // Update quotation status
    await supabase
      .from("quotations")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", quotationId);

    await logActivity({
      actorId: user.id,
      entityType: "quotation",
      entityId: quotationId,
      action: "converted_to_invoice",
    });

    revalidatePath("/quotations");
    revalidatePath("/invoices");
    return { ok: true, data: { invoice_id: invoice.id, invoice_no: invoice.invoice_no } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
