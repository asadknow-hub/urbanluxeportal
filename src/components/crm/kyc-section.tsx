"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { LeadDocumentsList, type LeadDocument } from "@/components/leads/lead-documents";
import { updatePersonKyc } from "@/server/kyc";
import {
  kycStatusLabel,
  kycStatusTone,
  personKycReadiness,
  type PersonKycFields,
} from "@/lib/kyc";
import type { KycPersonRecord } from "@/lib/kyc-form";
import { KycFormDialog } from "@/components/crm/kyc-form-dialog";
import type { DocCategoryChoice } from "@/lib/lead-field-options";
import { toast } from "sonner";
import { ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const TONE_CLASS = {
  muted: "bg-muted text-muted-foreground",
  amber: "bg-amber-100 text-amber-900",
  success: "bg-emerald-100 text-emerald-800",
} as const;

export function KycSection({
  customerId,
  leadId,
  personHref,
  fields,
  person,
  documents,
  docCategories,
  canEdit,
  variant = "card",
}: {
  customerId: string;
  leadId?: string | null;
  personHref?: string;
  fields: PersonKycFields;
  person: KycPersonRecord;
  documents: LeadDocument[];
  docCategories: DocCategoryChoice[];
  canEdit: boolean;
  variant?: "card" | "sidebar";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(() => personKycReadiness(fields, documents).status !== "not_started");
  const [form, setForm] = useState({
    nationality: fields.nationality ?? "",
    emirates_id: fields.emirates_id ?? "",
    passport_no: fields.passport_no ?? "",
    trn: fields.trn ?? "",
  });
  const [docs, setDocs] = useState(documents);

  useEffect(() => {
    setForm({
      nationality: fields.nationality ?? "",
      emirates_id: fields.emirates_id ?? "",
      passport_no: fields.passport_no ?? "",
      trn: fields.trn ?? "",
    });
    setDocs(documents);
    if (personKycReadiness(fields, documents).status !== "not_started") {
      setExpanded(true);
    }
  }, [fields.nationality, fields.emirates_id, fields.passport_no, fields.trn, documents]);

  const readiness = useMemo(() => personKycReadiness(form, docs), [form, docs]);
  const kycCategories = docCategories.filter(
    (cat) => cat.value === "emirates_id" || cat.value === "passport" || cat.value.includes("visa")
  );
  const uploadCategories = kycCategories.length > 0 ? kycCategories : docCategories;

  function saveField(patch: Partial<typeof form>) {
    const next = { ...form, ...patch };
    setForm(next);
    startTransition(async () => {
      const result = await updatePersonKyc(
        customerId,
        {
          nationality: next.nationality.trim() || null,
          emirates_id: next.emirates_id.trim() || null,
          passport_no: next.passport_no.trim() || null,
          trn: next.trn.trim() || null,
        },
        leadId
      );
      if (result.ok) {
        toast.success("KYC saved");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not save KYC");
      }
    });
  }

  const shell =
    variant === "sidebar"
      ? "overflow-hidden rounded-[14px] border border-border bg-card p-4"
      : "rounded-[14px] border border-border bg-card px-[26px] py-6";

  return (
    <section className={shell}>
      {variant === "card" && <div className="-mx-[26px] -mt-6 mb-4 h-0.5 bg-primary" />}
      {variant === "sidebar" && <div className="-mx-4 -mt-4 mb-4 h-0.5 bg-primary" />}

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <h2
              className={cn(
                "font-semibold text-foreground",
                variant === "card" && "font-heading text-[1.12rem]"
              )}
              style={variant === "card" ? { fontFamily: "var(--font-display), serif" } : undefined}
            >
              KYC
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Saved on the person record — flows to deals and stays on the profile when they become a client.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <KycFormDialog customerId={customerId} leadId={leadId} person={person} canEdit={canEdit} />
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
              TONE_CLASS[kycStatusTone(readiness.status)]
            )}
          >
            {kycStatusLabel(readiness.status)}
          </span>
          {personHref ? (
            <Link
              href={personHref}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Profile <ExternalLink className="h-3 w-3" />
            </Link>
          ) : null}
        </div>
      </div>

      {readiness.status === "not_started" && !expanded && canEdit ? (
        <div className="rounded-[10px] border border-dashed border-primary/30 bg-primary/5 px-4 py-5 text-center">
          <p className="text-sm text-foreground">Identity not captured yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Start here before convert — Emirates ID or passport (number or scan).
          </p>
          <Button size="sm" className="mt-3" onClick={() => setExpanded(true)}>
            Start KYC
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {readiness.missing.length > 0 && readiness.status !== "not_started" ? (
            <p className="rounded-[8px] bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Still needed: {readiness.missing.join(", ")}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nationality</Label>
              <Input
                value={form.nationality}
                disabled={!canEdit || pending}
                placeholder="e.g. UAE, British"
                className="h-9"
                onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                onBlur={() => {
                  if ((fields.nationality ?? "") !== form.nationality.trim()) {
                    saveField({ nationality: form.nationality });
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">TRN</Label>
              <Input
                value={form.trn}
                disabled={!canEdit || pending}
                className="h-9"
                onChange={(e) => setForm({ ...form, trn: e.target.value })}
                onBlur={() => {
                  if ((fields.trn ?? "") !== form.trn.trim()) saveField({ trn: form.trn });
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Emirates ID</Label>
              <Input
                value={form.emirates_id}
                disabled={!canEdit || pending}
                placeholder="784-XXXX-XXXXXXX-X"
                className="h-9"
                onChange={(e) => setForm({ ...form, emirates_id: e.target.value })}
                onBlur={() => {
                  if ((fields.emirates_id ?? "") !== form.emirates_id.trim()) {
                    saveField({ emirates_id: form.emirates_id });
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Passport no.</Label>
              <Input
                value={form.passport_no}
                disabled={!canEdit || pending}
                className="h-9"
                onChange={(e) => setForm({ ...form, passport_no: e.target.value })}
                onBlur={() => {
                  if ((fields.passport_no ?? "") !== form.passport_no.trim()) {
                    saveField({ passport_no: form.passport_no });
                  }
                }}
              />
            </div>
          </div>

          {canEdit && pending ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
            </p>
          ) : null}

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ID documents</p>
              <span className="font-mono text-[11px] text-muted-foreground">{docs.length}</span>
            </div>
            {canEdit ? (
              <DocumentUploadDialog
                entityType="customer"
                entityId={customerId}
                categories={uploadCategories}
                onSaved={(doc) => {
                  if (doc) setDocs((prev) => [{ ...doc, category: doc.category || "other" }, ...prev]);
                  router.refresh();
                }}
                trigger={
                  <span className="mb-3 block cursor-pointer rounded-[10px] border border-dashed border-border px-4 py-4 text-center transition-colors hover:border-primary hover:bg-muted/40">
                    <b className="text-sm font-semibold text-primary">Upload Emirates ID or passport</b>
                    <p className="mt-1 text-xs text-muted-foreground">Stored on the person profile</p>
                  </span>
                }
              />
            ) : null}
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ID documents yet.</p>
            ) : (
              <LeadDocumentsList documents={docs} onChange={setDocs} categories={docCategories} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
