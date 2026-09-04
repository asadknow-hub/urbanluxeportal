"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";
import { mirrorPersonIdentityToLeads } from "@/server/people";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const customerSchema = z.object({
  type: z.enum(["individual", "company"]),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")),
  nationality: z.string().optional().nullable(),
  emirates_id: z.string().optional().nullable(),
  passport_no: z.string().optional().nullable(),
  trn: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  call_numbers: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
  assigned_to: z.string().min(1).optional().nullable(),
});

export async function createCustomer(
  input: z.infer<typeof customerSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("customers")
      .insert({
        type: parsed.data.type,
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        nationality: parsed.data.nationality || null,
        emirates_id: parsed.data.emirates_id || null,
        passport_no: parsed.data.passport_no || null,
        trn: parsed.data.trn || null,
        address: parsed.data.address || null,
        call_numbers: (parsed.data.call_numbers ?? []).map((n) => n.trim()).filter(Boolean),
        tags: parsed.data.tags,
        notes: parsed.data.notes || null,
        assigned_to: parsed.data.assigned_to || null,
        created_by: user.id,
        status: "active",
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "customer",
      entityId: data.id,
      action: "created",
    });

    revalidatePath("/customers");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateCustomer(
  id: string,
  input: Partial<z.infer<typeof customerSchema>>
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();

    const updatePayload: Record<string, unknown> = {
      ...input,
      updated_at: new Date().toISOString(),
    };
    if (input.call_numbers !== undefined) {
      updatePayload.call_numbers = input.call_numbers.map((n) => n.trim()).filter(Boolean);
    }

    const { error } = await supabase
      .from("customers")
      .update(updatePayload)
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    const identityPatch: {
      name?: string | null;
      phone?: string | null;
      email?: string | null;
      nationality?: string | null;
    } = {};
    if (input.name !== undefined) identityPatch.name = input.name;
    if (input.phone !== undefined) identityPatch.phone = input.phone;
    if (input.email !== undefined) identityPatch.email = input.email || null;
    if (input.nationality !== undefined) identityPatch.nationality = input.nationality;
    if (Object.keys(identityPatch).length > 0) {
      await mirrorPersonIdentityToLeads(supabase, id, identityPatch);
    }

    const dealKyc: Record<string, unknown> = {};
    if (input.nationality !== undefined) dealKyc.kyc_nationality = input.nationality;
    if (input.emirates_id !== undefined) dealKyc.kyc_emirates_id = input.emirates_id;
    if (input.passport_no !== undefined) dealKyc.kyc_passport_no = input.passport_no;
    if (input.trn !== undefined) dealKyc.kyc_trn = input.trn;
    if (input.name !== undefined) dealKyc.buyer_name = input.name;
    if (input.phone !== undefined) dealKyc.buyer_phone = input.phone;
    if (input.email !== undefined) dealKyc.buyer_email = input.email || null;
    if (Object.keys(dealKyc).length > 0) {
      dealKyc.updated_at = new Date().toISOString();
      await supabase
        .from("deals")
        .update(dealKyc)
        .eq("customer_id", id)
        .is("finalized_at", null)
        .is("deleted_at", null);
    }

    await logActivity({
      actorId: user.id,
      entityType: "customer",
      entityId: id,
      action: "updated",
      diff: input as Record<string, unknown>,
    });

    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
