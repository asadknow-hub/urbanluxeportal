import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { getStatusColor } from "@/lib/status-colors";
import { FollowUpPanel } from "@/components/crm/follow-up-panel";
import { customerStatusLabel } from "@/lib/customer-status";
import { parsePaymentSnapshot, paymentSnapshotLines } from "@/lib/payment-snapshot";
import { LeadContextPanel } from "@/components/crm/lead-context-panel";
import type { LeadContext } from "@/lib/lead-flow";
import { formatPropertyLine } from "@/lib/deal-transaction";
import { dealStageLabel, normalizeDealStage } from "@/lib/deal-stages";
import { CustomerNewDealDialog } from "@/components/customers/customer-new-deal-dialog";
import { CustomerConvertBanner } from "@/components/customers/customer-convert-banner";
import { CustomerContactCard } from "@/components/customers/customer-contact-card";
import { PersonDocumentsKycSection } from "@/components/crm/person-documents-kyc-section";
import { mergeKycPerson } from "@/lib/kyc-form";
import { fetchMergedCustomerDocuments } from "@/lib/person-documents";
import { leadDocChecklistCategories, type LeadFieldOption } from "@/lib/lead-field-options";
import { canManageCrm } from "@/lib/permissions";
import Link from "next/link";
import { Building2, ExternalLink } from "lucide-react";
import { formatPropertyType } from "@/lib/inventory";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const { id } = await params;

  const { data: customer, error } = await supabase
    .from("customers")
    .select(
      `*,
      assigned_to_profile:profiles!customers_assigned_to_fkey(id, full_name, avatar_url)
      `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !customer) notFound();

  const [{ data: deals }, { data: properties }, { data: activities }, { data: agents }, { data: docCategoryRows }] =
    await Promise.all([
    supabase
      .from("deals")
      .select("*, lead:leads(id, name, source, interest, score)")
      .eq("customer_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_properties")
      .select(
        `*,
      agent:profiles!customer_properties_assigned_to_fkey(id, full_name)
      `
      )
      .eq("customer_id", id)
      .order("acquired_at", { ascending: false }),
    supabase
      .from("activity_log")
      .select("*, actor:profiles!activity_log_actor_id_fkey(full_name)")
      .eq("entity_type", "customer")
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["admin", "manager", "reception", "agent"])
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("lead_field_options")
      .select("id, field_key, value, label, sort, extra")
      .eq("field_key", "doc_category")
      .order("sort")
      .order("label"),
  ]);

  const canEdit = canManageCrm(user.role) || customer.assigned_to === user.id;
  const docCategories = leadDocChecklistCategories((docCategoryRows ?? []) as LeadFieldOption[]);

  let originatingLead = null;
  let leadFollowUp: {
    leadId: string;
    leadName: string;
    nextFollowUpAt: string | null;
    scheduledNotes: string | null;
  } | null = null;

  if (customer.lead_id) {
    const [{ data: ld }, { data: followUpRows }] = await Promise.all([
      supabase
        .from("leads")
        .select(
          "id, name, phone, email, nationality, interest, budget_min, budget_max, preferred_areas, bedrooms, category, financing, source, score, status, converted_deal_id, next_follow_up_at"
        )
        .eq("id", customer.lead_id)
        .single(),
      supabase
        .from("lead_follow_ups")
        .select("notes")
        .eq("lead_id", customer.lead_id)
        .eq("status", "scheduled")
        .order("scheduled_at", { ascending: false })
        .limit(1),
    ]);
    originatingLead = ld;
    if (ld) {
      leadFollowUp = {
        leadId: ld.id,
        leadName: ld.name,
        nextFollowUpAt: ld.next_follow_up_at,
        scheduledNotes: followUpRows?.[0]?.notes ?? null,
      };
    }
  }

  const dealIds = (deals ?? []).map((deal) => deal.id);
  const [{ data: nationalityRows }, mergedDocuments] = await Promise.all([
    supabase.from("lead_nationalities").select("name").order("name"),
    fetchMergedCustomerDocuments(supabase, {
      customerId: id,
      leadId: customer.lead_id,
      dealIds,
    }),
  ]);
  const kycPerson = mergeKycPerson(customer);

  const leadContext = customer.lead_context as LeadContext | null;
  const statusColors = getStatusColor(customer.status);
  const customerTags = (customer.tags ?? []).filter(Boolean);
  const hasOpenDeal = (deals ?? []).some((deal) => deal.stage !== "closed" && deal.stage !== "lost");
  const showConvertBanner =
    !!originatingLead &&
    originatingLead.status !== "converted" &&
    !originatingLead.converted_deal_id &&
    !hasOpenDeal;

  return (
    <div className="mx-auto flex w-full max-w-[1460px] flex-col gap-[18px]">
      {showConvertBanner && originatingLead ? (
        <CustomerConvertBanner
          canEdit={canEdit}
          lead={{
            id: originatingLead.id,
            name: originatingLead.name,
            phone: originatingLead.phone,
            email: originatingLead.email,
            nationality: customer.nationality ?? originatingLead.nationality,
            interest: originatingLead.interest,
            budget_min: originatingLead.budget_min,
            budget_max: originatingLead.budget_max,
            preferred_areas: originatingLead.preferred_areas,
            bedrooms: originatingLead.bedrooms,
            category: originatingLead.category,
            financing: originatingLead.financing,
            emirates_id: customer.emirates_id,
            passport_no: customer.passport_no,
            trn: customer.trn,
          }}
        />
      ) : null}

      <section className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="h-0.5 bg-primary" />
        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-start md:gap-6">
          <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-[10px] border border-border bg-[#EDEBF4] text-lg font-semibold text-[#4C4470]">
            {customer.type === "company" ? <Building2 className="h-7 w-7" /> : initials(customer.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Customer</p>
            <h1
              className="font-heading text-[1.85rem] leading-tight text-foreground"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              {customer.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
                {customer.type}
              </span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                title={customerStatusLabel(customer.status)}
              >
                {customerStatusLabel(customer.status)}
              </span>
              {customer.client_since ? (
                <span className="text-xs text-muted-foreground">
                  Client since {formatDate(customer.client_since, "MMM yyyy")}
                </span>
              ) : null}
            </div>
            {customerTags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {customerTags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium capitalize text-foreground"
                  >
                    {tag.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <PersonDocumentsKycSection
        uploadEntityType="customer"
        uploadEntityId={customer.id}
        customerId={customer.id}
        leadId={customer.lead_id}
        customerHref={`/customers/${customer.id}`}
        person={kycPerson}
        documents={mergedDocuments.map((doc) => ({
          id: doc.id,
          name: doc.name,
          storage_path: doc.storage_path,
          mime_type: doc.mime_type,
          category: doc.category,
          expiry_date: doc.expiry_date,
          notes: doc.notes,
          created_at: doc.created_at,
        }))}
        categories={docCategories}
        canEdit={canEdit}
        sourcesHint="Includes files from the originating lead, linked deals, and this customer profile. New uploads here attach to the customer."
        overview={
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {(properties ?? []).length > 0 && (
            <div className="overflow-hidden rounded-[14px] border border-border bg-card">
              <div className="h-0.5 bg-primary" />
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Transactions
                  <span className="ml-2 text-muted-foreground">({properties?.length ?? 0})</span>
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Closed deals linked to this client</p>
              </div>
              <div className="divide-y divide-border">
                {(properties ?? []).map((prop) => {
                  const agentLabel = prop.agent?.full_name ?? prop.agent_name;
                  const paymentLines = paymentSnapshotLines(parsePaymentSnapshot(prop.payment_snapshot));
                  const dealType = prop.deal_type.replace(/_/g, " ");
                  return (
                    <div key={prop.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {formatPropertyLine(prop)}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            <span>{formatDate(prop.acquired_at, "dd MMM yyyy")}</span>
                            <span aria-hidden>·</span>
                            <span className="capitalize">{dealType}</span>
                            {prop.property_type ? (
                              <>
                                <span aria-hidden>·</span>
                                <span>{formatPropertyType(prop.property_type)}</span>
                              </>
                            ) : null}
                            {prop.payment_method ? (
                              <>
                                <span aria-hidden>·</span>
                                <span className="capitalize">{prop.payment_method.replace(/_/g, " ")}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                        <p className="shrink-0 text-base font-semibold tabular-nums text-foreground">
                          {formatAED(prop.value)}
                        </p>
                      </div>

                      <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Agent
                          </dt>
                          <dd className="mt-0.5 text-foreground">{agentLabel ?? "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Agent commission
                          </dt>
                          <dd className="mt-0.5 tabular-nums text-foreground">
                            {prop.agent_commission_amount != null
                              ? formatAED(prop.agent_commission_amount)
                              : "—"}
                            {prop.agent_commission_rate != null ? (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({prop.agent_commission_rate}%)
                              </span>
                            ) : null}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Agency commission
                          </dt>
                          <dd className="mt-0.5 tabular-nums text-foreground">
                            {prop.agency_commission_amount != null
                              ? formatAED(prop.agency_commission_amount)
                              : "—"}
                            {prop.agency_commission_rate != null ? (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({prop.agency_commission_rate}%)
                              </span>
                            ) : null}
                          </dd>
                        </div>
                      </dl>

                      {paymentLines.length > 0 ? (
                        <p className="mt-2 text-xs text-muted-foreground">{paymentLines.join(" · ")}</p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-4">
                        <Link
                          href={`/company-properties/${prop.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Property record
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        {prop.deal_id ? (
                          <Link
                            href={`/pipeline/${prop.deal_id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            Deal
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : null}
                        {prop.property_id ? (
                          <Link
                            href={`/inventory/${prop.property_id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            Inventory
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-[14px] border border-border bg-card p-5">
            <div className="-mx-5 -mt-5 mb-4 h-0.5 bg-primary" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Deals ({deals?.length ?? 0})</h2>
              <CustomerNewDealDialog customerId={customer.id} customerName={customer.name} />
            </div>
            <div className="space-y-2">
              {(deals ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No deals yet.</p>
              ) : (
                (deals ?? []).map((deal) => {
                  const colors = getStatusColor(normalizeDealStage(deal.stage));
                  return (
                    <Link
                      key={deal.id}
                      href={`/pipeline/${deal.id}`}
                      className="flex items-center justify-between rounded-[10px] border border-border px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-muted/30"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{deal.title}</p>
                        <p className="text-xs capitalize text-muted-foreground">{deal.deal_type.replace(/_/g, " ")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-foreground">{formatAED(deal.value)}</span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colors.bg} ${colors.text}`}>
                          {dealStageLabel(deal.stage)}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[14px] border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Recent activity</h2>
            <div className="space-y-3">
              {(activities ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                (activities ?? []).map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-foreground">
                        <span className="font-medium">{act.actor?.full_name ?? "System"}</span> {act.action}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(act.created_at, "dd MMM yyyy, HH:mm")}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <CustomerContactCard
            customer={{
              id: customer.id,
              type: customer.type as "individual" | "company",
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
              nationality: customer.nationality,
              emirates_id: customer.emirates_id,
              passport_no: customer.passport_no,
              trn: customer.trn,
              address: customer.address,
              notes: customer.notes,
              call_numbers: customer.call_numbers ?? [],
              assigned_to: customer.assigned_to,
              assigned_to_profile: customer.assigned_to_profile,
            }}
            agents={agents ?? []}
            canEdit={canEdit}
            nationalities={(nationalityRows ?? []).map((row) => row.name)}
          />

          <LeadContextPanel
            context={leadContext}
            leadHref={customer.lead_id ? `/leads/${customer.lead_id}` : undefined}
            variant="compact"
          />

          {leadFollowUp && originatingLead?.status !== "converted" ? (
            <FollowUpPanel
              leadId={leadFollowUp.leadId}
              leadName={leadFollowUp.leadName}
              nextFollowUpAt={leadFollowUp.nextFollowUpAt}
              scheduledNotes={leadFollowUp.scheduledNotes}
              canEdit={canEdit}
            />
          ) : null}

          {originatingLead && (
            <div className="overflow-hidden rounded-[14px] border border-border bg-[#1B2430] p-4 text-[#E8E4DC]">
              <h2 className="mb-3 text-sm font-semibold">Originating lead</h2>
              <Link href={`/leads/${originatingLead.id}`} className="block hover:underline">
                <p className="font-medium">{originatingLead.name}</p>
                <p className="mt-1 text-xs capitalize opacity-80">
                  {originatingLead.source.replace(/_/g, " ")} · {originatingLead.interest.replace(/_/g, " ")}
                </p>
              </Link>
            </div>
          )}
        </div>
      </div>
        }
      />
    </div>
  );
}
