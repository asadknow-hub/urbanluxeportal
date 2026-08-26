"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearCompanyLogo,
  updateCompanySettings,
  uploadCompanyLogo,
} from "@/server/company-settings";
import type { CompanyBrand } from "@/lib/company-brand";

export function CompanyProfileForm({ initial }: { initial: CompanyBrand }) {
  const [brand, setBrand] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState<"primary" | "dark" | null>(null);
  const primaryRef = useRef<HTMLInputElement>(null);
  const darkRef = useRef<HTMLInputElement>(null);

  function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateCompanySettings({
        company_name: String(fd.get("company_name") ?? ""),
        trn: String(fd.get("trn") ?? "") || null,
        rera_orn: String(fd.get("rera_orn") ?? "") || null,
        address: String(fd.get("address") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        email: String(fd.get("email") ?? ""),
        whatsapp: String(fd.get("whatsapp") ?? "") || null,
        tagline: String(fd.get("tagline") ?? "") || null,
        linkedin_url: String(fd.get("linkedin_url") ?? "") || null,
        instagram_url: String(fd.get("instagram_url") ?? "") || null,
        vat_rate: Number(fd.get("vat_rate") ?? 5),
        quotation_prefix: String(fd.get("quotation_prefix") ?? "QT-"),
        invoice_prefix: String(fd.get("invoice_prefix") ?? "INV-"),
        logo_url: brand.logoUrl,
        logo_dark_url: brand.logoDarkUrl,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Save failed");
        return;
      }
      if (result.data) setBrand(result.data);
      toast.success("Company profile saved — live on public and admin sites.");
    });
  }

  async function onUpload(variant: "primary" | "dark", file: File | undefined) {
    if (!file) return;
    setUploading(variant);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("variant", variant);
    const result = await uploadCompanyLogo(fd);
    setUploading(null);
    if (!result.ok || !result.data) {
      toast.error(result.error ?? "Upload failed");
      return;
    }
    setBrand((prev) => ({
      ...prev,
      logoUrl: variant === "primary" ? result.data!.url : prev.logoUrl,
      logoDarkUrl: variant === "dark" ? result.data!.url : prev.logoDarkUrl,
    }));
    toast.success(variant === "primary" ? "Primary logo updated" : "White logo updated");
  }

  async function onClear(variant: "primary" | "dark") {
    setUploading(variant);
    const result = await clearCompanyLogo(variant);
    setUploading(null);
    if (!result.ok) {
      toast.error(result.error ?? "Could not clear logo");
      return;
    }
    setBrand((prev) => ({
      ...prev,
      logoUrl: variant === "primary" ? null : prev.logoUrl,
      logoDarkUrl: variant === "dark" ? null : prev.logoDarkUrl,
    }));
    toast.success("Logo cleared");
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LogoSlot
          title="Primary logo"
          hint="Public header and light backgrounds. PNG/SVG/WebP, max 5MB."
          url={brand.logoUrl}
          darkPreview={false}
          uploading={uploading === "primary"}
          inputRef={primaryRef}
          onPick={() => primaryRef.current?.click()}
          onFile={(f) => onUpload("primary", f)}
          onClear={() => onClear("primary")}
        />
        <LogoSlot
          title="White logo"
          hint="Admin sidebar, login panel, and footer. Falls back to primary if empty."
          url={brand.logoDarkUrl}
          darkPreview
          uploading={uploading === "dark"}
          inputRef={darkRef}
          onPick={() => darkRef.current?.click()}
          onFile={(f) => onUpload("dark", f)}
          onClear={() => onClear("dark")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Company name">
          <Input
            name="company_name"
            required
            defaultValue={brand.name}
            placeholder="UrbanLuxe Real Estate"
          />
        </Field>
        <Field label="Tagline">
          <Input
            name="tagline"
            defaultValue={brand.tagline}
            placeholder="A private house for Dubai."
          />
        </Field>
        <Field label="TRN">
          <Input name="trn" defaultValue={brand.trn ?? ""} />
        </Field>
        <Field label="RERA ORN">
          <Input name="rera_orn" defaultValue={brand.rera} />
        </Field>
        <Field label="Business phone">
          <Input
            name="phone"
            required
            defaultValue={brand.phoneDisplay}
            placeholder="+971 4 123 4567"
          />
        </Field>
        <Field label="WhatsApp (digits)">
          <Input name="whatsapp" defaultValue={brand.whatsapp} placeholder="971501234567" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required defaultValue={brand.email} />
        </Field>
        <Field label="LinkedIn URL">
          <Input
            name="linkedin_url"
            type="url"
            defaultValue={brand.linkedinUrl ?? ""}
            placeholder="https://www.linkedin.com/company/…"
          />
        </Field>
        <Field label="Instagram URL">
          <Input
            name="instagram_url"
            type="url"
            defaultValue={brand.instagramUrl ?? ""}
            placeholder="https://www.instagram.com/…"
          />
        </Field>
        <Field label="VAT rate (%)">
          <Input name="vat_rate" type="number" step="0.1" defaultValue={brand.vatRate} />
        </Field>
        <Field label="Quotation prefix">
          <Input name="quotation_prefix" defaultValue={brand.quotationPrefix} className="font-mono" />
        </Field>
        <Field label="Invoice prefix">
          <Input name="invoice_prefix" defaultValue={brand.invoicePrefix} className="font-mono" />
        </Field>
      </div>

      <Field label="Address">
        <Input
          name="address"
          required
          defaultValue={brand.address}
          placeholder="Gate Avenue, DIFC, Dubai, United Arab Emirates"
        />
      </Field>

      <div className="flex justify-end border-t border-border pt-5">
        <Button type="submit" disabled={pending || uploading !== null}>
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save profile"
          )}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function LogoSlot({
  title,
  hint,
  url,
  darkPreview,
  uploading,
  inputRef,
  onPick,
  onFile,
  onClear,
}: {
  title: string;
  hint: string;
  url: string | null;
  darkPreview: boolean;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: () => void;
  onFile: (file: File | undefined) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-4 ring-1 ring-border">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      <div
        className={`mt-4 flex h-24 items-center justify-center rounded-lg ring-1 ring-border ${
          darkPreview ? "bg-[#222222]" : "bg-background"
        }`}
      >
        {url ? (
          <Image
            src={url}
            alt={title}
            width={180}
            height={64}
            className="max-h-16 w-auto object-contain"
            unoptimized
          />
        ) : (
          <span className={`text-xs ${darkPreview ? "text-white/50" : "text-muted-foreground"}`}>
            No logo yet
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="mt-3 flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={onPick}>
          {uploading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="mr-1.5 h-3.5 w-3.5" />
          )}
          Upload
        </Button>
        {url ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading}
            onClick={onClear}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}
