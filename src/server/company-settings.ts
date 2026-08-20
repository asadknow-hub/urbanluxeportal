"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  brandFromSettings,
  type CompanyBrand,
  type CompanySettingsRow,
} from "@/lib/company-brand";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const updateSchema = z.object({
  company_name: z.string().trim().min(1, "Company name required").max(120),
  trn: z.string().trim().max(64).optional().nullable(),
  rera_orn: z.string().trim().max(64).optional().nullable(),
  address: z.string().trim().min(1, "Address required").max(500),
  phone: z.string().trim().min(1, "Phone required").max(40),
  email: z.string().trim().email("Valid email required").max(120),
  whatsapp: z.string().trim().max(40).optional().nullable(),
  tagline: z.string().trim().max(200).optional().nullable(),
  vat_rate: z.coerce.number().min(0).max(100),
  quotation_prefix: z.string().trim().min(1).max(20),
  invoice_prefix: z.string().trim().min(1).max(20),
  logo_url: z.string().max(2000).optional().nullable(),
  logo_dark_url: z.string().max(2000).optional().nullable(),
});

function revalidateBrandSurfaces() {
  revalidatePath("/", "layout");
  revalidatePath("/settings");
  revalidatePath("/contact");
  revalidatePath("/sell");
  revalidatePath("/careers");
  revalidatePath("/buy");
  revalidatePath("/rent");
  revalidatePath("/property-management");
  revalidatePath("/valuations");
  revalidatePath("/mortgages");
  revalidatePath("/insights");
  revalidatePath("/about");
  revalidatePath("/dashboard");
}

export async function getCompanySettingsRow(): Promise<CompanySettingsRow | null> {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase.from("company_settings").select("*").eq("id", 1).maybeSingle();
  return (data as CompanySettingsRow | null) ?? null;
}

export async function getPublicBrand(): Promise<CompanyBrand> {
  try {
    const row = await getCompanySettingsRow();
    return brandFromSettings(row);
  } catch {
    return brandFromSettings(null);
  }
}

export async function updateCompanySettings(
  input: z.infer<typeof updateSchema>
): Promise<ActionResult<CompanyBrand>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!can(user.role, "settings")) return { ok: false, error: "Admin only" };

    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const data = parsed.data;
    const supabase = createSupabaseServiceClient();
    const payload = {
      company_name: data.company_name,
      trn: data.trn || null,
      rera_orn: data.rera_orn || null,
      address: data.address,
      phone: data.phone,
      email: data.email,
      whatsapp: data.whatsapp || null,
      tagline: data.tagline || null,
      vat_rate: data.vat_rate,
      quotation_prefix: data.quotation_prefix,
      invoice_prefix: data.invoice_prefix,
      logo_url: data.logo_url?.trim() || null,
      logo_dark_url: data.logo_dark_url?.trim() || null,
    };

    const { data: updated, error } = await supabase
      .from("company_settings")
      .update(payload)
      .eq("id", 1)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidateBrandSurfaces();
    return { ok: true, data: brandFromSettings(updated as CompanySettingsRow) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save" };
  }
}

export async function uploadCompanyLogo(
  formData: FormData
): Promise<ActionResult<{ url: string; variant: "primary" | "dark" }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!can(user.role, "settings")) return { ok: false, error: "Admin only" };

    const file = formData.get("file");
    const variantRaw = String(formData.get("variant") ?? "primary");
    const variant = variantRaw === "dark" ? "dark" : "primary";

    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Choose an image file" };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { ok: false, error: "Logo must be under 5MB" };
    }
    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "File must be an image" };
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${variant}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const supabase = createSupabaseServiceClient();

    const { error: uploadError } = await supabase.storage
      .from("branding")
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) return { ok: false, error: uploadError.message };

    const { data: pub } = supabase.storage.from("branding").getPublicUrl(path);
    const url = pub.publicUrl;

    const column = variant === "dark" ? "logo_dark_url" : "logo_url";
    const { error: updateError } = await supabase
      .from("company_settings")
      .update({ [column]: url })
      .eq("id", 1);

    if (updateError) return { ok: false, error: updateError.message };

    revalidateBrandSurfaces();
    return { ok: true, data: { url, variant } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed" };
  }
}

export async function clearCompanyLogo(
  variant: "primary" | "dark"
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!can(user.role, "settings")) return { ok: false, error: "Admin only" };

    const supabase = createSupabaseServiceClient();
    const column = variant === "dark" ? "logo_dark_url" : "logo_url";
    const { error } = await supabase
      .from("company_settings")
      .update({ [column]: null })
      .eq("id", 1);

    if (error) return { ok: false, error: error.message };
    revalidateBrandSurfaces();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to clear logo" };
  }
}
