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
    toast.success(variant === "primary" ? "Primary logo updated" : "Dark logo updated");
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

  const fieldClass =
    "h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20";

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LogoSlot
          title="Primary logo"
          hint="Public header + admin sidebar. PNG/SVG/WebP, max 5MB."
          url={brand.logoUrl}
          darkPreview={false}
          uploading={uploading === "primary"}
          inputRef={primaryRef}
          onPick={() => primaryRef.current?.click()}
          onFile={(f) => onUpload("primary", f)}
          onClear={() => onClear("primary")}
        />
        <LogoSlot
          title="Dark logo"
          hint="Footer and dark backgrounds. Falls back to primary if empty."
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
        <div className="space-y-2.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Company Name
          </Label>
          <Input
            name="company_name"
            required
            defaultValue={brand.name}
            placeholder="UrbanLuxe Real Estate"
            className={fieldClass}
          />
        </div>
        <div className="space-y-2.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Tagline
          </Label>
          <Input
            name="tagline"
            defaultValue={brand.tagline}
            placeholder="A private house for Dubai."
            className={fieldClass}
          />
        </div>
        <div className="space-y-2.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            TRN
          </Label>
          <Input name="trn" defaultValue={brand.trn ?? ""} className={fieldClass} />
        </div>
        <div className="space-y-2.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            RERA ORN
          </Label>
          <Input name="rera_orn" defaultValue={brand.rera} className={fieldClass} />
        </div>
        <div className="space-y-2.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Business phone
          </Label>
          <Input
            name="phone"
            required
            defaultValue={brand.phoneDisplay}
            placeholder="+971 4 123 4567"
            className={fieldClass}
          />
        </div>
        <div className="space-y-2.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            WhatsApp (digits)
          </Label>
          <Input
            name="whatsapp"
            defaultValue={brand.whatsapp}
            placeholder="971501234567"
            className={fieldClass}
          />
        </div>
        <div className="space-y-2.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Email
          </Label>
          <Input
            name="email"
            type="email"
            required
            defaultValue={brand.email}
            className={fieldClass}
          />
        </div>
        <div className="space-y-2.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            LinkedIn URL
          </Label>
          <Input
            name="linkedin_url"
            type="url"
            defaultValue={brand.linkedinUrl ?? ""}
            placeholder="https://www.linkedin.com/company/…"
            className={fieldClass}
          />
        </div>
        <div className="space-y-2.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Instagram URL
          </Label>
          <Input
            name="instagram_url"
            type="url"
            defaultValue={brand.instagramUrl ?? ""}
            placeholder="https://www.instagram.com/…"
            className={fieldClass}
          />
        </div>
        <div className="space-y-2.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            VAT Rate (%)
          </Label>
          <Input
            name="vat_rate"
            type="number"
            step="0.1"
            defaultValue={brand.vatRate}
            className={fieldClass}
          />
        </div>
        <div className="space-y-2.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Quotation Prefix
          </Label>
          <Input
            name="quotation_prefix"
            defaultValue={brand.quotationPrefix}
            className={`${fieldClass} font-mono text-emerald-700`}
          />
        </div>
        <div className="space-y-2.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Invoice Prefix
          </Label>
          <Input
            name="invoice_prefix"
            defaultValue={brand.invoicePrefix}
            className={`${fieldClass} font-mono text-emerald-700`}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Address
        </Label>
        <Input
          name="address"
          required
          defaultValue={brand.address}
          placeholder="Gate Avenue, DIFC, Dubai, United Arab Emirates"
          className={fieldClass}
        />
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-6">
        <Button
          type="submit"
          size="lg"
          disabled={pending || uploading !== null}
          className="rounded-full bg-emerald-500 px-5 font-bold shadow-sm hover:bg-emerald-600"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save Profile Changes"
          )}
        </Button>
      </div>
    </form>
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
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="text-sm font-bold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
      <div
        className={`mt-4 flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 ${
          darkPreview ? "bg-[#222222]" : "bg-white"
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
          <span className={`text-xs ${darkPreview ? "text-white/50" : "text-slate-400"}`}>
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={onPick}
          className="rounded-full"
        >
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
            className="rounded-full text-red-600 hover:text-red-700"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}
