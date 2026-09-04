import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DealDetail } from "@/components/pipeline/deal-detail";
import { leadDocChecklistCategories, type LeadFieldOption } from "@/lib/lead-field-options";
import { propertyLabel } from "@/lib/inventory";
import { matchesForRequirement, INVENTORY_MATCH_SELECT } from "@/lib/match-inventory";
import { ensurePersonForLead } from "@/server/people";
import { mergeKycPerson } from "@/lib/kyc-form";
import { mergePersonDocumentsByStoragePath } from "@/lib/person-documents";
import type { LeadDocument } from "@/components/leads/lead-documents";

export const dynamic = "force-dynamic";

function toLeadDocument(doc: {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  category: string;
  expiry_date?: string | null;
  notes?: string | null;
  created_at: string;
  property_id?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
}): LeadDocument {
  return {
    id: doc.id,
    name: doc.name,
    storage_path: doc.storage_path,
    mime_type: doc.mime_type,
    category: doc.category,
    expiry_date: doc.expiry_date ?? null,
    notes: doc.notes ?? null,
    created_at: doc.created_at,
    property_id:
      doc.property_id ??
      (doc.entity_type === "property" ? doc.entity_id : null) ??
      null,
  };
}

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

  const shortlist = (shortlistRows ?? []).map((row) => ({
    ...row,
    property: Array.isArray(row.property) ? row.property[0] ?? null : row.property,
  }));

  const confirmedPropertyId =
    deal.property_id ??
    shortlist.find((row) => row.role === "confirmed")?.property_id ??
    shortlist.find((row) => row.role === "offered")?.property_id ??
    shortlist[0]?.property_id ??
    null;

  const [{ data: confirmedPropertyRow }, { data: propertyDocuments }] = await Promise.all([
    confirmedPropertyId
      ? supabase
          .from("properties")
          .select(
            `id, property_code, community, building_name, unit_number, property_type, bedrooms,
             listings(asking_price, listing_type)`
          )
          .eq("id", confirmedPropertyId)
          .is("deleted_at", null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    confirmedPropertyId
      ? supabase
          .from("documents")
          .select(
            "id, name, storage_path, mime_type, category, expiry_date, notes, created_at, property_id, entity_type, entity_id"
          )
          .is("deleted_at", null)
          .or(
            `property_id.eq.${confirmedPropertyId},and(entity_type.eq.property,entity_id.eq.${confirmedPropertyId})`
          )
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as const }),
  ]);

  const mergedDocuments = mergePersonDocumentsByStoragePath(
    (leadDocuments ?? []).map(toLeadDocument),
    (customerDocuments ?? []).map(toLeadDocument),
    (documents ?? []).map(toLeadDocument),
    (propertyDocuments ?? []).map(toLeadDocument)
  );

  const confirmedListings = confirmedPropertyRow
    ? Array.isArray(confirmedPropertyRow.listings)
      ? confirmedPropertyRow.listings
      : []
    : [];
  const confirmedListing = confirmedListings[0] ?? null;
  const confirmedProperty = confirmedPropertyRow
    ? {
        id: confirmedPropertyRow.id,
        property_code: confirmedPropertyRow.property_code,
        community: confirmedPropertyRow.community,
        building_name: confirmedPropertyRow.building_name,
        unit_number: confirmedPropertyRow.unit_number,
        property_type: confirmedPropertyRow.property_type,
        bedrooms: confirmedPropertyRow.bedrooms,
        asking_price: confirmedListing?.asking_price ?? null,
        listing_type: confirmedListing?.listing_type ?? null,
      }
    : null;

  const customerFromJoin = deal.customer
    ? Array.isArray(deal.customer)
      ? deal.customer[0] ?? null
      : deal.customer
    : null;
  const assignedProfile = deal.assigned_to_profile
    ? Array.isArray(deal.assigned_to_profile)
      ? deal.assigned_to_profile[0] ?? null
      : deal.assigned_to_profile
    : null;
  const leadJoin = deal.lead
    ? Array.isArray(deal.lead)
      ? deal.lead[0] ?? null
      : deal.lead
    : null;

  const dealForUi = {
    ...deal,
    property_id: deal.property_id ?? confirmedPropertyId,
    assigned_to_profile: assignedProfile,
    lead: leadJoin,
    customer: person
      ? {
          id: person.id,
          name: person.name,
          phone: person.phone,
          email: person.email,
          nationality: person.nationality,
          status: person.status,
          lead_id: customerFromJoin?.lead_id ?? null,
          emirates_id: person.emirates_id ?? null,
          passport_no: person.passport_no ?? null,
          trn: person.trn ?? null,
          assigned_to_profile: customerFromJoin?.assigned_to_profile
            ? Array.isArray(customerFromJoin.assigned_to_profile)
              ? customerFromJoin.assigned_to_profile[0] ?? null
              : customerFromJoin.assigned_to_profile
            : null,
        }
      : null,
  };

  return (
    <DealDetail
      deal={dealForUi}
      activities={activities ?? []}
      agents={agents ?? []}
      documents={documents ?? []}
      mergedDocuments={mergedDocuments}
      docCategories={docCategories}
      kycPerson={kycPerson}
      personCustomerId={person?.id ?? null}
      confirmedProperty={confirmedProperty}
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
      shortlist={shortlist}
      userRole={user.role}
      userId={user.id}
      leadFollowUp={leadFollowUp}
    />
  );
}
