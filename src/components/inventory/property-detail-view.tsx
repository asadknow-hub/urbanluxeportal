"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PropertyPageTabs, type PropertyPageView } from "@/components/inventory/property-page-tabs";
import { LeadDocumentsChecklist } from "@/components/leads/lead-documents-checklist";
import type { LeadDocument } from "@/components/leads/lead-documents";
import type { DocCategoryChoice } from "@/lib/lead-field-options";
import { assignPropertyOwner } from "@/server/inventory";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { formatPropertyType, LISTING_TYPES, propertyLabel } from "@/lib/inventory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { toast } from "sonner";

type Listing = {
  id: string;
  listing_type: string;
  asking_price: number;
  listing_status: string;
  trakheesi_permit_no: string | null;
  furnishing: string | null;
  available_from: string | null;
  rent_frequency: string | null;
  security_deposit: number | null;
  cheques: number | null;
  service_charge: number | null;
  payment_plan: string | null;
  handover_date: string | null;
  mortgage_available: boolean | null;
};

export function PropertyDetailView({
  property,
  listing,
  developer,
  project,
  agent,
  owner,
  owners,
  documents,
  categories,
  canEdit,
}: {
  property: {
    id: string;
    property_code: string;
    community: string | null;
    building_name: string | null;
    unit_number: string | null;
    property_type: string;
    bedrooms: number | null;
    bathrooms: number | null;
    floor: string | null;
    bua_sqft: number | null;
    status: string;
    title_deed_number: string | null;
    oqood_number: string | null;
    notes: string | null;
    owner_id: string | null;
  };
  listing: Listing | null;
  developer: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  agent: { id: string; full_name: string } | null;
  owner: { id: string; name: string; phone: string | null; email: string | null; nationality: string | null; status: string } | null;
  owners: { id: string; name: string }[];
  documents: LeadDocument[];
  categories: DocCategoryChoice[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [page, setPage] = useState<PropertyPageView>("overview");
  const [pending, startTransition] = useTransition();
  const [docs, setDocs] = useState(documents);
  const propertyCats = useMemo(
    () => categories.filter((c) => (c.scope ?? "property") === "property"),
    [categories]
  );

  const categoryLabel =
    LISTING_TYPES.find((row) => row.value === listing?.listing_type)?.label ??
    listing?.listing_type?.replace(/_/g, " ") ??
    "Property";

  function changeOwner(nextId: string | null) {
    startTransition(async () => {
      const result = await assignPropertyOwner(property.id, nextId);
      if (result.ok) {
        toast.success(nextId ? "Owner linked" : "Owner cleared");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not update owner");
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-[18px]">
      <section className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="h-0.5 bg-primary" />
        <div className="p-6">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {property.property_code} · {categoryLabel}
          </p>
          <h1
            className="font-heading text-[1.85rem] leading-tight text-foreground"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            {propertyLabel(property)}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatPropertyType(property.property_type)} · {property.status.replace(/_/g, " ")}
            {listing ? ` · ${formatAED(listing.asking_price)}` : ""}
          </p>
        </div>
      </section>

      <PropertyPageTabs value={page} onChange={setPage} />

      {page === "overview" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-[14px] border border-border bg-card p-5">
            <h2 className="mb-3 font-heading text-[1.05rem]" style={{ fontFamily: "var(--font-display), serif" }}>
              Unit
            </h2>
            <dl className="space-y-2 text-sm">
              <Row label="Community" value={property.community} />
              <Row label="Building" value={property.building_name} />
              <Row label="Unit" value={property.unit_number} />
              <Row label="Beds / baths" value={`${property.bedrooms ?? "—"} / ${property.bathrooms ?? "—"}`} />
              <Row label="Floor" value={property.floor} />
              <Row label="BUA" value={property.bua_sqft ? `${property.bua_sqft} sqft` : null} />
              <Row label="Developer" value={developer?.name} />
              <Row label="Project" value={project?.name} />
              <Row label="Agent" value={agent?.full_name} />
            </dl>
            {property.notes ? <p className="mt-4 text-sm text-muted-foreground">{property.notes}</p> : null}
          </section>
          <section className="rounded-[14px] border border-border bg-card p-5">
            <h2 className="mb-3 font-heading text-[1.05rem]" style={{ fontFamily: "var(--font-display), serif" }}>
              {categoryLabel} details
            </h2>
            {!listing ? (
              <p className="text-sm text-muted-foreground">No listing on this unit yet.</p>
            ) : listing.listing_type === "rent" ? (
              <dl className="space-y-2 text-sm">
                <Row label="Rent" value={formatAED(listing.asking_price)} />
                <Row label="Frequency" value={listing.rent_frequency} />
                <Row label="Cheques" value={listing.cheques != null ? String(listing.cheques) : null} />
                <Row label="Deposit" value={listing.security_deposit ? formatAED(listing.security_deposit) : null} />
                <Row label="Furnishing" value={listing.furnishing} />
                <Row label="Available from" value={listing.available_from ? formatDate(listing.available_from) : null} />
              </dl>
            ) : listing.listing_type === "off_plan" ? (
              <dl className="space-y-2 text-sm">
                <Row label="Price" value={formatAED(listing.asking_price)} />
                <Row label="Payment plan" value={listing.payment_plan} />
                <Row label="Handover" value={listing.handover_date ? formatDate(listing.handover_date) : null} />
                <Row label="Oqood" value={property.oqood_number} />
              </dl>
            ) : (
              <dl className="space-y-2 text-sm">
                <Row label="Asking price" value={formatAED(listing.asking_price)} />
                <Row label="Title deed" value={property.title_deed_number} />
                <Row label="Trakheesi" value={listing.trakheesi_permit_no} />
                <Row label="Service charge" value={listing.service_charge ? formatAED(listing.service_charge) : null} />
                <Row label="Mortgage" value={listing.mortgage_available ? "Available" : "—"} />
              </dl>
            )}
          </section>
        </div>
      ) : null}

      {page === "documents" ? (
        <LeadDocumentsChecklist
          uploadEntityType="property"
          uploadEntityId={property.id}
          documents={docs}
          categories={propertyCats.length ? propertyCats : categories}
          canEdit={canEdit}
          defaultPropertyId={property.id}
          onDocumentSaved={(doc) => {
            if (doc) setDocs((prev) => [{ ...doc, category: doc.category || "other" }, ...prev]);
          }}
          onDocumentDeleted={(id) => setDocs((prev) => prev.filter((d) => d.id !== id))}
          onDocumentUpdated={(doc) => setDocs((prev) => prev.map((d) => (d.id === doc.id ? doc : d)))}
          sourcesHint="Property documents from this unit and from leads marked as Property docs."
        />
      ) : null}

      {page === "owner" ? (
        <section className="rounded-[14px] border border-border bg-card p-5">
          <h2 className="mb-3 font-heading text-[1.05rem]" style={{ fontFamily: "var(--font-display), serif" }}>
            Owner
          </h2>
          {owner ? (
            <div className="space-y-2 text-sm">
              <p className="text-lg font-semibold">{owner.name}</p>
              <p className="text-muted-foreground">{owner.phone || "No phone"} · {owner.email || "No email"}</p>
              <p className="text-muted-foreground">Nationality: {owner.nationality || "—"}</p>
              <div className="pt-2">
                <Link href={`/customers/${owner.id}`} className="text-sm font-medium text-secondary hover:underline">
                  Open person profile
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No owner linked yet.</p>
          )}
          {canEdit ? (
            <div className="mt-4 max-w-sm space-y-2">
              <Select
                value={property.owner_id ?? "none"}
                onValueChange={(v) => changeOwner(v === "none" ? null : v ?? null)}
                disabled={pending}
              >
                <SelectTrigger>
                  <span>{owner?.name ?? "Link an existing customer"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {owners.map((row) => (
                    <SelectItem key={row.id} value={row.id}>{row.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-3 text-xs text-muted-foreground">
                New people are added in <Link href="/customers" className="underline hover:text-foreground">People</Link>.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-1.5 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium capitalize text-foreground">{value?.toString().trim() ? value : "—"}</dd>
    </div>
  );
}
