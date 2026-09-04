import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { applyLeadRouting } from "@/server/routing";
import { resolveDefaultLeadStageId } from "@/lib/lead-stages";
import { ensurePersonForLead } from "@/server/people";

// POST /api/leads/webhook
// Accepts lead data from external sources (website forms, portals, etc.)
// Protected by API key header: x-api-key

export async function POST(req: NextRequest) {
  try {
    const configuredKey = process.env.LEAD_API_KEY?.trim();
    if (!configuredKey) {
      console.error("[leads/webhook] LEAD_API_KEY is not configured");
      return NextResponse.json({ error: "Lead webhook is not configured" }, { status: 503 });
    }

    const apiKey = req.headers.get("x-api-key");
    if (!apiKey || apiKey !== configuredKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate required fields
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const source = typeof body.source === "string" && body.source.trim() ? body.source.trim() : "website";
    const interest = typeof body.interest === "string" && body.interest.trim() ? body.interest.trim() : "buy";
    const phone = typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null;
    const email = typeof body.email === "string" && body.email.trim() ? body.email.trim() : null;

    const supabase = createSupabaseServiceClient();

    // Duplicate guard — phone OR email (same contact = same lead)
    if (phone || email) {
      let dup: { id: string; name: string } | null = null;
      if (phone) {
        const { data } = await supabase
          .from("leads")
          .select("id, name")
          .is("deleted_at", null)
          .eq("phone", phone)
          .limit(1)
          .maybeSingle();
        dup = data;
      }
      if (!dup && email) {
        const { data } = await supabase
          .from("leads")
          .select("id, name")
          .is("deleted_at", null)
          .eq("email", email)
          .limit(1)
          .maybeSingle();
        dup = data;
      }
      if (dup) {
        return NextResponse.json(
          { ok: true, message: "Duplicate lead — already exists", id: dup.id },
          { status: 200 }
        );
      }
    }

    // Insert lead — assignee comes from routing only (ignore body.assigned_to)
    const defaultStageId = await resolveDefaultLeadStageId(supabase);
    const { data, error } = await supabase
      .from("leads")
      .insert({
        name: body.name,
        phone,
        email,
        source,
        interest,
        budget_min: body.budget_min ? Math.round(Number(body.budget_min) * 100) : null,
        budget_max: body.budget_max ? Math.round(Number(body.budget_max) * 100) : null,
        preferred_areas: body.preferred_areas || [],
        notes: body.notes || null,
        status: "new",
        stage_id: defaultStageId,
        stage_entered_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        assigned_to: null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[leads/webhook] insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const assignedTo = await applyLeadRouting(supabase, data.id, null, "webhook", null, source);
    await ensurePersonForLead(data.id, null, supabase);

    await supabase.from("lead_activities").insert({
      lead_id: data.id,
      type: "note",
      summary: `Lead captured from ${source}${assignedTo ? " and routed to an agent" : ""}`,
    });

    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
  } catch (err) {
    console.error("[leads/webhook] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// GET /api/leads/webhook — health check (does not reveal whether a key is configured)
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "/api/leads/webhook" });
}
