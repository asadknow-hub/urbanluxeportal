"use server";

import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { applyLeadRouting } from "@/server/routing";
import { resolveDefaultLeadStageId } from "@/lib/lead-stages";
import { ensurePersonForLead } from "@/server/people";

export type PublicLeadResult = {
  ok: boolean;
  id?: string;
  error?: string;
  duplicate?: boolean;
};

const baseSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    email: z.string().trim().email("Valid email required").max(120).optional().or(z.literal("")),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    source: z.string().trim().min(1).max(80).default("website"),
    interest: z.string().trim().min(1).max(40).default("buy"),
    notes: z.string().trim().max(4000).optional().nullable(),
    preferred_areas: z.array(z.string()).optional(),
    /** Honeypot — bots fill this; humans leave empty */
    company: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.email?.trim() && !val.phone?.trim()) {
      ctx.addIssue({ code: "custom", message: "Email or phone is required", path: ["email"] });
    }
  });

function normalizeInterest(raw: string) {
  const v = raw.trim().toLowerCase();
  if (v === "offplan" || v === "off-plan" || v === "off_plan") return "off_plan";
  if (v === "let" || v === "rent") return "rent";
  if (v === "valuation" || v === "both" || v === "sell") return "sell";
  if (v === "buy") return "buy";
  if (v === "careers" || v === "newsletter" || v === "mortgage") return "buy";
  return v || "buy";
}

export async function createPublicLead(
  input: z.infer<typeof baseSchema>
): Promise<PublicLeadResult> {
  try {
    const parsed = baseSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const data = parsed.data;
    if (data.company?.trim()) {
      // Silent success for bots
      return { ok: true };
    }

    const email = data.email?.trim() || null;
    const phone = data.phone?.trim() || null;
    const source = data.source.trim();
    const interest = normalizeInterest(data.interest);
    const notes = data.notes?.trim() || null;

    const supabase = createSupabaseServiceClient();

    if (phone || email) {
      let dupQuery = supabase.from("leads").select("id, name").is("deleted_at", null).limit(1);
      if (phone) dupQuery = dupQuery.eq("phone", phone);
      else if (email) dupQuery = dupQuery.eq("email", email);

      const { data: dup } = await dupQuery.maybeSingle();
      if (dup) {
        await supabase.from("lead_activities").insert({
          lead_id: dup.id,
          type: "note",
          summary: `Repeat website enquiry (${source})${notes ? `: ${notes.slice(0, 280)}` : ""}`,
        });
        return { ok: true, id: dup.id, duplicate: true };
      }
    }

    const defaultStageId = await resolveDefaultLeadStageId(supabase);
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        name: data.name,
        phone,
        email,
        source,
        interest,
        preferred_areas: data.preferred_areas ?? [],
        notes,
        status: "new",
        stage_id: defaultStageId,
        stage_entered_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !lead) {
      console.error("[public-leads] insert:", error?.message);
      return { ok: false, error: "Could not submit right now. Please try again or call us." };
    }

    await applyLeadRouting(supabase, lead.id, null, "webhook");
    await ensurePersonForLead(lead.id, null, supabase);
    await supabase.from("lead_activities").insert({
      lead_id: lead.id,
      type: "note",
      summary: `Lead captured from ${source}`,
    });

    return { ok: true, id: lead.id };
  } catch (e) {
    console.error("[public-leads]", e);
    return { ok: false, error: "Could not submit right now. Please try again or call us." };
  }
}

export async function submitEnquiryForm(formData: FormData): Promise<PublicLeadResult> {
  const propertyTitle = String(formData.get("propertyTitle") ?? "").trim();
  const interestRaw = String(formData.get("interest") ?? "buy");
  const message = String(formData.get("message") ?? "").trim();
  const notes = [propertyTitle ? `Property: ${propertyTitle}` : null, message || null]
    .filter(Boolean)
    .join("\n");

  return createPublicLead({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    company: String(formData.get("company") ?? ""),
    source: propertyTitle ? "website-property" : "website-enquire",
    interest: interestRaw || "buy",
    notes: notes || null,
  });
}

export async function submitListPropertyForm(formData: FormData): Promise<PublicLeadResult> {
  const intent = String(formData.get("intent") ?? "sell");
  const address = String(formData.get("address") ?? "").trim();
  const propertyType = String(formData.get("propertyType") ?? "").trim();
  const beds = String(formData.get("beds") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const notes = [
    `Intent: ${intent}`,
    address ? `Address: ${address}` : null,
    propertyType ? `Type: ${propertyType}` : null,
    beds ? `Beds: ${beds}` : null,
    message || null,
  ]
    .filter(Boolean)
    .join("\n");

  return createPublicLead({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    company: String(formData.get("company") ?? ""),
    source: intent === "valuation" ? "website-valuation" : "website-sell",
    interest: intent,
    notes,
    preferred_areas: address ? [address] : [],
  });
}

export async function submitCareersForm(formData: FormData): Promise<PublicLeadResult> {
  const role = String(formData.get("role") ?? "").trim();
  const experience = String(formData.get("experience") ?? "").trim();
  const linkedin = String(formData.get("linkedin") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const cv = formData.get("cv");

  let cvUrl: string | null = null;
  if (cv instanceof File && cv.size > 0) {
    if (cv.size > 10 * 1024 * 1024) {
      return { ok: false, error: "CV must be under 10MB" };
    }
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(cv.type) && !/\.(pdf|doc|docx)$/i.test(cv.name)) {
      return { ok: false, error: "Upload a PDF or Word CV" };
    }

    const ext = cv.name.split(".").pop()?.toLowerCase() || "pdf";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const supabase = createSupabaseServiceClient();
    const buffer = Buffer.from(await cv.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("careers")
      .upload(path, buffer, { contentType: cv.type || "application/pdf", upsert: false });

    if (uploadError) {
      console.error("[careers] upload:", uploadError.message);
      return { ok: false, error: "Could not upload CV. Try again or email us." };
    }

    // Private bucket — store path for staff; signed URL can be generated in portal later
    cvUrl = `careers/${path}`;
  }

  const notes = [
    `Career application — role: ${role || "unspecified"}`,
    experience ? `Experience: ${experience}` : null,
    linkedin ? `LinkedIn/portfolio: ${linkedin}` : null,
    cvUrl ? `CV storage path: ${cvUrl}` : null,
    message || null,
  ]
    .filter(Boolean)
    .join("\n");

  return createPublicLead({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    company: String(formData.get("company") ?? ""),
    source: "website-careers",
    interest: "buy",
    notes,
  });
}

export async function submitNewsletterForm(formData: FormData): Promise<PublicLeadResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { ok: false, error: "Email is required" };

  return createPublicLead({
    name: email.split("@")[0] || "Newsletter",
    email,
    phone: "",
    company: String(formData.get("company") ?? ""),
    source: "website-newsletter",
    interest: "buy",
    notes: "Newsletter subscription from public footer",
  });
}
