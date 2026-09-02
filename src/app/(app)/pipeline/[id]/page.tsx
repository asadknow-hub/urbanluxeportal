import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DealDetail } from "@/components/pipeline/deal-detail";
import { leadDocChecklistCategories, type LeadFieldOption } from "@/lib/lead-field-options";
import { matchesForRequirement, INVENTORY_MATCH_SELECT } from "@/lib/match-inventory";
import { ensurePersonForLead } from "@/server/people";
import { mergeKycPerson } from "@/lib/kyc-form";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const { id } = await params;

  // Fetch deal with customer and assigned agent
  const { data: deal, error } = await supabase
    .from("deals")
    .select(
      `*,
      customer:customers(
        id, name, phone, email, nationality, status, lead_id,
        emirates_id, passport_no, trn, address, kyc_form,
        assigned_to_profile:profiles!customers_assigned_to_fkey(id, full_name)
      ),
      assigned_to_profile:profiles!deals_assigned_to_fkey(id, full_name, avatar_url, role),
      lead:leads(id, name, source, interest, score, status, phone, email)
      `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !deal) notFound();

  // Agents can only see their own deals
  if (user.role === "agent" && deal.assigned_to !== user.id) {
    return (
      <div className="p-4">
        <p className="text-sm text-slate-500">You don&apos;t have access to this deal.</p>
      </div>
    );
  }

  // Fetch deal activities (timeline)
  const { data: activities } = await supabase
    .from("deal_activities")
    .select("*, created_by_profile:profiles!deal_activities_created_by_fkey(id, full_name)")
    .eq("deal_id", id)
    .order("occurred_at", { ascending: false })
    .limit(50);

  // Fetch agents for assignment
  const { data: agents } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["admin", "manager", "reception", "agent"])
    .eq("is_active", true)
    .order("full_name");

  const personId =
    deal.customer_id ||
    (deal.lead_id ? await ensurePersonForLead(deal.lead_id, user.id, supabase) : null);

  const [{ data: documents }, { data: docCategoryRows }, { data: viewingRows }, { data: inventoryRows }, { data: shortlistRows }, { data: leadDocuments }, { data: customerDocuments }, personResult] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("entity_type", "deal")
      .eq("entity_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("lead_field_options")
      .select("id, field_key, value, label, sort, extra")
      .eq("field_key", "doc_category")
      .order("sort")
      .order("label"),
    supabase
      .from("lead_viewings")
      .select(
        `id, scheduled_at, status, outcome, note, outcome_note, agent_id, property_id,
        property:properties(id, property_code, community, building_name, unit_number, property_type, bedrooms),
        agent:profiles!lead_viewings_agent_id_fkey(id, full_name)`
      )
      .or(`deal_id.eq.${id}${deal.lead_id ? `,lead_id.eq.${deal.lead_id}` : ""}`)
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("properties")
      .select(INVENTORY_MATCH_SELECT)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("deal_properties")
      .select(
        `id, role, notes, property_id,
        property:properties(id, property_code, community, building_name, unit_number, property_type, bedrooms, status)`
      )
      .eq("deal_id", id),
    deal.lead_id
      ? supabase
          .from("documents")
          .select("*")
          .eq("entity_type", "lead")
          .eq("entity_id", deal.lead_id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    personId
      ? supabase
          .from("documents")
          .select("*")
          .eq("entity_type", "customer")
          .eq("entity_id", personId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    personId
      ? supabase
          .from("customers")
          .select("id, name, phone, email, status, nationality, emirates_id, passport_no, trn, address, kyc_form")
          .eq("id", personId)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  let leadFollowUp: {
    leadId: string;
    leadName: string;
    nextFollowUpAt: string | null;
    scheduledNotes: string | null;
  } | null = null;

  if (deal.lead_id) {
    const [{ data: leadRow }, { data: followUpRows }] = await Promise.all([
      supabase.from("leads").select("id, name, next_follow_up_at").eq("id", deal.lead_id).maybeSingle(),
      supabase
        .from("lead_follow_ups")
        .select("notes")
        .eq("lead_id", deal.lead_id)
        .eq("status", "scheduled")
        .order("scheduled_at", { ascending: false })
        .limit(1),
    ]);
    if (leadRow) {
      leadFollowUp = {
        leadId: leadRow.id,
        leadName: leadRow.name,
        nextFollowUpAt: leadRow.next_follow_up_at,
        scheduledNotes: followUpRows?.[0]?.notes ?? null,
      };
    }
  }

  const docCategories = leadDocChecklistCategories((docCategoryRows ?? []) as LeadFieldOption[]);
  const person = personResult?.data ?? deal.customer ?? null;
  const kycPerson = person ? mergeKycPerson(person) : null;

  type DocRow = NonNullable<typeof documents>[number];
  const mergedMap = new Map<string, DocRow>();
  for (const doc of [...(leadDocuments ?? []), ...(customerDocuments ?? []), ...(documents ?? [])]) {
    mergedMap.set(doc.id, doc);
  }
  const mergedDocuments = Array.from(mergedMap.values()).sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );

  return (
    <DealDetail
      deal={deal}
      activities={activities ?? []}
      agents={agents ?? []}
      documents={documents ?? []}
      mergedDocuments={mergedDocuments.map((doc) => ({
        id: doc.id,
        name: doc.name,
        storage_path: doc.storage_path,
        mime_type: doc.mime_type,
        category: doc.category,
        expiry_date: doc.expiry_date,
        notes: doc.notes,
        created_at: doc.created_at,
      }))}
      docCategories={docCategories}
      kycPerson={kycPerson}
      personCustomerId={person?.id ?? null}
      viewings={viewingRows ?? []}
      inventory={inventoryRows ?? []}
      matches={matchesForRequirement(
        {
          preferred_areas: deal.lead_context?.preferred_areas,
          bedrooms: deal.lead_context?.bedrooms,
          category: deal.lead_context?.category,
          interest: deal.lead_context?.interest,
          budget_min: deal.lead_context?.budget_min,
          budget_max: deal.lead_context?.budget_max,
        },
        inventoryRows ?? []
      )}
      shortlist={(shortlistRows ?? []).map((row) => ({
        ...row,
        property: Array.isArray(row.property) ? row.property[0] : row.property,
      }))}
      userRole={user.role}
      userId={user.id}
      leadFollowUp={leadFollowUp}
    />
  );
}
