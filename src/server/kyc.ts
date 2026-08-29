"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/server/leads";

const personKycSchema = z.object({
  nationality: z.string().optional().nullable(),
  emirates_id: z.string().optional().nullable(),
  passport_no: z.string().optional().nullable(),
  trn: z.string().optional().nullable(),
});

export async function updatePersonKyc(
  customerId: string,
  input: z.infer<typeof personKycSchema>,
  leadId?: string | null
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();
    const { data: person } = await supabase
      .from("customers")
      .select("id, assigned_to")
      .eq("id", customerId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!person) return { ok: false, error: "Person not found" };
    if (user.role === "agent" && person.assigned_to !== user.id) {
      return { ok: false, error: "Not authorized" };
    }

    const parsed = personKycSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.data.nationality !== undefined) patch.nationality = parsed.data.nationality || null;
    if (parsed.data.emirates_id !== undefined) patch.emirates_id = parsed.data.emirates_id || null;
    if (parsed.data.passport_no !== undefined) patch.passport_no = parsed.data.passport_no || null;
    if (parsed.data.trn !== undefined) patch.trn = parsed.data.trn || null;

    const { error } = await supabase.from("customers").update(patch).eq("id", customerId);
    if (error) return { ok: false, error: error.message };

    if (leadId && parsed.data.nationality !== undefined) {
      await supabase
        .from("leads")
        .update({ nationality: parsed.data.nationality || null, updated_at: new Date().toISOString() })
        .eq("id", leadId);
    }

    const dealKyc: Record<string, unknown> = {};
    if (parsed.data.nationality !== undefined) dealKyc.kyc_nationality = parsed.data.nationality;
    if (parsed.data.emirates_id !== undefined) dealKyc.kyc_emirates_id = parsed.data.emirates_id;
    if (parsed.data.passport_no !== undefined) dealKyc.kyc_passport_no = parsed.data.passport_no;
    if (parsed.data.trn !== undefined) dealKyc.kyc_trn = parsed.data.trn;
    if (Object.keys(dealKyc).length > 0) {
      dealKyc.updated_at = new Date().toISOString();
      await supabase
        .from("deals")
        .update(dealKyc)
        .eq("customer_id", customerId)
        .is("finalized_at", null)
        .is("deleted_at", null);
    }

    await logActivity({
      actorId: user.id,
      entityType: "customer",
      entityId: customerId,
      action: "kyc_updated",
      diff: parsed.data as Record<string, unknown>,
    });

    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);
    revalidatePath("/leads");
    if (leadId) revalidatePath(`/leads/${leadId}`);
    revalidatePath("/pipeline");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/** Copy person KYC documents onto a deal (e.g. at convert). Skips duplicates by storage_path. */
export async function copyCustomerKycDocumentsToDeal(
  customerId: string,
  dealId: string,
  uploadedBy: string,
  client?: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<void> {
  const supabase = client ?? (await createSupabaseServerClient());

  const [{ data: personDocs }, { data: existing }] = await Promise.all([
    supabase
      .from("documents")
      .select("name, storage_path, mime_type, size_bytes, category, expiry_date, notes")
      .eq("entity_type", "customer")
      .eq("entity_id", customerId)
      .is("deleted_at", null),
    supabase
      .from("documents")
      .select("storage_path")
      .eq("entity_type", "deal")
      .eq("entity_id", dealId)
      .is("deleted_at", null),
  ]);

  const have = new Set((existing ?? []).map((row) => row.storage_path));
  const toCopy = (personDocs ?? []).filter((doc) => !have.has(doc.storage_path));
  if (toCopy.length === 0) return;

  await supabase.from("documents").insert(
    toCopy.map((doc) => ({
      ...doc,
      entity_type: "deal",
      entity_id: dealId,
      uploaded_by: uploadedBy,
    }))
  );
}
