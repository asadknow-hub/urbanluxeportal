"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PropertyPageTabs, type PropertyPageView } from "@/components/inventory/property-page-tabs";
import { PropertyPhotosPanel, type PropertyPhoto } from "@/components/inventory/property-photos-panel";
import { LeadDocumentsChecklist } from "@/components/leads/lead-documents-checklist";
import { BlurSaveInput, HoverEditRow } from "@/components/leads/hover-edit-row";
import type { LeadDocument } from "@/components/leads/lead-documents";
import type { DocCategoryChoice } from "@/lib/lead-field-options";
import { assignPropertyOwner, patchPropertyDetails } from "@/server/inventory";
import { formatAED, filsToAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import {
  FURNISHING,
  LISTING_TYPES,
  PROPERTY_TYPES,
  RENT_FREQUENCIES,
  formatPropertyType,
  propertyLabel,
} from "@/lib/inventory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Image from "next/image";

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

type PropertyState = {
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

export function PropertyDetailView({
  property,
  listing: initialListing,
  developer: initialDeveloper,
  project: initialProject,
  agent: initialAgent,
  agents = [],
  owner,
  owners,
  documents,
  photos = [],
  categories,
  canEdit,
}: {
  property: PropertyState;
  listing: Listing | null;
  developer: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  agent: { id: string; full_name: string } | null;
  agents?: { id: string; full_name: string }[];
  owner: { id: string; name: string; phone: string | null; email: string | null; nationality: string | null; status: string } | null;
  owners: { id: string; name: string }[];
  documents: LeadDocument[];
  photos?: PropertyPhoto[];
  categories: DocCategoryChoice[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [page, setPage] = useState<PropertyPageView>("overview");
  const [pending, startTransition] = useTransition();
  const [docs, setDocs] = useState(documents);
  const [editing, setEditing] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState(property);
  const [listing, setListing] = useState(initialListing);
  const [developerName, setDeveloperName] = useState(initialDeveloper?.name ?? "");
  const [projectName, setProjectName] = useState(initialProject?.name ?? "");
  const [agent, setAgent] = useState(initialAgent);

  useEffect(() => {
    setOptimistic(property);
    setListing(initialListing);
    setDeveloperName(initialDeveloper?.name ?? "");
    setProjectName(initialProject?.name ?? "");
    setAgent(initialAgent);
  }, [property, initialListing, initialDeveloper, initialProject, initialAgent]);

  const propertyCats = useMemo(
    () => categories.filter((c) => (c.scope ?? "property") === "property"),
    [categories]
  );

  const categoryLabel =
    LISTING_TYPES.find((row) => row.value === listing?.listing_type)?.label ??
    listing?.listing_type?.replace(/_/g, " ") ??
    "Property";

  function savePatch(
    payload: Parameters<typeof patchPropertyDetails>[1],
    apply: () => void,
    revert: () => void
  ) {
    apply();
    setEditing(null);
    startTransition(async () => {
      const result = await patchPropertyDetails(property.id, payload);
      if (result.ok) router.refresh();
      else {
        revert();
        toast.error(result.error ?? "Could not save");
      }
    });
  }

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

  function display(value: string | number | null | undefined) {
    if (value === null || value === undefined || value === "") return "—";
    return String(value);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-[18px]">
      <section className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="h-0.5 bg-primary" />
        <div className="p-6">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {optimistic.property_code} · {categoryLabel}
          </p>
          <h1
            className="font-heading text-[1.85rem] leading-tight text-foreground"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            {propertyLabel(optimistic)}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatPropertyType(optimistic.property_type)} · {optimistic.status.replace(/_/g, " ")}
            {listing ? ` · ${formatAED(listing.asking_price)}` : ""}
          </p>
          {photos[0] ? (
            <div className="relative mt-4 h-44 overflow-hidden rounded-[12px] border border-border sm:h-56">
              <Image
                src={photos[0].url}
                alt={photos[0].caption || propertyLabel(optimistic)}
                fill
                className="object-cover"
                sizes="(max-width: 1100px) 100vw, 1100px"
                priority
              />
              {photos.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setPage("photos")}
                  className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white hover:bg-black/75"
                >
                  {photos.length} photos
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <PropertyPageTabs value={page} onChange={setPage} />

      {page === "overview" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-[14px] border border-border bg-card p-5">
            <h2 className="mb-3 font-heading text-[1.05rem]" style={{ fontFamily: "var(--font-display), serif" }}>
              Unit
            </h2>
            <div className="-mx-1 space-y-0.5 text-sm">
              <TextField
                field="community"
                label="Community"
                value={optimistic.community}
                editing={editing}
                canEdit={canEdit}
                onEdit={setEditing}
                onCancel={() => setEditing(null)}
                onSave={(next) => {
                  const prev = optimistic.community;
                  savePatch(
                    { community: next.trim() || null },
                    () => setOptimistic((s) => ({ ...s, community: next.trim() || null })),
                    () => setOptimistic((s) => ({ ...s, community: prev }))
                  );
                }}
              />
              <TextField
                field="building_name"
                label="Building"
                value={optimistic.building_name}
                editing={editing}
                canEdit={canEdit}
                onEdit={setEditing}
                onCancel={() => setEditing(null)}
                onSave={(next) => {
                  const prev = optimistic.building_name;
                  savePatch(
                    { building_name: next.trim() || null },
                    () => setOptimistic((s) => ({ ...s, building_name: next.trim() || null })),
                    () => setOptimistic((s) => ({ ...s, building_name: prev }))
                  );
                }}
              />
              <TextField
                field="unit_number"
                label="Unit"
                value={optimistic.unit_number}
                editing={editing}
                canEdit={canEdit}
                onEdit={setEditing}
                onCancel={() => setEditing(null)}
                onSave={(next) => {
                  const prev = optimistic.unit_number;
                  savePatch(
                    { unit_number: next.trim() || null },
                    () => setOptimistic((s) => ({ ...s, unit_number: next.trim() || null })),
                    () => setOptimistic((s) => ({ ...s, unit_number: prev }))
                  );
                }}
              />
              <SelectField
                field="property_type"
                label="Type"
                display={formatPropertyType(optimistic.property_type)}
                value={optimistic.property_type}
                options={PROPERTY_TYPES.map((r) => ({ value: r.value, label: r.label }))}
                editing={editing}
                canEdit={canEdit}
                onEdit={setEditing}
                onCancel={() => setEditing(null)}
                onSave={(next) => {
                  const prev = optimistic.property_type;
                  savePatch(
                    { property_type: next },
                    () => setOptimistic((s) => ({ ...s, property_type: next })),
                    () => setOptimistic((s) => ({ ...s, property_type: prev }))
                  );
                }}
              />
              <TextField
                field="bedrooms"
                label="Bedrooms"
                value={optimistic.bedrooms != null ? String(optimistic.bedrooms) : ""}
                display={display(optimistic.bedrooms)}
                type="number"
                editing={editing}
                canEdit={canEdit}
                onEdit={setEditing}
                onCancel={() => setEditing(null)}
                onSave={(next) => {
                  const prev = optimistic.bedrooms;
                  const n = next.trim() === "" ? null : Number(next);
                  if (n != null && Number.isNaN(n)) return setEditing(null);
                  savePatch(
                    { bedrooms: n },
                    () => setOptimistic((s) => ({ ...s, bedrooms: n })),
                    () => setOptimistic((s) => ({ ...s, bedrooms: prev }))
                  );
                }}
              />
              <TextField
                field="bathrooms"
                label="Bathrooms"
                value={optimistic.bathrooms != null ? String(optimistic.bathrooms) : ""}
                display={display(optimistic.bathrooms)}
                type="number"
                editing={editing}
                canEdit={canEdit}
                onEdit={setEditing}
                onCancel={() => setEditing(null)}
                onSave={(next) => {
                  const prev = optimistic.bathrooms;
                  const n = next.trim() === "" ? null : Number(next);
                  if (n != null && Number.isNaN(n)) return setEditing(null);
                  savePatch(
                    { bathrooms: n },
                    () => setOptimistic((s) => ({ ...s, bathrooms: n })),
                    () => setOptimistic((s) => ({ ...s, bathrooms: prev }))
                  );
                }}
              />
              <TextField
                field="floor"
                label="Floor"
                value={optimistic.floor}
                editing={editing}
                canEdit={canEdit}
                onEdit={setEditing}
                onCancel={() => setEditing(null)}
                onSave={(next) => {
                  const prev = optimistic.floor;
                  savePatch(
                    { floor: next.trim() || null },
                    () => setOptimistic((s) => ({ ...s, floor: next.trim() || null })),
                    () => setOptimistic((s) => ({ ...s, floor: prev }))
                  );
                }}
              />
              <TextField
                field="bua_sqft"
                label="BUA (sqft)"
                value={optimistic.bua_sqft != null ? String(optimistic.bua_sqft) : ""}
                display={optimistic.bua_sqft != null ? `${optimistic.bua_sqft} sqft` : "—"}
                type="number"
                editing={editing}
                canEdit={canEdit}
                onEdit={setEditing}
                onCancel={() => setEditing(null)}
                onSave={(next) => {
                  const prev = optimistic.bua_sqft;
                  const n = next.trim() === "" ? null : Number(next);
                  if (n != null && Number.isNaN(n)) return setEditing(null);
                  savePatch(
                    { bua_sqft: n },
                    () => setOptimistic((s) => ({ ...s, bua_sqft: n })),
                    () => setOptimistic((s) => ({ ...s, bua_sqft: prev }))
                  );
                }}
              />
              <TextField
                field="developer_name"
                label="Developer"
                value={developerName}
                editing={editing}
                canEdit={canEdit}
                onEdit={setEditing}
                onCancel={() => setEditing(null)}
                onSave={(next) => {
                  const prev = developerName;
                  savePatch(
                    { developer_name: next.trim() || null },
                    () => setDeveloperName(next.trim()),
                    () => setDeveloperName(prev)
                  );
                }}
              />
              <TextField
                field="project_name"
                label="Project"
                value={projectName}
                editing={editing}
                canEdit={canEdit}
                onEdit={setEditing}
                onCancel={() => setEditing(null)}
                onSave={(next) => {
                  const prev = projectName;
                  savePatch(
                    { project_name: next.trim() || null },
                    () => setProjectName(next.trim()),
                    () => setProjectName(prev)
                  );
                }}
              />
              <SelectField
                field="assigned_to"
                label="Agent"
                display={agent?.full_name ?? "—"}
                value={agent?.id ?? ""}
                options={agents.map((a) => ({ value: a.id, label: a.full_name }))}
                editing={editing}
                canEdit={canEdit && agents.length > 0}
                onEdit={setEditing}
                onCancel={() => setEditing(null)}
                onSave={(next) => {
                  const prev = agent;
                  const nextAgent = agents.find((a) => a.id === next) ?? null;
                  savePatch(
                    { assigned_to: next || null },
                    () => setAgent(nextAgent),
                    () => setAgent(prev)
                  );
                }}
              />
            </div>
            {canEdit || optimistic.notes ? (
              <div className="mt-3">
                {editing === "notes" ? (
                  <BlurSaveInput
                    value={optimistic.notes ?? ""}
                    onCancel={() => setEditing(null)}
                    onSave={(next) => {
                      const prev = optimistic.notes;
                      savePatch(
                        { notes: next.trim() || null },
                        () => setOptimistic((s) => ({ ...s, notes: next.trim() || null })),
                        () => setOptimistic((s) => ({ ...s, notes: prev }))
                      );
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setEditing("notes")}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/70 disabled:cursor-default"
                  >
                    {optimistic.notes?.trim() || (canEdit ? "Add notes…" : "—")}
                  </button>
                )}
              </div>
            ) : null}
          </section>

          <section className="rounded-[14px] border border-border bg-card p-5">
            <h2 className="mb-3 font-heading text-[1.05rem]" style={{ fontFamily: "var(--font-display), serif" }}>
              {categoryLabel} details
            </h2>
            {!listing ? (
              <p className="text-sm text-muted-foreground">No listing on this unit yet.</p>
            ) : (
              <div className="-mx-1 space-y-0.5 text-sm">
                <MoneyField
                  field="asking_price"
                  label={listing.listing_type === "rent" ? "Rent" : listing.listing_type === "off_plan" ? "Price" : "Asking price"}
                  fils={listing.asking_price}
                  editing={editing}
                  canEdit={canEdit}
                  onEdit={setEditing}
                  onCancel={() => setEditing(null)}
                  onSave={(aed) => {
                    if (aed == null) return;
                    const prev = listing;
                    savePatch(
                      { listing: { asking_price_aed: aed } },
                      () => setListing({ ...listing, asking_price: Math.round(aed * 100) }),
                      () => setListing(prev)
                    );
                  }}
                />

                {listing.listing_type === "rent" ? (
                  <>
                    <SelectField
                      field="rent_frequency"
                      label="Frequency"
                      display={
                        RENT_FREQUENCIES.find((r) => r.value === listing.rent_frequency)?.label ??
                        listing.rent_frequency ??
                        "—"
                      }
                      value={listing.rent_frequency ?? ""}
                      options={RENT_FREQUENCIES.map((r) => ({ value: r.value, label: r.label }))}
                      editing={editing}
                      canEdit={canEdit}
                      onEdit={setEditing}
                      onCancel={() => setEditing(null)}
                      onSave={(next) => {
                        const prev = listing;
                        const value = (next || null) as Listing["rent_frequency"];
                        savePatch(
                          { listing: { rent_frequency: (next as "yearly" | "monthly" | "weekly") || null } },
                          () => setListing({ ...listing, rent_frequency: value }),
                          () => setListing(prev)
                        );
                      }}
                    />
                    <TextField
                      field="cheques"
                      label="Cheques"
                      value={listing.cheques != null ? String(listing.cheques) : ""}
                      display={display(listing.cheques)}
                      type="number"
                      editing={editing}
                      canEdit={canEdit}
                      onEdit={setEditing}
                      onCancel={() => setEditing(null)}
                      onSave={(next) => {
                        const prev = listing;
                        const n = next.trim() === "" ? null : Number(next);
                        if (n != null && Number.isNaN(n)) return setEditing(null);
                        savePatch(
                          { listing: { cheques: n } },
                          () => setListing({ ...listing, cheques: n }),
                          () => setListing(prev)
                        );
                      }}
                    />
                    <MoneyField
                      field="security_deposit"
                      label="Deposit"
                      fils={listing.security_deposit}
                      allowEmpty
                      editing={editing}
                      canEdit={canEdit}
                      onEdit={setEditing}
                      onCancel={() => setEditing(null)}
                      onSave={(aed) => {
                        const prev = listing;
                        savePatch(
                          { listing: { security_deposit_aed: aed } },
                          () =>
                            setListing({
                              ...listing,
                              security_deposit: aed == null ? null : Math.round(aed * 100),
                            }),
                          () => setListing(prev)
                        );
                      }}
                    />
                    <SelectField
                      field="furnishing"
                      label="Furnishing"
                      display={
                        FURNISHING.find((r) => r.value === listing.furnishing)?.label ??
                        listing.furnishing ??
                        "—"
                      }
                      value={listing.furnishing ?? ""}
                      options={FURNISHING.map((r) => ({ value: r.value, label: r.label }))}
                      editing={editing}
                      canEdit={canEdit}
                      onEdit={setEditing}
                      onCancel={() => setEditing(null)}
                      onSave={(next) => {
                        const prev = listing;
                        const value = (next || null) as Listing["furnishing"];
                        savePatch(
                          {
                            listing: {
                              furnishing: (next as "furnished" | "semi" | "unfurnished") || null,
                            },
                          },
                          () => setListing({ ...listing, furnishing: value }),
                          () => setListing(prev)
                        );
                      }}
                    />
                    <TextField
                      field="available_from"
                      label="Available from"
                      value={listing.available_from ?? ""}
                      display={listing.available_from ? formatDate(listing.available_from) : "—"}
                      type="date"
                      editing={editing}
                      canEdit={canEdit}
                      onEdit={setEditing}
                      onCancel={() => setEditing(null)}
                      onSave={(next) => {
                        const prev = listing;
                        savePatch(
                          { listing: { available_from: next.trim() || null } },
                          () => setListing({ ...listing, available_from: next.trim() || null }),
                          () => setListing(prev)
                        );
                      }}
                    />
                  </>
                ) : null}

                {listing.listing_type === "off_plan" ? (
                  <>
                    <TextField
                      field="payment_plan"
                      label="Payment plan"
                      value={listing.payment_plan}
                      editing={editing}
                      canEdit={canEdit}
                      onEdit={setEditing}
                      onCancel={() => setEditing(null)}
                      onSave={(next) => {
                        const prev = listing;
                        savePatch(
                          { listing: { payment_plan: next.trim() || null } },
                          () => setListing({ ...listing, payment_plan: next.trim() || null }),
                          () => setListing(prev)
                        );
                      }}
                    />
                    <TextField
                      field="handover_date"
                      label="Handover"
                      value={listing.handover_date ?? ""}
                      display={listing.handover_date ? formatDate(listing.handover_date) : "—"}
                      type="date"
                      editing={editing}
                      canEdit={canEdit}
                      onEdit={setEditing}
                      onCancel={() => setEditing(null)}
                      onSave={(next) => {
                        const prev = listing;
                        savePatch(
                          { listing: { handover_date: next.trim() || null } },
                          () => setListing({ ...listing, handover_date: next.trim() || null }),
                          () => setListing(prev)
                        );
                      }}
                    />
                    <TextField
                      field="oqood_number"
                      label="Oqood"
                      value={optimistic.oqood_number}
                      editing={editing}
                      canEdit={canEdit}
                      onEdit={setEditing}
                      onCancel={() => setEditing(null)}
                      onSave={(next) => {
                        const prev = optimistic.oqood_number;
                        savePatch(
                          { oqood_number: next.trim() || null },
                          () => setOptimistic((s) => ({ ...s, oqood_number: next.trim() || null })),
                          () => setOptimistic((s) => ({ ...s, oqood_number: prev }))
                        );
                      }}
                    />
                  </>
                ) : null}

                {listing.listing_type === "sale" || listing.listing_type === "buy" ? (
                  <>
                    <TextField
                      field="title_deed_number"
                      label="Title deed"
                      value={optimistic.title_deed_number}
                      editing={editing}
                      canEdit={canEdit}
                      onEdit={setEditing}
                      onCancel={() => setEditing(null)}
                      onSave={(next) => {
                        const prev = optimistic.title_deed_number;
                        savePatch(
                          { title_deed_number: next.trim() || null },
                          () => setOptimistic((s) => ({ ...s, title_deed_number: next.trim() || null })),
                          () => setOptimistic((s) => ({ ...s, title_deed_number: prev }))
                        );
                      }}
                    />
                    <TextField
                      field="trakheesi_permit_no"
                      label="Trakheesi"
                      value={listing.trakheesi_permit_no}
                      editing={editing}
                      canEdit={canEdit}
                      onEdit={setEditing}
                      onCancel={() => setEditing(null)}
                      onSave={(next) => {
                        const prev = listing;
                        savePatch(
                          { listing: { trakheesi_permit_no: next.trim() || null } },
                          () => setListing({ ...listing, trakheesi_permit_no: next.trim() || null }),
                          () => setListing(prev)
                        );
                      }}
                    />
                    <MoneyField
                      field="service_charge"
                      label="Service charge"
                      fils={listing.service_charge}
                      allowEmpty
                      editing={editing}
                      canEdit={canEdit}
                      onEdit={setEditing}
                      onCancel={() => setEditing(null)}
                      onSave={(aed) => {
                        const prev = listing;
                        savePatch(
                          { listing: { service_charge_aed: aed } },
                          () =>
                            setListing({
                              ...listing,
                              service_charge: aed == null ? null : Math.round(aed * 100),
                            }),
                          () => setListing(prev)
                        );
                      }}
                    />
                    <SelectField
                      field="mortgage_available"
                      label="Mortgage"
                      display={listing.mortgage_available ? "Available" : "—"}
                      value={listing.mortgage_available ? "yes" : "no"}
                      options={[
                        { value: "yes", label: "Available" },
                        { value: "no", label: "Not available" },
                      ]}
                      editing={editing}
                      canEdit={canEdit}
                      onEdit={setEditing}
                      onCancel={() => setEditing(null)}
                      onSave={(next) => {
                        const prev = listing;
                        const yes = next === "yes";
                        savePatch(
                          { listing: { mortgage_available: yes } },
                          () => setListing({ ...listing, mortgage_available: yes }),
                          () => setListing(prev)
                        );
                      }}
                    />
                  </>
                ) : null}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {page === "photos" ? (
        <PropertyPhotosPanel propertyId={property.id} photos={photos} canEdit={canEdit} />
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
                  Open customer profile
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
                    <SelectItem key={row.id} value={row.id}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-3 text-xs text-muted-foreground">
                New customers are added in{" "}
                <Link href="/customers" className="underline hover:text-foreground">
                  Customers
                </Link>
                .
              </p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function TextField({
  field,
  label,
  value,
  display,
  type = "text",
  editing,
  canEdit,
  onEdit,
  onCancel,
  onSave,
}: {
  field: string;
  label: string;
  value: string | null | undefined;
  display?: string;
  type?: string;
  editing: string | null;
  canEdit: boolean;
  onEdit: (field: string) => void;
  onCancel: () => void;
  onSave: (next: string) => void;
}) {
  const shown = display ?? (value?.toString().trim() ? value : "—");
  return (
    <HoverEditRow
      label={label}
      display={<span className="font-medium">{shown}</span>}
      editing={editing === field}
      canEdit={canEdit}
      onEdit={() => onEdit(field)}
    >
      <BlurSaveInput value={value ?? ""} type={type} onCancel={onCancel} onSave={onSave} />
    </HoverEditRow>
  );
}

function MoneyField({
  field,
  label,
  fils,
  allowEmpty = false,
  editing,
  canEdit,
  onEdit,
  onCancel,
  onSave,
}: {
  field: string;
  label: string;
  fils: number | null;
  allowEmpty?: boolean;
  editing: string | null;
  canEdit: boolean;
  onEdit: (field: string) => void;
  onCancel: () => void;
  onSave: (aed: number | null) => void;
}) {
  const aed = fils != null ? String(filsToAED(fils)) : "";
  return (
    <HoverEditRow
      label={label}
      display={<span className="font-medium">{fils != null && fils > 0 ? formatAED(fils) : "—"}</span>}
      editing={editing === field}
      canEdit={canEdit}
      onEdit={() => onEdit(field)}
    >
      <BlurSaveInput
        value={aed}
        type="number"
        onCancel={onCancel}
        onSave={(next) => {
          if (next.trim() === "") {
            if (allowEmpty) onSave(null);
            else onCancel();
            return;
          }
          const n = Number(next);
          if (Number.isNaN(n)) return onCancel();
          onSave(n);
        }}
      />
    </HoverEditRow>
  );
}

function SelectField({
  field,
  label,
  display,
  value,
  options,
  editing,
  canEdit,
  onEdit,
  onCancel,
  onSave,
}: {
  field: string;
  label: string;
  display: string;
  value: string;
  options: { value: string; label: string }[];
  editing: string | null;
  canEdit: boolean;
  onEdit: (field: string) => void;
  onCancel: () => void;
  onSave: (next: string) => void;
}) {
  return (
    <HoverEditRow
      label={label}
      display={<span className="font-medium capitalize">{display}</span>}
      editing={editing === field}
      canEdit={canEdit}
      onEdit={() => onEdit(field)}
    >
      <Select
        value={value || undefined}
        onValueChange={(v) => {
          if (!v || v === value) {
            onCancel();
            return;
          }
          onSave(v);
        }}
      >
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </HoverEditRow>
  );
}
