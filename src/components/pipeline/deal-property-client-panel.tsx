"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPropertyType, propertyLabel } from "@/lib/inventory";
import { formatAED } from "@/lib/money";
import { whatsappLink } from "@/lib/phone";
import { applyInventoryPropertyToDeal } from "@/server/inventory";
import { updateDealTransaction } from "@/server/deals";
import { ensurePropertyShareLink } from "@/server/property-share";
import { toast } from "sonner";
import {
  Building2,
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Share2,
  UserRound,
} from "lucide-react";
import type { InventoryChoice } from "@/components/crm/viewing-panel";

export type DealConfirmedProperty = {
  id: string;
  property_code: string;
  community: string | null;
  building_name: string | null;
  unit_number: string | null;
  property_type: string;
  bedrooms: number | null;
  asking_price?: number | null;
  listing_type?: string | null;
};

export type DealClientProfile = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  status: string;
  emirates_id?: string | null;
  passport_no?: string | null;
  trn?: string | null;
};

function shareMessage(input: {
  clientName: string;
  label: string;
  priceLine: string | null;
  url: string;
}) {
  const greeting = input.clientName.trim() ? `Hi ${input.clientName.trim()},` : "Hi,";
  return [
    greeting,
    "",
    "Here is the property for your deal:",
    input.label,
    input.priceLine,
    "",
    input.url,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function DealPropertyClientPanel({
  dealId,
  property,
  inventory,
  client,
  fallbackBuyer,
  ejariNo,
  canEdit,
}: {
  dealId: string;
  property: DealConfirmedProperty | null;
  inventory: InventoryChoice[];
  client: DealClientProfile | null;
  fallbackBuyer?: {
    name: string | null;
    phone: string | null;
    email: string | null;
    nationality: string | null;
    emirates_id: string | null;
    passport_no: string | null;
    trn: string | null;
  } | null;
  ejariNo?: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sharing, setSharing] = useState(false);
  const [ejari, setEjari] = useState(ejariNo ?? "");

  useEffect(() => {
    setEjari(ejariNo ?? "");
  }, [ejariNo]);

  const clientName = client?.name ?? fallbackBuyer?.name ?? "";
  const clientPhone = client?.phone ?? fallbackBuyer?.phone ?? null;
  const clientEmail = client?.email ?? fallbackBuyer?.email ?? null;
  const clientNationality = client?.nationality ?? fallbackBuyer?.nationality ?? null;
  const clientEid = client?.emirates_id ?? fallbackBuyer?.emirates_id ?? null;
  const clientPassport = client?.passport_no ?? fallbackBuyer?.passport_no ?? null;
  const clientTrn = client?.trn ?? fallbackBuyer?.trn ?? null;
  const clientWa = whatsappLink(clientPhone);

  const choices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inventory
      .filter((unit) => !property || unit.id !== property.id)
      .filter((unit) => {
        if (!q) return true;
        const hay = [unit.property_code, unit.community, unit.building_name, unit.unit_number]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 40);
  }, [inventory, property, query]);

  function selectProperty(propertyId: string) {
    startTransition(async () => {
      const result = await applyInventoryPropertyToDeal(dealId, propertyId);
      if (result.ok) {
        toast.success(property ? "Property changed" : "Property linked");
        setPickerOpen(false);
        setQuery("");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not link property");
      }
    });
  }

  async function resolveShareUrl() {
    if (!property) return null;
    const result = await ensurePropertyShareLink(property.id);
    if (!result.ok || !result.data?.path) {
      toast.error(result.error ?? "Could not create share link");
      return null;
    }
    return `${window.location.origin}${result.data.path}`;
  }

  async function copyShareLink() {
    if (!property) return;
    setSharing(true);
    try {
      const url = await resolveShareUrl();
      if (!url) return;
      await navigator.clipboard.writeText(url);
      toast.success("Public link copied");
    } finally {
      setSharing(false);
    }
  }

  async function shareOnWhatsApp() {
    if (!property) return;
    setSharing(true);
    try {
      const url = await resolveShareUrl();
      if (!url) return;
      const label = propertyLabel(property);
      const priceLine =
        property.asking_price != null && property.asking_price > 0
          ? formatAED(property.asking_price)
          : null;
      const text = shareMessage({
        clientName: clientName ?? "",
        label,
        priceLine,
        url,
      });
      const href = clientWa
        ? `${clientWa}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(href, "_blank", "noopener,noreferrer");
    } finally {
      setSharing(false);
    }
  }

  function saveEjari() {
    const next = ejari.trim() || null;
    if (next === (ejariNo ?? null)) return;
    startTransition(async () => {
      const result = await updateDealTransaction(dealId, { ejari_no: next });
      if (result.ok) {
        toast.success("Ejari saved");
        router.refresh();
      } else {
        setEjari(ejariNo ?? "");
        toast.error(result.error ?? "Could not save Ejari");
      }
    });
  }

  const detailRows = [
    { label: "Phone", value: clientPhone },
    { label: "Email", value: clientEmail },
    { label: "Nationality", value: clientNationality },
    { label: "Emirates ID", value: clientEid },
    { label: "Passport", value: clientPassport },
    { label: "TRN", value: clientTrn },
  ].filter((row) => Boolean(row.value?.trim()));

  const listingTypeLabel =
    property?.listing_type === "sale"
      ? "Sale"
      : property?.listing_type === "rent"
        ? "Rent"
        : property?.listing_type === "off_plan"
          ? "Off-plan"
          : property?.listing_type
            ? property.listing_type.replace(/_/g, " ")
            : null;

  const listingTypePillClass =
    property?.listing_type === "rent"
      ? "bg-sky-100 text-sky-900"
      : property?.listing_type === "off_plan"
        ? "bg-violet-100 text-violet-900"
        : "bg-emerald-100 text-emerald-900";

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-[14px] border border-primary/25 bg-card shadow-sm">
          <div className="flex items-center justify-between gap-2 bg-primary px-4 py-3 text-white">
            <div className="min-w-0">
              <h2
                className="flex items-center gap-2 font-heading text-[1.05rem] text-white"
                style={{ fontFamily: "var(--font-display), serif" }}
              >
                <UserRound className="h-4 w-4 text-white/90" />
                Client profile
              </h2>
              <p className="mt-0.5 text-[0.72rem] text-white/70">Linked person on this deal</p>
            </div>
            {client ? (
              <Link
                href={`/customers/${client.id}`}
                className="inline-flex h-8 items-center gap-1 rounded-md bg-white/20 px-2.5 text-xs font-medium text-white hover:bg-white/30"
              >
                Open <ExternalLink className="h-3 w-3" />
              </Link>
            ) : null}
          </div>

          <div className="bg-primary/5 px-4 py-4">
            {!client && !fallbackBuyer?.name ? (
              <p className="rounded-[12px] border border-dashed border-primary/20 bg-white/70 px-4 py-8 text-center text-sm text-muted-foreground">
                No client linked yet.
              </p>
            ) : (
              <div className="rounded-[12px] border border-primary/15 bg-white px-3 py-3 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {client?.name ?? fallbackBuyer?.name}
                    </p>
                    {client?.status ? (
                      <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[0.68rem] font-medium capitalize text-primary">
                        {client.status}
                      </span>
                    ) : (
                      <span className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-[0.68rem] font-medium text-muted-foreground">
                        Deal snapshot
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {clientPhone ? (
                      <a
                        href={`tel:${clientPhone}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        aria-label="Call client"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    ) : null}
                    {clientWa ? (
                      <a
                        href={clientWa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        aria-label="WhatsApp client"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    ) : null}
                    {clientEmail ? (
                      <a
                        href={`mailto:${clientEmail}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        aria-label="Email client"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                </div>

                {detailRows.length > 0 ? (
                  <dl className="mt-3 grid gap-2 border-t border-border/60 pt-3 sm:grid-cols-2">
                    {detailRows.map((row) => (
                      <div key={row.label} className="min-w-0">
                        <dt className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
                          {row.label}
                        </dt>
                        <dd className="truncate text-sm text-foreground">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[14px] border border-secondary/35 bg-card shadow-sm">
          <div className="flex items-center justify-between gap-2 bg-secondary px-4 py-3 text-white">
            <div className="min-w-0">
              <h2
                className="flex items-center gap-2 font-heading text-[1.05rem] text-white"
                style={{ fontFamily: "var(--font-display), serif" }}
              >
                <Building2 className="h-4 w-4 text-white/90" />
                Property details
              </h2>
              <p className="mt-0.5 text-[0.72rem] text-white/70">Confirmed inventory unit</p>
            </div>
            {property && canEdit ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 gap-1.5 border-0 bg-white/20 text-white hover:bg-white/30"
                onClick={() => setPickerOpen(true)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Change
              </Button>
            ) : null}
          </div>

          <div className="bg-secondary/8 px-4 py-4">
            {!property ? (
              <div className="rounded-[12px] border border-dashed border-secondary/30 bg-white px-4 py-8 text-center shadow-sm">
                <p className="text-sm text-muted-foreground">No inventory property linked yet.</p>
                {canEdit ? (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 gap-1.5"
                    onClick={() => setPickerOpen(true)}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    Choose from inventory
                  </Button>
                ) : null}
              </div>
            ) : (
              <article className="rounded-[14px] border border-secondary/25 bg-white p-4 shadow-[0_8px_24px_-12px_rgba(28,36,52,0.35)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2.5">
                    <Link
                      href={`/inventory/${property.id}`}
                      className="block text-[0.95rem] font-semibold leading-snug text-foreground hover:text-secondary"
                    >
                      {propertyLabel(property)}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2">
                      {listingTypeLabel ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[0.78rem] font-semibold capitalize ${listingTypePillClass}`}
                        >
                          {listingTypeLabel}
                        </span>
                      ) : null}
                      {property.asking_price != null && property.asking_price > 0 ? (
                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[0.78rem] font-semibold tabular-nums text-amber-950">
                          {formatAED(property.asking_price)}
                        </span>
                      ) : null}
                      <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-[0.78rem] font-medium capitalize text-muted-foreground">
                        {formatPropertyType(property.property_type)}
                        {property.bedrooms != null ? ` · ${property.bedrooms} bed` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 rounded-[10px] border border-border/70 bg-muted/30 p-0.5">
                    <Link
                      href={`/inventory/${property.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-white hover:text-secondary"
                      aria-label="Edit property in inventory"
                      title="Edit in inventory"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-white hover:text-secondary disabled:opacity-50"
                        disabled={sharing}
                        aria-label="Share property"
                      >
                        {sharing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Share2 className="h-4 w-4" />
                        )}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => void copyShareLink()}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy public link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void shareOnWhatsApp()}>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          WhatsApp to client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {canEdit ? (
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-white hover:text-secondary"
                        aria-label="Change property"
                        title="Change property"
                        onClick={() => setPickerOpen(true)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>

                {canEdit ? (
                  <div className="mt-4 space-y-1.5 border-t border-border/60 pt-3">
                    <Label htmlFor="deal-ejari" className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
                      Ejari no.
                    </Label>
                    <Input
                      id="deal-ejari"
                      value={ejari}
                      disabled={pending}
                      onChange={(e) => setEjari(e.target.value)}
                      onBlur={saveEjari}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder="Rental Ejari"
                      className="h-9"
                    />
                  </div>
                ) : ejariNo ? (
                  <p className="mt-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    Ejari: <span className="font-medium text-foreground">{ejariNo}</span>
                  </p>
                ) : null}
              </article>
            )}
          </div>
        </section>
      </div>

      <Dialog
        open={pickerOpen}
        onOpenChange={(open) => {
          setPickerOpen(open);
          if (!open) setQuery("");
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{property ? "Change property" : "Choose from inventory"}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code, community, building…"
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="max-h-[320px] space-y-1 overflow-y-auto">
            {choices.length === 0 ? (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                No matching units in inventory.
              </p>
            ) : (
              choices.map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  disabled={pending}
                  onClick={() => selectProperty(unit.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-transparent px-3 py-2.5 text-left hover:border-border hover:bg-muted/50"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{propertyLabel(unit)}</span>
                    <span className="block text-xs capitalize text-muted-foreground">
                      {unit.property_type.replace(/_/g, " ")}
                      {unit.bedrooms != null ? ` · ${unit.bedrooms} bed` : ""}
                    </span>
                  </span>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
