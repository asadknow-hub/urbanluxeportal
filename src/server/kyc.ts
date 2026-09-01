"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/server/leads";
import { individualKycFormSchema, mergeKycPerson, type KycPersonRecord } from "@/lib/kyc-form";
import { generateIndividualKycPdf, kycPdfFileName } from "@/lib/kyc-pdf";
import { canonicalDocumentPath } from "@/lib/document-storage";
import { createDocument } from "@/server/documents";

const personKycSchema = z.object({
  nationality: z.string().optional().nullable(),
  emirates_id: z.string().optional().nullable(),
  passport_no: z.string().optional().nullable(),
  trn: z.string().optional().nullable(),
});

const personKycFormUpdateSchema = personKycSchema.extend({
  kyc_form: individualKycFormSchema.optional(),
});

async function assertCanEditCustomer(customerId: string): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> }
  | { ok: false; error: string }
> {
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

  return { ok: true, supabase };
}

export async function loadKycPerson(customerId: string): Promise<ActionResult<KycPersonRecord>> {
  try {
    const gate = await assertCanEditCustomer(customerId);
    if (!gate.ok) return { ok: false, error: gate.error };

    const { data, error } = await gate.supabase
      .from("customers")
      .select("name, email, phone, nationality, emirates_id, passport_no, trn, address, kyc_form")
      .eq("id", customerId)
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? "Person not found" };
    return { ok: true, data: mergeKycPerson(data) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

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

export async function updatePersonKycForm(
  customerId: string,
  input: z.infer<typeof personKycFormUpdateSchema>,
  leadId?: string | null
): Promise<ActionResult> {
  try {
    const gate = await assertCanEditCustomer(customerId);
    if (!gate.ok) return { ok: false, error: gate.error };
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const parsed = personKycFormUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      kyc_form: parsed.data.kyc_form ?? {},
    };
    if (parsed.data.nationality !== undefined) patch.nationality = parsed.data.nationality || null;
    if (parsed.data.emirates_id !== undefined) patch.emirates_id = parsed.data.emirates_id || null;
    if (parsed.data.passport_no !== undefined) patch.passport_no = parsed.data.passport_no || null;
    if (parsed.data.trn !== undefined) patch.trn = parsed.data.trn || null;

    const { error } = await gate.supabase.from("customers").update(patch).eq("id", customerId);
    if (error) return { ok: false, error: error.message };

    if (leadId && parsed.data.nationality !== undefined) {
      await gate.supabase
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
      await gate.supabase
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
      action: "kyc_form_updated",
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

export async function saveKycFormPdf(
  customerId: string,
  leadId?: string | null
): Promise<ActionResult<{ documentId: string }>> {
  try {
    const gate = await assertCanEditCustomer(customerId);
    if (!gate.ok) return { ok: false, error: gate.error };

    const loaded = await loadKycPerson(customerId);
    if (!loaded.ok || !loaded.data) return { ok: false, error: loaded.error ?? "Person not found" };

    const pdfBytes = await generateIndividualKycPdf(loaded.data);
    const fileName = kycPdfFileName(loaded.data.name);
    const storagePath = canonicalDocumentPath({
      entityType: "customer",
      entityId: customerId,
      category: "other",
      originalName: fileName,
    });

    const { error: uploadError } = await gate.supabase.storage
      .from("documents")
      .upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) return { ok: false, error: uploadError.message };

    const doc = await createDocument({
      name: `KYC Form — ${loaded.data.name}`,
      storage_path: storagePath,
      mime_type: "application/pdf",
      size_bytes: pdfBytes.byteLength,
      category: "other",
      entity_type: "customer",
      entity_id: customerId,
      notes: "Generated from CRM KYC form",
    });

    if (!doc.ok || !doc.data) {
      await gate.supabase.storage.from("documents").remove([storagePath]);
      return { ok: false, error: doc.error ?? "Could not save document record" };
    }

    if (leadId) revalidatePath(`/leads/${leadId}`);
    return { ok: true, data: { documentId: doc.data.id } };
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
