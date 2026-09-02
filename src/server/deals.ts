"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CrmDb } from "@/server/routing";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";
import { dealReadyToFinalize, type DealTransactionInput } from "@/lib/deal-transaction";
import { canManageCrm } from "@/lib/permissions";
import { markPersonLost, syncPersonKycFromDeal } from "@/server/people";
import { fetchMergedDealDocuments } from "@/lib/person-documents";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

/** On deal close: attach lead + deal document references to the customer (same storage_path, new rows). */
async function copyEntityDocumentsToCustomer(
  supabase: CrmDb,
  customerId: string,
  sources: { entity_type: string; entity_id: string }[],
  uploadedBy: string
) {
  const { data: existing } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("entity_type", "customer")
    .eq("entity_id", customerId)
    .is("deleted_at", null);

  const existingPaths = new Set((existing ?? []).map((d) => d.storage_path));

  for (const source of sources) {
    const { data: docs } = await supabase
      .from("documents")
      .select("name, storage_path, mime_type, size_bytes, category, expiry_date, notes")
      .eq("entity_type", source.entity_type)
      .eq("entity_id", source.entity_id)
      .is("deleted_at", null);

    if (!docs?.length) continue;

    const toInsert = docs
      .filter((d) => !existingPaths.has(d.storage_path))
      .map((doc) => ({
        ...doc,
        entity_type: "customer",
        entity_id: customerId,
        uploaded_by: uploadedBy,
      }));

    if (toInsert.length) {
      await supabase.from("documents").insert(toInsert);
      toInsert.forEach((d) => existingPaths.add(d.storage_path));
    }
  }
}

const dealStageSchema = z.object({
  id: z.string().min(1),
  stage: z.enum([
    "new",
    "negotiations",
    "contract",
    "closed",
    "lost",
  ]),
  value: z.number().optional(),
  commission_amount: z.number().optional(),
  lost_reason: z.string().optional(),
});

export async function updateDealStage(
  input: z.infer<typeof dealStageSchema>
): Promise<ActionResult<{ customerId?: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const parsed = dealStageSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = await createSupabaseServerClient();

    const { data: deal, error: fetchError } = await supabase
      .from("deals")
      .select("id, assigned_to, stage, value, lead_id, customer_id, property_title, buyer_name, kyc_emirates_id, kyc_passport_no, finalized_at")
      .eq("id", parsed.data.id)
      .is("deleted_at", null)
      .single();

    if (fetchError || !deal) return { ok: false, error: "Deal not found" };

    if (user.role === "agent" && deal.assigned_to !== user.id) {
      return { ok: false, error: "You can only move your own deals" };
    }

    if (parsed.data.stage === "lost" && !parsed.data.lost_reason) {
      return { ok: false, error: "Lost reason is required" };
    }

    let customerId: string | undefined = deal.customer_id ?? undefined;

    if (parsed.data.stage === "closed") {
      const mergedDocuments = await fetchMergedDealDocuments(supabase, {
        id: parsed.data.id,
        lead_id: deal.lead_id,
        customer_id: deal.customer_id,
      });

      const readiness = dealReadyToFinalize(deal, mergedDocuments);
      if (!readiness.ok) {
        return {
          ok: false,
          error: `Complete before finalizing: ${readiness.missing.join(", ")}`,
        };
      }

      const preFinalize: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (parsed.data.value !== undefined) {
        preFinalize.value = Math.round(parsed.data.value * 100);
      }
      if (parsed.data.commission_amount !== undefined) {
        preFinalize.commission_amount = Math.round(parsed.data.commission_amount * 100);
      }
      if (Object.keys(preFinalize).length > 1) {
        const { error: preError } = await supabase
          .from("deals")
          .update(preFinalize)
          .eq("id", parsed.data.id);
        if (preError) return { ok: false, error: preError.message };
      }

      const { data: finalizedCustomerId, error: finalizeError } = await supabase.rpc(
        "finalize_deal_to_customer",
        { p_deal_id: parsed.data.id, p_actor_id: user.id }
      );

      if (finalizeError) return { ok: false, error: finalizeError.message };
      customerId = finalizedCustomerId ?? customerId;

      if (customerId) {
        const sources = [{ entity_type: "deal", entity_id: parsed.data.id }];
        if (deal.lead_id) sources.push({ entity_type: "lead", entity_id: deal.lead_id });
        await copyEntityDocumentsToCustomer(supabase, customerId, sources, user.id);
      }
    }

    const updateData: Record<string, unknown> = {
      stage: parsed.data.stage,
      stage_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.value !== undefined) {
      updateData.value = Math.round(parsed.data.value * 100);
    }
    if (parsed.data.commission_amount !== undefined) {
      updateData.commission_amount = Math.round(parsed.data.commission_amount * 100);
    }
    if (parsed.data.lost_reason) {
      updateData.lost_reason = parsed.data.lost_reason;
    }

    const { error } = await supabase.from("deals").update(updateData).eq("id", parsed.data.id);

    if (error) return { ok: false, error: error.message };

    if (parsed.data.stage === "closed") {
      await supabase.from("deal_activities").insert({
        deal_id: parsed.data.id,
        type: "won",
        summary: `Deal closed — person activated as client${parsed.data.value ? ` (${parsed.data.value} AED)` : ""}`,
        created_by: user.id,
      });

      revalidatePath("/customers");
      if (customerId) revalidatePath(`/customers/${customerId}`);
      revalidatePath("/leads");
    } else if (parsed.data.stage === "lost") {
      await markPersonLost(deal.customer_id, supabase);
      await supabase.from("deal_activities").insert({
        deal_id: parsed.data.id,
        type: "lost",
        summary: `Deal lost: ${parsed.data.lost_reason}`,
        created_by: user.id,
      });
      revalidatePath("/customers");
      if (deal.customer_id) revalidatePath(`/customers/${deal.customer_id}`);
    } else {
      await supabase.from("deal_activities").insert({
        deal_id: parsed.data.id,
        type: "stage_change",
        summary: `Stage changed: ${deal.stage} → ${parsed.data.stage}`,
        created_by: user.id,
      });
    }

    await logActivity({
      actorId: user.id,
      entityType: "deal",
      entityId: parsed.data.id,
      action: `stage_changed:${deal.stage}->${parsed.data.stage}`,
    });

    revalidatePath("/pipeline");
    revalidatePath(`/pipeline/${parsed.data.id}`);
    revalidatePath("/deals");
    return { ok: true, data: customerId ? { customerId } : undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function createDeal(input: {
  title: string;
  customer_id: string;
  deal_type?: string;
  value?: number;
  assigned_to?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();

    const { data: customer } = await supabase
      .from("customers")
      .select("name, phone, email, nationality, emirates_id, passport_no, trn")
      .eq("id", input.customer_id)
      .single();

    const { data, error } = await supabase
      .from("deals")
      .insert({
        title: input.title,
        customer_id: input.customer_id,
        deal_type: (input.deal_type as "sale" | "rental" | "off_plan") ?? "sale",
        stage: "new",
        value: input.value ? Math.round(input.value * 100) : 0,
        assigned_to: input.assigned_to ?? user.id,
        created_by: user.id,
        buyer_name: customer?.name,
        buyer_phone: customer?.phone,
        buyer_email: customer?.email,
        kyc_nationality: customer?.nationality,
        kyc_emirates_id: customer?.emirates_id,
        kyc_passport_no: customer?.passport_no,
        kyc_trn: customer?.trn,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "deal",
      entityId: data.id,
      action: "created",
    });

    revalidatePath("/pipeline");
    revalidatePath("/deals");
    revalidatePath("/customers");
    revalidatePath(`/customers/${input.customer_id}`);
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function addDealActivity(
  dealId: string,
  type: string,
  summary: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("deal_activities").insert({
      deal_id: dealId,
      type,
      summary,
      created_by: user.id,
    });

    if (error) return { ok: false, error: error.message };

    revalidatePath("/pipeline");
    revalidatePath(`/pipeline/${dealId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function assignDeal(
  dealId: string,
  agentId: string | null
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManageCrm(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("deals")
      .update({
        assigned_to: agentId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dealId);

    if (error) return { ok: false, error: error.message };

    await supabase.from("deal_activities").insert({
      deal_id: dealId,
      type: "assignment",
      summary: agentId ? "Deal assigned to agent" : "Deal unassigned",
      created_by: user.id,
    });

    revalidatePath("/pipeline");
    revalidatePath(`/pipeline/${dealId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateDeal(
  dealId: string,
  input: {
    title?: string;
    value?: number;
    expected_close_date?: string | null;
    commission_rate?: number | null;
    commission_amount?: number | null;
  }
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.title !== undefined) updateData.title = input.title;
    if (input.value !== undefined) updateData.value = Math.round(input.value * 100);
    if (input.expected_close_date !== undefined) updateData.expected_close_date = input.expected_close_date;
    if (input.commission_rate !== undefined) updateData.commission_rate = input.commission_rate;
    if (input.commission_amount !== undefined) {
      updateData.commission_amount = input.commission_amount != null ? Math.round(input.commission_amount * 100) : null;
    }

    const { error } = await supabase.from("deals").update(updateData).eq("id", dealId);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/pipeline");
    revalidatePath(`/pipeline/${dealId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateDealTransaction(
  dealId: string,
  input: DealTransactionInput
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = await createSupabaseServerClient();

    const { data: deal } = await supabase
      .from("deals")
      .select("assigned_to, stage, finalized_at, customer_id")
      .eq("id", dealId)
      .is("deleted_at", null)
      .single();

    if (!deal) return { ok: false, error: "Deal not found" };
    if (deal.finalized_at) return { ok: false, error: "Deal is already finalized" };

    const canEdit =
      canManageCrm(user.role) ||
      deal.assigned_to === user.id;
    if (!canEdit) return { ok: false, error: "Not authorized" };

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const fields: (keyof DealTransactionInput)[] = [
      "ejari_no",
      "property_title",
      "property_community",
      "property_building",
      "property_unit",
      "property_ref",
      "property_snapshot",
      "payment_method",
      "payment_notes",
      "kyc_nationality",
      "kyc_emirates_id",
      "kyc_passport_no",
      "kyc_trn",
      "buyer_name",
      "buyer_phone",
      "buyer_email",
    ];

    for (const key of fields) {
      if (input[key] !== undefined) updateData[key] = input[key];
    }
    if (input.payment_deposit !== undefined) {
      updateData.payment_deposit = input.payment_deposit != null ? Math.round(input.payment_deposit * 100) : null;
    }
    if (input.payment_balance !== undefined) {
      updateData.payment_balance = input.payment_balance != null ? Math.round(input.payment_balance * 100) : null;
    }
    if (input.payment_schedule !== undefined) {
      updateData.payment_schedule = input.payment_schedule;
    }

    const { error } = await supabase.from("deals").update(updateData).eq("id", dealId);
    if (error) return { ok: false, error: error.message };

    if (deal.customer_id) {
      await syncPersonKycFromDeal(deal.customer_id, input, supabase);
    }

    revalidatePath("/pipeline");
    revalidatePath(`/pipeline/${dealId}`);
    revalidatePath("/customers");
    if (deal.customer_id) revalidatePath(`/customers/${deal.customer_id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
