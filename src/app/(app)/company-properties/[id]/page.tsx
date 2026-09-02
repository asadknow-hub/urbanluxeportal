import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { formatPropertyLine } from "@/lib/deal-transaction";
import { formatPropertyType } from "@/lib/inventory";
import { parsePaymentSnapshot, paymentSnapshotLines } from "@/lib/payment-snapshot";
import { dealStageLabel } from "@/lib/deal-stages";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const { id } = await params;

  const { data: property, error } = await supabase
    .from("customer_properties")
    .select(
      `*,
      customer:customers(id, name, phone, email, status),
      agent:profiles!customer_properties_assigned_to_fkey(id, full_name),
      deal:deals(id, title, stage, value, finalized_at)`
    )
    .eq("id", id)
    .single();

  if (error || !property) notFound();

  const customer = Array.isArray(property.customer) ? property.customer[0] : property.customer;
  const agent = Array.isArray(property.agent) ? property.agent[0] : property.agent;
  const deal = Array.isArray(property.deal) ? property.deal[0] : property.deal;
  const paymentLines = paymentSnapshotLines(parsePaymentSnapshot(property.payment_snapshot));

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-4">
      <section className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="h-0.5 bg-primary" />
        <div className="p-6">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Property</p>
          <h1
            className="font-heading text-[1.85rem] leading-tight text-foreground"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            {formatPropertyLine(property)}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs capitalize">
              {formatPropertyType(property.property_type)}
            </span>
            <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs capitalize">
              {property.deal_type.replace(/_/g, " ")}
            </span>
            <span className="font-semibold text-foreground">{formatAED(property.value)}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="overflow-hidden rounded-[14px] border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Property details</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Title" value={property.property_title} />
            <Row label="Community" value={property.property_community} />
            <Row label="Building" value={property.property_building} />
            <Row label="Unit" value={property.property_unit} />
            <Row label="Reference" value={property.property_ref} />
            <Row label="Closed" value={formatDate(property.acquired_at, "dd MMM yyyy")} />
          </dl>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Commission</h2>
          <dl className="space-y-2 text-sm">
            <Row
              label="Agency commission"
              value={property.agency_commission_amount ? formatAED(property.agency_commission_amount) : null}
            />
            <Row
              label="Agency rate"
              value={property.agency_commission_rate != null ? `${property.agency_commission_rate}%` : null}
            />
            <Row
              label="Agent commission"
              value={property.agent_commission_amount ? formatAED(property.agent_commission_amount) : null}
            />
            <Row label="Agent" value={agent?.full_name ?? property.agent_name} />
          </dl>
        </div>
      </div>

      {paymentLines.length > 0 ? (
        <div className="overflow-hidden rounded-[14px] border border-border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold">Payment</h2>
          <p className="text-sm text-muted-foreground">{paymentLines.join(" · ")}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {customer ? (
          <Link
            href={`/customers/${customer.id}`}
            className="rounded-[10px] border border-border bg-card px-4 py-3 text-sm font-medium hover:border-primary/30"
          >
            Customer: {customer.name}
          </Link>
        ) : null}
        {deal ? (
          <Link
            href={`/pipeline/${deal.id}`}
            className="rounded-[10px] border border-border bg-card px-4 py-3 text-sm font-medium hover:border-primary/30"
          >
            Deal: {deal.title} ({dealStageLabel(deal.stage)})
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-1.5 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}
