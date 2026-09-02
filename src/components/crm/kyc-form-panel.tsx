"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updatePersonKycForm } from "@/server/kyc";
import type { IndividualKycForm, KycPersonRecord } from "@/lib/kyc-form";
import { toast } from "sonner";
import { Download, Eye, FileOutput, Loader2 } from "lucide-react";

function YesNoRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: IndividualKycForm["pep_self"];
  onChange: (next: IndividualKycForm["pep_self"]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border/70 p-3">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {(["yes", "no"] as const).map((opt) => (
          <Button
            key={opt}
            type="button"
            size="sm"
            variant={value?.answer === opt ? "default" : "outline"}
            disabled={disabled}
            onClick={() => onChange({ ...value, answer: opt })}
          >
            {opt === "yes" ? "Yes" : "No"}
          </Button>
        ))}
      </div>
      {value?.answer === "yes" ? (
        <Input
          value={value.specify ?? ""}
          disabled={disabled}
          placeholder="Specify"
          className="h-9"
          onChange={(e) => onChange({ ...value, specify: e.target.value })}
        />
      ) : null}
    </div>
  );
}

function ChoiceRow<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null | undefined;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={value === opt.value ? "default" : "outline"}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function useKycFormState({
  customerId,
  leadId,
  person,
  canEdit,
  autoSave = false,
  onSaved,
}: {
  customerId: string;
  leadId?: string | null;
  person: KycPersonRecord;
  canEdit: boolean;
  autoSave?: boolean;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pdfReady, setPdfReady] = useState(false);
  const [form, setForm] = useState<IndividualKycForm>(person.kyc_form ?? {});
  const [core, setCore] = useState({
    nationality: person.nationality ?? "",
    emirates_id: person.emirates_id ?? "",
    passport_no: person.passport_no ?? "",
    trn: person.trn ?? "",
  });
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setForm(person.kyc_form ?? {});
    setCore({
      nationality: person.nationality ?? "",
      emirates_id: person.emirates_id ?? "",
      passport_no: person.passport_no ?? "",
      trn: person.trn ?? "",
    });
    dirtyRef.current = false;
    setPdfReady(false);
  }, [person]);

  function save() {
    startTransition(async () => {
      const result = await updatePersonKycForm(
        customerId,
        {
          nationality: core.nationality.trim() || null,
          emirates_id: core.emirates_id.trim() || null,
          passport_no: core.passport_no.trim() || null,
          trn: core.trn.trim() || null,
          kyc_form: form,
        },
        leadId
      );
      if (result.ok) {
        dirtyRef.current = false;
        onSaved?.();
        router.refresh();
        if (!autoSave) toast.success("KYC form saved");
      } else {
        toast.error(result.error ?? "Could not save KYC form");
      }
    });
  }

  function markDirty() {
    setPdfReady(false);
    if (!canEdit || !autoSave) return;
    dirtyRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (dirtyRef.current) save();
    }, 1500);
  }

  function updateForm(next: IndividualKycForm) {
    setForm(next);
    markDirty();
  }

  function updateCore(next: typeof core) {
    setCore(next);
    markDirty();
  }

  function generatePdf() {
    startTransition(async () => {
      const result = await updatePersonKycForm(
        customerId,
        {
          nationality: core.nationality.trim() || null,
          emirates_id: core.emirates_id.trim() || null,
          passport_no: core.passport_no.trim() || null,
          trn: core.trn.trim() || null,
          kyc_form: form,
        },
        leadId
      );
      if (result.ok) {
        dirtyRef.current = false;
        setPdfReady(true);
        onSaved?.();
        router.refresh();
        toast.success("PDF generated — preview or download below");
      } else {
        toast.error(result.error ?? "Could not generate PDF");
      }
    });
  }

  function previewPdf() {
    window.open(
      `/api/customers/${customerId}/kyc-form/pdf?inline=1&t=${Date.now()}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function downloadPdf() {
    window.open(`/api/customers/${customerId}/kyc-form/pdf?t=${Date.now()}`, "_blank", "noopener,noreferrer");
  }

  return {
    pending,
    form,
    setForm: updateForm,
    core,
    setCore: updateCore,
    save,
    generatePdf,
    previewPdf,
    downloadPdf,
    pdfReady,
    person,
    canEdit,
  };
}

export function KycFormFields({
  person,
  form,
  setForm,
  core,
  setCore,
  pending,
  canEdit,
}: {
  person: KycPersonRecord;
  form: IndividualKycForm;
  setForm: (next: IndividualKycForm) => void;
  core: { nationality: string; emirates_id: string; passport_no: string; trn: string };
  setCore: (next: typeof core) => void;
  pending: boolean;
  canEdit: boolean;
}) {
  return (
    <Tabs defaultValue="customer" className="flex min-h-0 flex-1 flex-col">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="customer">Customer</TabsTrigger>
        <TabsTrigger value="address">Address</TabsTrigger>
        <TabsTrigger value="financial">Financial</TabsTrigger>
        <TabsTrigger value="employment">Employment</TabsTrigger>
      </TabsList>

      <div className="min-h-0 flex-1 overflow-y-auto py-3">
        <TabsContent value="customer" className="mt-0 space-y-3">
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Full name:</span>{" "}
            <span className="font-medium">{person.name}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Date of birth</Label>
              <Input
                type="date"
                value={form.date_of_birth ?? ""}
                disabled={!canEdit || pending}
                className="h-9"
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value || null })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Passport number</Label>
              <Input
                value={core.passport_no}
                disabled={!canEdit || pending}
                className="h-9"
                onChange={(e) => setCore({ ...core, passport_no: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nationality</Label>
              <Input
                value={core.nationality}
                disabled={!canEdit || pending}
                className="h-9"
                onChange={(e) => setCore({ ...core, nationality: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Emirates ID</Label>
              <Input
                value={core.emirates_id}
                disabled={!canEdit || pending}
                className="h-9"
                onChange={(e) => setCore({ ...core, emirates_id: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">TRN</Label>
              <Input
                value={core.trn}
                disabled={!canEdit || pending}
                className="h-9"
                onChange={(e) => setCore({ ...core, trn: e.target.value })}
              />
            </div>
          </div>

          <ChoiceRow
            label="Gender"
            value={form.gender}
            disabled={!canEdit || pending}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
            onChange={(gender) => setForm({ ...form, gender })}
          />

          <div className="space-y-2">
            <Label className="text-xs">UAE residency</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={form.uae_residency === true ? "default" : "outline"}
                disabled={!canEdit || pending}
                onClick={() => setForm({ ...form, uae_residency: true })}
              >
                Yes
              </Button>
              <Button
                type="button"
                size="sm"
                variant={form.uae_residency === false ? "default" : "outline"}
                disabled={!canEdit || pending}
                onClick={() => setForm({ ...form, uae_residency: false })}
              >
                No
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Other nationality (if any)</Label>
            <Input
              value={form.other_nationality ?? ""}
              disabled={!canEdit || pending}
              className="h-9"
              onChange={(e) => setForm({ ...form, other_nationality: e.target.value || null })}
            />
          </div>

          <YesNoRow
            label="Politically exposed person (PEP)?"
            value={form.pep_self}
            disabled={!canEdit || pending}
            onChange={(pep_self) => setForm({ ...form, pep_self })}
          />
          <YesNoRow
            label="Relative / family member of a PEP?"
            value={form.pep_relative}
            disabled={!canEdit || pending}
            onChange={(pep_relative) => setForm({ ...form, pep_relative })}
          />
          <YesNoRow
            label="Associate of a PEP?"
            value={form.pep_associate}
            disabled={!canEdit || pending}
            onChange={(pep_associate) => setForm({ ...form, pep_associate })}
          />
          <YesNoRow
            label="Subject to sanctions (UN, OFAC, EU, other)?"
            value={form.sanctions}
            disabled={!canEdit || pending}
            onChange={(sanctions) => setForm({ ...form, sanctions })}
          />
        </TabsContent>

        <TabsContent value="address" className="mt-0 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["country", "Country"],
                ["city", "City"],
                ["area", "Area"],
                ["street", "Street"],
                ["building", "Building / villa"],
                ["flat", "Flat / house no."],
                ["po_box", "P.O. Box"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Input
                  value={(form[key] as string | null | undefined) ?? ""}
                  disabled={!canEdit || pending}
                  className="h-9"
                  onChange={(e) => setForm({ ...form, [key]: e.target.value || null })}
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input value={person.email ?? ""} disabled className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Contact number</Label>
              <Input value={person.phone ?? ""} disabled className="h-9" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Address in other country of residence</Label>
            <Textarea
              value={form.other_country_address ?? ""}
              disabled={!canEdit || pending}
              rows={3}
              onChange={(e) => setForm({ ...form, other_country_address: e.target.value || null })}
            />
          </div>
        </TabsContent>

        <TabsContent value="financial" className="mt-0 space-y-3">
          <ChoiceRow
            label="Main source of income"
            value={form.income_source}
            disabled={!canEdit || pending}
            options={[
              { value: "salary", label: "Salary" },
              { value: "self_employed", label: "Self-employed" },
              { value: "mortgage", label: "Mortgage" },
              { value: "other", label: "Other" },
            ]}
            onChange={(income_source) => setForm({ ...form, income_source })}
          />
          {form.income_source === "other" ? (
            <div className="space-y-1.5">
              <Label className="text-xs">Other income (specify)</Label>
              <Input
                value={form.income_other ?? ""}
                disabled={!canEdit || pending}
                className="h-9"
                onChange={(e) => setForm({ ...form, income_other: e.target.value || null })}
              />
            </div>
          ) : null}
          <ChoiceRow
            label="Mode of transfer"
            value={form.transfer_mode}
            disabled={!canEdit || pending}
            options={[
              { value: "bank_transfer", label: "Bank transfer" },
              { value: "cash", label: "Cash" },
              { value: "cheque", label: "Manager's cheque" },
              { value: "virtual_currency", label: "Virtual currency" },
            ]}
            onChange={(transfer_mode) => setForm({ ...form, transfer_mode })}
          />
          <div className="space-y-1.5">
            <Label className="text-xs">Main source of wealth</Label>
            <Textarea
              value={form.source_of_wealth ?? ""}
              disabled={!canEdit || pending}
              rows={4}
              onChange={(e) => setForm({ ...form, source_of_wealth: e.target.value || null })}
            />
          </div>
        </TabsContent>

        <TabsContent value="employment" className="mt-0 space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold">Employed (if applicable)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["employer_name", "Employer name"],
                  ["designation", "Designation"],
                  ["employer_country", "Employer country"],
                  ["address", "Employer address"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs">{label}</Label>
                  <Input
                    value={form.employed?.[key] ?? ""}
                    disabled={!canEdit || pending}
                    className="h-9"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        employed: { ...form.employed, [key]: e.target.value || null },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold">Self-employed (if applicable)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["business_name", "Business name"],
                  ["line_of_business", "Line of business"],
                  ["country", "Country"],
                  ["address", "Address"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs">{label}</Label>
                  <Input
                    value={form.self_employed?.[key] ?? ""}
                    disabled={!canEdit || pending}
                    className="h-9"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        self_employed: { ...form.self_employed, [key]: e.target.value || null },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Form date (for PDF)</Label>
            <Input
              type="date"
              value={form.form_signed_at ?? new Date().toISOString().slice(0, 10)}
              disabled={!canEdit || pending}
              className="h-9"
              onChange={(e) => setForm({ ...form, form_signed_at: e.target.value || null })}
            />
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}

export function KycFormActions({
  pending,
  canEdit,
  pdfReady,
  onGenerate,
  onPreview,
  onDownload,
  onSave,
}: {
  pending: boolean;
  canEdit: boolean;
  pdfReady: boolean;
  onGenerate: () => void;
  onPreview: () => void;
  onDownload: () => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        {canEdit ? (
          <>
            <Button type="button" size="sm" disabled={pending} onClick={onSave}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-1.5"
              disabled={pending}
              onClick={onGenerate}
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileOutput className="h-3.5 w-3.5" />}
              Generate PDF
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onPreview}>
              <Eye className="h-3.5 w-3.5" />
              Preview
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onDownload}>
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </>
        )}
      </div>

      {canEdit && pdfReady ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-border bg-muted/40 px-3 py-2.5">
          <span className="text-xs font-medium text-muted-foreground">PDF ready</span>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onPreview}>
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onDownload}>
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      ) : null}
    </div>
  );
}
