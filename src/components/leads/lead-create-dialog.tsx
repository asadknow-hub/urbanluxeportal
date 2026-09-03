"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PreferredAreasPicker } from "@/components/leads/preferred-areas-picker";
import { OptionMultiPicker } from "@/components/leads/option-multi-picker";
import { NationalityPicker } from "@/components/leads/nationality-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { choiceItems, scoreFromBand, type LeadFieldOption } from "@/lib/lead-field-options";
import { leadCreateFieldGroups, type LeadSnapshotField } from "@/lib/lead-snapshot-fields";
import { roleLabel } from "@/lib/permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLead, type ExistingCustomerMatch } from "@/server/leads";
import { toast } from "sonner";
import { ChevronDown, Loader2, Plus, X } from "lucide-react";

type FormState = {
  name: string;
  phone: string;
  call_numbers: string[];
  email: string;
  source: string;
  interest: string;
  budget_min: string;
  budget_max: string;
  notes: string;
  assigned_to: string;
  preferred_areas: string[];
  nationality: string;
  financing: string;
  timeframe: string;
  purpose: string;
  bedrooms: string;
  category: string;
  tags: string[];
  score_band: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  phone: "",
  call_numbers: [],
  email: "",
  source: "",
  interest: "",
  budget_min: "",
  budget_max: "",
  notes: "",
  assigned_to: "unassigned",
  preferred_areas: [],
  nationality: "",
  financing: "",
  timeframe: "",
  purpose: "",
  bedrooms: "",
  category: "",
  tags: [],
  score_band: "",
};

function requiredMark(key: string) {
  return key === "name" || key === "phone" || key === "source" || key === "interest";
}

export function LeadCreateDialog({
  agents,
  areas,
  nationalities,
  fieldOptions,
}: {
  agents: { id: string; full_name: string; role: string }[];
  areas: string[];
  nationalities: string[];
  fieldOptions: Record<string, LeadFieldOption[]>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const groups = useMemo(() => leadCreateFieldGroups(), []);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [callDraft, setCallDraft] = useState("");
  const [existingCustomer, setExistingCustomer] = useState<ExistingCustomerMatch | null>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setCallDraft("");
      setExistingCustomer(null);
    }
  }, [open]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addCallNumber() {
    const next = callDraft.trim();
    if (!next) return;
    if (form.call_numbers.includes(next) || form.phone.trim() === next) {
      toast.error("Number already added");
      return;
    }
    set("call_numbers", [...form.call_numbers, next]);
    setCallDraft("");
  }

  function buildPayload(existingCustomerId?: string | null) {
    const scoreOption = (fieldOptions.score ?? []).find((row) => row.value === form.score_band);
    return {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      call_numbers: form.call_numbers,
      email: form.email.trim() || undefined,
      existing_customer_id: existingCustomerId ?? null,
      source: form.source,
      interest: form.interest,
      budget_min: form.budget_min ? Number(form.budget_min) * 100 : null,
      budget_max: form.budget_max ? Number(form.budget_max) * 100 : null,
      preferred_areas: form.preferred_areas,
      notes: form.notes.trim() || null,
      assigned_to: form.assigned_to === "unassigned" ? null : form.assigned_to,
      nationality: form.nationality || null,
      financing: form.financing || null,
      timeframe: form.timeframe || null,
      purpose: form.purpose || null,
      bedrooms: form.bedrooms || null,
      category: form.category || null,
      tags: form.tags,
      score: scoreOption ? scoreFromBand(scoreOption) : null,
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("WhatsApp is required");
      return;
    }
    if (!form.source) {
      toast.error("Source is required — pick one from Lead Settings");
      return;
    }
    if (!form.interest) {
      toast.error("Interest is required — pick one from Lead Settings");
      return;
    }

    startTransition(async () => {
      const result = await createLead(buildPayload());
      if (result.ok && result.data && "needsConfirm" in result.data && result.data.needsConfirm) {
        setExistingCustomer(result.data.customer);
        return;
      }
      if (result.ok && result.data && "id" in result.data) {
        toast.success("Lead created");
        setOpen(false);
        router.push(`/leads/${result.data.id}`);
      } else {
        toast.error(result.error ?? "Failed to create lead");
      }
    });
  }

  function confirmLinkExisting() {
    if (!existingCustomer) return;
    startTransition(async () => {
      const result = await createLead(buildPayload(existingCustomer.id));
      if (result.ok && result.data && "id" in result.data) {
        toast.success(`Lead created under ${existingCustomer.name}`);
        setExistingCustomer(null);
        setOpen(false);
        router.push(`/leads/${result.data.id}`);
      } else {
        toast.error(result.error ?? "Failed to create lead");
      }
    });
  }

  function renderField(field: LeadSnapshotField) {
    const options = fieldOptions[field.key] ?? [];
    const label = (
      <Label className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {field.label}
        {requiredMark(field.key) ? <span className="ml-0.5 text-primary">*</span> : null}
      </Label>
    );

    if (field.key === "name") {
      return (
        <Field key={field.key}>
          {label}
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            placeholder="Full name"
            className="h-10"
          />
        </Field>
      );
    }
    if (field.key === "phone") {
      return (
        <Field key={field.key}>
          {label}
          <Input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            required
            placeholder="+971 50 123 4567"
            className="h-10"
          />
        </Field>
      );
    }
    if (field.key === "call_numbers") {
      return (
        <div key={field.key} className="sm:col-span-2 space-y-1.5">
          {label}
          <div className="flex gap-2">
            <Input
              value={callDraft}
              onChange={(e) => setCallDraft(e.target.value)}
              placeholder="+971 4 123 4567 — dial number"
              className="h-10"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCallNumber();
                }
              }}
            />
            <Button type="button" variant="outline" className="h-10 shrink-0" onClick={addCallNumber}>
              Add
            </Button>
          </div>
          {form.call_numbers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {form.call_numbers.map((num) => (
                <span
                  key={num}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs"
                >
                  {num}
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => set("call_numbers", form.call_numbers.filter((n) => n !== num))}
                    aria-label={`Remove ${num}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Optional. Add one or more numbers for calling (not WhatsApp).</p>
          )}
        </div>
      );
    }
    if (field.key === "email") {
      return (
        <Field key={field.key}>
          {label}
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="email@example.com"
            className="h-10"
          />
        </Field>
      );
    }
    if (field.key === "nationality") {
      return (
        <Field key={field.key}>
          {label}
          <NationalitySelect
            value={form.nationality}
            options={nationalities}
            onChange={(next) => set("nationality", next)}
          />
        </Field>
      );
    }
    if (field.key === "preferred_areas") {
      return (
        <div key={field.key} className="sm:col-span-2">
          <PreferredAreasPicker
            areas={areas}
            value={form.preferred_areas}
            onChange={(next) => set("preferred_areas", next)}
            description="From Lead Settings → Fields → Preferred Areas."
          />
        </div>
      );
    }
    if (field.key === "tags") {
      return (
        <div key={field.key} className="sm:col-span-2">
          {label}
          {options.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">Add tags in Lead Settings → Fields.</p>
          ) : (
            <div className="mt-1.5">
              <OptionMultiPicker
                value={form.tags}
                options={choiceItems(options)}
                onChange={(next) => set("tags", next)}
              />
            </div>
          )}
        </div>
      );
    }
    if (field.key === "notes") {
      return (
        <div key={field.key} className="sm:col-span-2">
          {label}
          <Textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Anything the agent should know…"
            rows={3}
            className="mt-1.5 text-sm"
          />
        </div>
      );
    }
    if (field.key === "budget") {
      return (
        <Field key={field.key}>
          {label}
          <OptionSelect
            value={
              options.find(
                (b) =>
                  Number(b.extra.min_fils) === Number(form.budget_min) * 100 &&
                  Number(b.extra.max_fils) === Number(form.budget_max) * 100
              )?.value ?? ""
            }
            options={options}
            placeholder="Select a band"
            emptyHint="Add budget bands in Lead Settings → Fields."
            onChange={(value) => {
              const band = options.find((b) => b.value === value);
              if (!band) {
                setForm((prev) => ({ ...prev, budget_min: "", budget_max: "" }));
                return;
              }
              setForm((prev) => ({
                ...prev,
                budget_min: String(Number(band.extra.min_fils) / 100),
                budget_max: String(Number(band.extra.max_fils) / 100),
              }));
            }}
          />
        </Field>
      );
    }
    if (field.key === "score") {
      return (
        <Field key={field.key}>
          {label}
          <OptionSelect
            value={form.score_band}
            options={options}
            placeholder="Optional"
            emptyHint="Add score bands in Lead Settings → Fields."
            onChange={(value) => set("score_band", value)}
          />
        </Field>
      );
    }

    const formKey = field.key as keyof FormState;
    const current = typeof form[formKey] === "string" ? (form[formKey] as string) : "";
    return (
      <Field key={field.key}>
        {label}
        <OptionSelect
          value={current}
          options={options}
          placeholder={requiredMark(field.key) ? "Select" : "Optional"}
          emptyHint={`Add ${field.label.toLowerCase()} options in Lead Settings → Fields.`}
          onChange={(value) => set(formKey, value)}
        />
      </Field>
    );
  }

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add lead
          </Button>
        )}
      />
      <DialogContent className="max-h-[90vh] w-[min(48rem,calc(100vw-2rem))] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="h-0.5 bg-primary" />
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="font-heading text-xl" style={{ fontFamily: "var(--font-display), serif" }}>
            New lead
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Fields and lists come from Lead Settings. Name, WhatsApp, source, and interest are required.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="scrollbar-gold max-h-[min(72vh,40rem)] space-y-5 overflow-y-auto px-6 py-5">
          {groups.map((group) => (
            <section key={group.name}>
              <p className="mb-3 flex justify-center">
                <span className="rounded-full bg-accent px-3 py-0.5 text-center text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-secondary">
                  {group.name}
                </span>
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{group.fields.map(renderField)}</div>
            </section>
          ))}

          <section>
            <p className="mb-3 flex justify-center">
              <span className="rounded-full bg-accent px-3 py-0.5 text-center text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-secondary">
                Assignment
              </span>
            </p>
            <Field>
              <Label className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Assign to
              </Label>
              <Select value={form.assigned_to} onValueChange={(v) => set("assigned_to", v ?? "unassigned")}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Round-robin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned (round-robin)</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.full_name} ({roleLabel(a.role)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </section>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" className="h-10 px-5" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="h-10 px-5" disabled={pending || !form.name.trim() || !form.phone.trim()}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

      <Dialog open={!!existingCustomer} onOpenChange={(v) => !v && setExistingCustomer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Owner already exists</DialogTitle>
          </DialogHeader>
          {existingCustomer ? (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                A customer already matches contact details on this lead. Create a new lead under the same owner?
              </p>
              <div className="rounded-[10px] border border-border bg-muted/30 p-3">
                <p className="font-semibold text-foreground">{existingCustomer.name}</p>
                <p className="mt-1 text-xs capitalize text-muted-foreground">{existingCustomer.status}</p>
                {existingCustomer.phone ? <p className="mt-1 text-xs">{existingCustomer.phone}</p> : null}
                {existingCustomer.email ? <p className="text-xs">{existingCustomer.email}</p> : null}
                {existingCustomer.nationality ? (
                  <p className="text-xs text-muted-foreground">Nationality: {existingCustomer.nationality}</p>
                ) : null}
              </div>
              {existingCustomer.matchReasons?.length ? (
                <div className="rounded-[10px] border border-border p-3">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Matched on
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {existingCustomer.matchReasons.map((reason, idx) => (
                      <li key={`${reason.field}-${idx}`} className="text-xs text-foreground">
                        <span className="font-medium">{matchFieldLabel(reason.field)}</span>
                        {": "}
                        <span className="text-muted-foreground">{reason.leadValue}</span>
                        {reason.ownerValue !== reason.leadValue ? (
                          <span className="text-muted-foreground">
                            {" "}
                            → owner {reason.ownerValue}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExistingCustomer(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={pending} onClick={confirmLinkExisting}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create lead under this owner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

function matchFieldLabel(field: "whatsapp" | "call_number" | "email") {
  if (field === "whatsapp") return "WhatsApp";
  if (field === "call_number") return "Call number";
  return "Email";
}

function OptionSelect({
  value,
  options,
  placeholder,
  emptyHint,
  onChange,
}: {
  value: string;
  options: LeadFieldOption[];
  placeholder: string;
  emptyHint: string;
  onChange: (value: string) => void;
}) {
  if (options.length === 0) {
    return <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">{emptyHint}</p>;
  }
  return (
    <Select value={value || undefined} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger className="h-10">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NationalitySelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (options.length === 0) {
    return <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">Add nationalities in Lead Settings → Fields.</p>;
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm">
        <span className={value ? "text-foreground" : "text-muted-foreground"}>{value || "Select nationality"}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-[20rem] p-2">
        <NationalityPicker
          value={value}
          options={options}
          autoFocus
          onChange={(next) => {
            onChange(next);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
