import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { groupLeadFieldOptions, type LeadFieldOption } from "@/lib/lead-field-options";
import {
  DealsCompletedView,
  type CompletedDealRow,
  type CompletedLeadRow,
} from "@/components/pipeline/deals-completed-view";

export const dynamic = "force-dynamic";

export default async function DealsCompletedPage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();

  let dealsQuery = supabase
    .from("deals")
    .select(
      `id, title, stage, value, property_title, buyer_name, stage_changed_at, updated_at, lead_id,
       customer:customers(id, name),
       assigned_to_profile:profiles!deals_assigned_to_fkey(id, full_name)`
    )
    .is("deleted_at", null)
    .in("stage", ["closed", "won"])
    .order("stage_changed_at", { ascending: false });

  let leadsQuery = supabase
    .from("leads")
    .select(
      `id, name, phone, interest, source, status, updated_at, converted_deal_id,
       assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name),
       stage:lead_stages!leads_stage_id_fkey(id, name, kind)`
    )
    .is("deleted_at", null)
    .eq("status", "converted")
    .order("updated_at", { ascending: false });

  if (user.role === "agent") {
    dealsQuery = dealsQuery.eq("assigned_to", user.id);
    leadsQuery = leadsQuery.eq("assigned_to", user.id);
  }

  const [dealsResult, leadsResult, optionsResult] = await Promise.all([
    dealsQuery,
    leadsQuery,
    supabase
      .from("lead_field_options")
      .select("id, field_key, value, label, sort, extra")
      .order("sort")
      .order("label"),
  ]);

  if (dealsResult.error) console.error("[deals-completed] deals:", dealsResult.error.message);
  if (leadsResult.error) console.error("[deals-completed] leads:", leadsResult.error.message);

  const fieldOptions = groupLeadFieldOptions((optionsResult.data ?? []) as LeadFieldOption[]);

  return (
    <DealsCompletedView
      deals={(dealsResult.data ?? []) as unknown as CompletedDealRow[]}
      leads={(leadsResult.data ?? []) as unknown as CompletedLeadRow[]}
      fieldOptions={fieldOptions}
    />
  );
}
